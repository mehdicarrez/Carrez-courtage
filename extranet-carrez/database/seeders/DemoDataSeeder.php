<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Avenant;
use App\Models\BaremeCommission;
use App\Models\Bordereau;
use App\Models\Branche;
use App\Models\Client;
use App\Models\Contestation;
use App\Models\Contrat;
use App\Models\Conversation;
use App\Models\ConventionPartenariat;
use App\Models\DemandeTarification;
use App\Models\Devis;
use App\Models\Document;
use App\Models\Grossiste;
use App\Models\LigneCommission;
use App\Models\LigneGarantie;
use App\Models\Message;
use App\Models\Motif;
use App\Models\Notification;
use App\Models\Organisation;
use App\Models\PorteurRisque;
use App\Models\Produit;
use App\Models\Quittance;
use App\Models\SchemaFormulaire;
use App\Models\Sinistre;
use App\Models\TypeDocument;
use App\Models\User;
use App\Models\Vehicule;
use App\Services\CommissionCalculator;
use App\Services\ReferenceService;
use App\Services\StateMachine;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $refs = app(ReferenceService::class);
        $calc = app(CommissionCalculator::class);

        // ====================================================================
        // ORGANISATIONS
        // ====================================================================
        $cabinet = Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => 'CABINET',
            'raison_sociale' => 'CARREZ CO COURTAGE',
            'forme_juridique' => 'SELAS',
            'siren' => '853412367',
            'numero_orias' => '19001234',
            'categories_orias' => ['COURTIER'],
            'statut' => 'ACTIVE',
            'date_activation' => now()->subYears(3),
        ]);

        $partenaires = [];
        $defsPartenaires = [
            ['raison_sociale' => 'COURTIER XXI', 'forme_juridique' => 'SARL', 'siren' => '912563378', 'orias' => '21007890'],
            ['raison_sociale' => 'CAFIM CONSEIL', 'forme_juridique' => 'SAS', 'siren' => '810447855', 'orias' => '21004561'],
            ['raison_sociale' => 'ATLAS COURTAGE', 'forme_juridique' => 'EURL', 'siren' => '752313612', 'orias' => '18009933'],
        ];
        foreach ($defsPartenaires as $i => $d) {
            $partenaires[$i] = Organisation::create([
                'id' => (string) Str::uuid(),
                'type' => 'PARTENAIRE',
                'raison_sociale' => $d['raison_sociale'],
                'forme_juridique' => $d['forme_juridique'],
                'siren' => $d['siren'],
                'numero_orias' => $d['orias'],
                'categories_orias' => ['COA', 'MIOBSP'],
                'statut' => 'ACTIVE',
                'date_activation' => now()->subYear(),
            ]);
        }

        // ====================================================================
        // UTILISATEURS
        // ====================================================================
        $admin = User::create(['name' => 'Camille Carrez', 'email' => 'admin@carrez.local', 'password' => 'password', 'role' => User::ROLE_ADMIN, 'organisation_id' => $cabinet->id, 'actif' => true]);
        $gestionnaire = User::create(['name' => 'Géraldine Gestion', 'email' => 'gestion@carrez.local', 'password' => 'password', 'role' => User::ROLE_GESTIONNAIRE, 'organisation_id' => $cabinet->id, 'actif' => true]);
        $conseiller = User::create(['name' => 'Charles Consultant', 'email' => 'conseiller@carrez.local', 'password' => 'password', 'role' => User::ROLE_CONSEILLER, 'organisation_id' => $cabinet->id, 'actif' => true, 'access_level' => User::ACCESS_CLIENTS_attribues]);
        $comptable = User::create(['name' => 'Coralie Compta', 'email' => 'compta@carrez.local', 'password' => 'password', 'role' => User::ROLE_COMPTABLE, 'organisation_id' => $cabinet->id, 'actif' => true]);

        $dirigeants = [];
        $collaborateurs = [];
        $dirigeant1 = User::create(['name' => 'David Dirigeant', 'email' => 'dirigeant@courtiervii.local', 'password' => 'password', 'role' => User::ROLE_DIRIGEANT_PARTENAIRE, 'organisation_id' => $partenaires[0]->id, 'actif' => true]);
        $collab1 = User::create(['name' => 'Claire Collaboratrice', 'email' => 'collab@courtiervii.local', 'password' => 'password', 'role' => User::ROLE_COLLABORATEUR_PARTENAIRE, 'organisation_id' => $partenaires[0]->id, 'actif' => true, 'visible_commissions' => true]);
        $lecteur1 = User::create(['name' => 'Léon Lecteur', 'email' => 'lecteur@courtiervii.local', 'password' => 'password', 'role' => User::ROLE_LECTEUR_PARTENAIRE, 'organisation_id' => $partenaires[0]->id, 'actif' => true]);

        $dirigeants[1] = User::create(['name' => 'Fatima Finance', 'email' => 'dirigeant@cafim.local', 'password' => 'password', 'role' => User::ROLE_DIRIGEANT_PARTENAIRE, 'organisation_id' => $partenaires[1]->id, 'actif' => true]);
        $collaborateurs[1] = User::create(['name' => 'Nadia Négociation', 'email' => 'collab@cafim.local', 'password' => 'password', 'role' => User::ROLE_COLLABORATEUR_PARTENAIRE, 'organisation_id' => $partenaires[1]->id, 'actif' => true, 'visible_commissions' => true]);

        $dirigeants[2] = User::create(['name' => 'Omar Orateur', 'email' => 'dirigeant@atlas.local', 'password' => 'password', 'role' => User::ROLE_DIRIGEANT_PARTENAIRE, 'organisation_id' => $partenaires[2]->id, 'actif' => true]);
        $collaborateurs[2] = User::create(['name' => 'Sami Statut', 'email' => 'collab@atlas.local', 'password' => 'password', 'role' => User::ROLE_COLLABORATEUR_PARTENAIRE, 'organisation_id' => $partenaires[2]->id, 'actif' => true, 'visible_commissions' => true]);

        // 10 conseillers supplémentaires (accès limité aux clients attribués)
        $conseillers = [];
        $nomsConseillers = [
            ['name' => 'Alice Dupont',     'email' => 'alice.conseiller@carrez.local'],
            ['name' => 'Bruno Martin',     'email' => 'bruno.conseiller@carrez.local'],
            ['name' => 'Camille Leroy',    'email' => 'camille.conseiller@carrez.local'],
            ['name' => 'David Moreau',     'email' => 'david.conseiller@carrez.local'],
            ['name' => 'Émilie Fontaine',  'email' => 'emilie.conseiller@carrez.local'],
            ['name' => 'François Garnier', 'email' => 'francois.conseiller@carrez.local'],
            ['name' => 'Geneviève Royer',  'email' => 'genevieve.conseiller@carrez.local'],
            ['name' => 'Hugo Blanchard',   'email' => 'hugo.conseiller@carrez.local'],
            ['name' => 'Isabelle Chevalier','email' => 'isabelle.conseiller@carrez.local'],
            ['name' => 'Julien Lefebvre',  'email' => 'julien.conseiller@carrez.local'],
        ];
        foreach ($nomsConseillers as $nc) {
            $conseillers[] = User::create([
                'name' => $nc['name'],
                'email' => $nc['email'],
                'password' => 'password',
                'role' => User::ROLE_CONSEILLER,
                'organisation_id' => $cabinet->id,
                'actif' => true,
                'access_level' => User::ACCESS_CLIENTS_attribues,
            ]);
        }

        $cabinet->update(['admin_id' => $admin->id]);
        $partenaires[0]->update(['admin_id' => $dirigeant1->id]);
        $partenaires[1]->update(['admin_id' => $dirigeants[1]->id]);
        $partenaires[2]->update(['admin_id' => $dirigeants[2]->id]);

        // ====================================================================
        // RÉFÉRENTIELS : branches + porteurs + grossistes + produits + schémas
        // ====================================================================
        $porteurs = [];
        foreach (['AXA France', 'MMA Assurances', 'Allianz', 'Axa Santé', 'Generali', 'SMABTP'] as $nom) {
            $porteurs[] = PorteurRisque::create(['nom' => $nom, 'orias' => '07'.random_int(100000, 999999)]);
        }
        $grossistes = [];
        foreach (['MMA Gestion Santé', 'GPS Addevic', 'Sferic Re', 'Cowork Santé'] as $nom) {
            $grossistes[] = Grossiste::create(['nom' => $nom, 'orias' => '07'.random_int(100000, 999999)]);
        }

        $branches = [];
        $defsBranches = [
            ['code' => 'SANTE', 'nom' => 'Santé', 'famille' => 'Personnes'],
            ['code' => 'PREVOYANCE', 'nom' => 'Prévoyance', 'famille' => 'Personnes'],
            ['code' => 'AUTO', 'nom' => 'Automobile', 'famille' => 'Dommages-roulant'],
            ['code' => 'HABITATION', 'nom' => 'Habitation', 'famille' => 'Dommages-habitation'],
            ['code' => 'PRO-PRO', 'nom' => 'Professionnels', 'famille' => 'Professionnels'],
            ['code' => 'FLOTTE', 'nom' => 'Flotte automobile', 'famille' => 'Dommages-roulant'],
        ];
        foreach ($defsBranches as $d) {
            $branches[$d['code']] = Branche::create(['code' => $d['code'], 'nom' => $d['nom'], 'famille' => $d['famille']]);
        }

        $defsProduits = [
            ['code' => 'SANTE-REF', 'nom' => 'Santé Référence', 'branche' => 'SANTE'],
            ['code' => 'SANTE-PREMIUM', 'nom' => 'Santé Premium', 'branche' => 'SANTE'],
            ['code' => 'PREV-DECES', 'nom' => 'Prévoyance Décès', 'branche' => 'PREVOYANCE'],
            ['code' => 'PREV-IT', 'nom' => 'Arrêt de travail', 'branche' => 'PREVOYANCE'],
            ['code' => 'AUTO-TOUS-RISQUES', 'nom' => 'Auto Tous Risques', 'branche' => 'AUTO'],
            ['code' => 'AUTO-TIERS', 'nom' => 'Auto Tiers Simple', 'branche' => 'AUTO'],
            ['code' => 'HAB-MULTI', 'nom' => 'Multirisque Habitation', 'branche' => 'HABITATION'],
            ['code' => 'PRO-RC', 'nom' => 'RC Professionnelle', 'branche' => 'PRO-PRO'],
            ['code' => 'FLOTTE-1', 'nom' => 'Flotte Entreprise', 'branche' => 'FLOTTE'],
        ];
        $produits = [];
        foreach ($defsProduits as $dp) {
            $produits[$dp['code']] = Produit::create([
                'code' => $dp['code'],
                'nom' => $dp['nom'],
                'branche_id' => $branches[$dp['branche']]->id,
                'porteur_risque_id' => $porteurs[array_rand($porteurs)]->id,
                'grossiste_id' => $grossistes[array_rand($grossistes)]->id,
            ]);
        }

        // Schémas de formulaire pour chaque branche
        $schemaGenerique = [
            'fields' => [
                ['name' => 'type_souscripteur', 'label' => 'Type de souscripteur', 'type' => 'select', 'required' => true,
                 'options' => [['value' => 'PARTICULIER', 'label' => 'Particulier'], ['value' => 'PROFESSIONNEL', 'label' => 'Professionnel']]],
                ['name' => 'nom', 'label' => 'Nom', 'type' => 'text', 'required' => true],
                ['name' => 'prenom', 'label' => 'Prénom', 'type' => 'text', 'required' => true],
                ['name' => 'date_naissance', 'label' => 'Date de naissance', 'type' => 'date', 'required' => true],
                ['name' => 'adresse', 'label' => 'Adresse', 'type' => 'textarea'],
                ['name' => 'remarques', 'label' => 'Remarques', 'type' => 'textarea'],
            ],
            'pieces' => [
                ['cle' => 'piece_identite', 'libelle' => "Pièce d'identité", 'obligatoire' => true],
            ],
        ];
        foreach ($branches as $code => $branche) {
            SchemaFormulaire::create([
                'branche_id' => $branche->id,
                'version' => 1,
                'schema' => $schemaGenerique,
                'pieces_attendues' => [['type_document_id' => null, 'obligatoire' => true]],
                'courant' => true,
                'auteur_id' => $admin->id,
            ]);
        }

        // Types de documents
        $tdIdentite = TypeDocument::create(['code' => 'PIECE_IDENTITE', 'libelle' => "Pièce d'identité", 'sensible' => true, 'retenue_mois' => 60]);
        $tdKbis = TypeDocument::create(['code' => 'K_BIS', 'libelle' => 'Extrait K-Bis', 'retenue_mois' => 36]);
        $tdQte = TypeDocument::create(['code' => 'QUESTIONNAIRE_SANTE', 'libelle' => 'Questionnaire de santé', 'sensible' => true, 'retenue_mois' => 60]);
        $tdDevis = TypeDocument::create(['code' => 'DEVIS_PDF', 'libelle' => 'Devis PDF', 'retenue_mois' => 60]);
        $tdPolice = TypeDocument::create(['code' => 'POLICE', 'libelle' => 'Police d\'assurance', 'retenue_mois' => 120]);
        $tdSinistre = TypeDocument::create(['code' => 'DOC_SINISTRE', 'libelle' => 'Pièces sinistre', 'retenue_mois' => 120]);
        $tdFicheConseil = TypeDocument::create(['code' => 'FICHE_CONSEIL', 'libelle' => 'Fiche conseil', 'retenue_mois' => 120]);
        $tdOrdreRemplacement = TypeDocument::create(['code' => 'ORDRE_REMPLACEMENT', 'libelle' => 'Ordre de remplacement', 'retenue_mois' => 120]);
        $tdMandat = TypeDocument::create(['code' => 'MANDAT_EXCLUSIF', 'libelle' => 'Mandat exclusif de placement', 'retenue_mois' => 120]);

        // Motifs
        Motif::create(['categorie' => 'REFUS', 'code' => 'AGGRAVATION', 'libelle' => 'Aggravation du risque']);
        Motif::create(['categorie' => 'REFUS', 'code' => 'HORS_CADRE', 'libelle' => 'Hors cadre de souscription']);
        Motif::create(['categorie' => 'RESILIATION', 'code' => 'ECHEANCE_ASSURE', 'libelle' => 'Non renouvellement à échéance']);
        Motif::create(['categorie' => 'RESILIATION', 'code' => 'NON_PAIEMENT', 'libelle' => 'Non paiement des primes']);
        Motif::create(['categorie' => 'SANS_SUITE', 'code' => 'CONTACT_PERDU', 'libelle' => 'Client injoignable']);
        Motif::create(['categorie' => 'SANS_SUITE', 'code' => 'PRIX', 'libelle' => 'Prime trop élevée']);

        // ====================================================================
        // CLIENTS
        // ====================================================================
        $clients = [];
        $defsClients = [
            ['type' => 'PHYSIQUE', 'civilite' => 'M.', 'nom' => 'Durand', 'prenom' => 'Patrick', 'date_naissance' => '1975-06-12', 'telephone' => '0612345678', 'complement' => ['origine' => 'PARRAINAGE']],
            ['type' => 'PHYSIQUE', 'civilite' => 'Mme', 'nom' => 'Martin', 'prenom' => 'Sophie', 'date_naissance' => '1982-03-04', 'telephone' => '0622334455', 'complement' => ['origine' => 'PROSPECTION']],
            ['type' => 'PHYSIQUE', 'civilite' => 'M.', 'nom' => 'Bernard', 'prenom' => 'Lucas', 'date_naissance' => '1990-11-23', 'telephone' => '0633445566', 'complement' => ['origine' => 'INTERNET']],
            ['type' => 'PHYSIQUE', 'civilite' => 'Mme', 'nom' => 'Petit', 'prenom' => 'Élise', 'date_naissance' => '1968-09-15', 'telephone' => '0644556677', 'complement' => ['origine' => 'PARTENAIRE']],
            ['type' => 'PHYSIQUE', 'civilite' => 'M.', 'nom' => 'Moreau', 'prenom' => 'Antoine', 'date_naissance' => '1985-01-30', 'telephone' => '0655667788', 'complement' => ['origine' => 'PROSPECTION']],
            ['type' => 'MORALE', 'raison_sociale' => 'SAS Durand & Fils', 'siren' => '812345678', 'complement' => ['origine' => 'PARRAINAGE']],
            ['type' => 'MORALE', 'raison_sociale' => 'Boulangerie du Centre', 'siren' => '898765432', 'complement' => ['origine' => 'PROSPECTION']],
            ['type' => 'PHYSIQUE', 'civilite' => 'M.', 'nom' => 'Lemoine', 'prenom' => 'Hugo', 'date_naissance' => '1995-07-07', 'telephone' => '0666778899', 'complement' => ['origine' => 'INTERNET']],
            ['type' => 'MORALE', 'raison_sociale' => 'Transports Martin SAS', 'siren' => '845566778', 'complement' => ['origine' => 'AUTRE']],
            ['type' => 'PHYSIQUE', 'civilite' => 'Mme', 'nom' => 'Girard', 'prenom' => 'Aline', 'date_naissance' => '1979-12-01', 'telephone' => '0677889900', 'complement' => ['origine' => 'PARTENAIRE']],
        ];
        foreach ($defsClients as $idx => $dc) {
            $clients[$idx] = Client::create(array_merge([
                'organisation_id' => $partenaires[$idx % 3]->id,
                'type' => $dc['type'],
                'email' => 'client'.($idx + 1).'@example.com',
                'adresse' => ($idx + 1).' rue des Exemples',
                'code_postal' => '750'.str_pad((string)($idx + 1), 2, '0', STR_PAD_LEFT),
                'ville' => 'Paris',
            ], $dc));
        }

        // ====================================================================
        // CONVENTIONS + BARÈMES pour chaque partenaire
        // ====================================================================
        foreach ([0, 1, 2] as $i) {
            ConventionPartenariat::create([
                'organisation_id' => $partenaires[$i]->id,
                'statut' => 'SIGNEE',
                'date_debut' => now()->startOfYear(),
                'date_fin' => now()->endOfYear(),
                'propriete_portefeuille' => 'PARTENAIRE',
            ]);
            BaremeCommission::create([
                'organisation_id' => $partenaires[$i]->id,
                'date_debut' => now()->startOfYear(),
                'assiette' => 'PERCENT_COMMISSION_CABINET',
                'taux_1ere_annee' => 50.0,
                'taux_renouvellement' => 45.0,
                'duree_reprise_mois' => 12,
                'modalite_reprise' => 'PRORATA',
                'regime_tva' => 'EXONERE',
                'courant' => true,
            ]);
        }

        // ====================================================================
        // DEMANDES + DEVIS + CONTRATS (parcours variés)
        // ====================================================================
        // Helper de création d'une demande
        $demandes = [];

        $creerDemande = function ($partenaireIdx, $brancheCode, $clientIdx, $statut) use (&$demandes, &$refs, $partenaires, $branches, $clients, $gestionnaire) {
            $demande = DemandeTarification::create([
                'id' => (string) Str::uuid(),
                'reference' => $refs->demande(),
                'organisation_id' => $partenaires[$partenaireIdx]->id,
                'branche_id' => $branches[$brancheCode]->id,
                'schema_formulaire_version' => 1,
                'client_id' => $clients[$clientIdx]->id,
                'donnees_risque' => [
                    'type_souscripteur' => 'PARTICULIER',
                    'nom' => $clients[$clientIdx]->nom ?? $clients[$clientIdx]->raison_sociale,
                    'prenom' => $clients[$clientIdx]->prenom ?? '',
                    'date_naissance' => $clients[$clientIdx]->date_naissance?->format('Y-m-d'),
                    'adresse' => $clients[$clientIdx]->adresse,
                ],
                'statut' => 'BROUILLON',
                'origine' => 'PARTENAIRE',
            ]);
            $demande->forceFill(['date_statut' => now()])->save();

            switch ($statut) {
                case 'SOUMISE':
                    StateMachine::pour($demande)->appliquer($demande, 'SOUMISE');
                    $demande->forceFill(['date_soumission' => now()->subDays(random_int(0, 5))])->save();
                    break;
                case 'EN_ETUDE':
                    StateMachine::pour($demande)->appliquer($demande, 'SOUMISE');
                    $demande->forceFill(['date_soumission' => now()->subDays(random_int(3, 10))])->save();
                    StateMachine::pour($demande)->appliquer($demande, 'EN_ETUDE');
                    $demande->forceFill(['gestionnaire_id' => $gestionnaire->id, 'date_prise_en_charge' => now()->subDays(random_int(1, 8))])->save();
                    $demande->forceFill(['date_statut' => now()->subDays(6)])->save();
                    break;
                case 'PIECES_MANQUANTES':
                    StateMachine::pour($demande)->appliquer($demande, 'SOUMISE');
                    $demande->forceFill(['date_soumission' => now()->subDays(6)])->save();
                    StateMachine::pour($demande)->appliquer($demande, 'EN_ETUDE');
                    $demande->forceFill(['gestionnaire_id' => $gestionnaire->id, 'date_prise_en_charge' => now()->subDays(5)])->save();
                    StateMachine::pour($demande)->appliquer($demande, 'PIECES_MANQUANTES');
                    break;
                case 'DEVIS_EMIS':
                    StateMachine::pour($demande)->appliquer($demande, 'SOUMISE');
                    $demande->forceFill(['date_soumission' => now()->subDays(12)])->save();
                    StateMachine::pour($demande)->appliquer($demande, 'EN_ETUDE');
                    $demande->forceFill(['gestionnaire_id' => $gestionnaire->id, 'date_prise_en_charge' => now()->subDays(10)])->save();
                    StateMachine::pour($demande)->appliquer($demande, 'DEVIS_EMIS');
                    $demande->forceFill(['date_premier_devis' => now()->subDays(5)])->save();
                    $demande->forceFill(['date_statut' => now()->subDays(6)])->save();
                    break;
                case 'NON_ELIGIBLE':
                    StateMachine::pour($demande)->appliquer($demande, 'SOUMISE');
                    $demande->forceFill(['date_soumission' => now()->subDays(15)])->save();
                    StateMachine::pour($demande)->appliquer($demande, 'EN_ETUDE');
                    $demande->forceFill(['gestionnaire_id' => $gestionnaire->id, 'date_prise_en_charge' => now()->subDays(13)])->save();
                    StateMachine::pour($demande)->appliquer($demande, 'NON_ELIGIBLE');
                    $demande->forceFill(['motif' => 'HORS_CADRE'])->save();
                    break;
                case 'SANS_SUITE':
                    StateMachine::pour($demande)->appliquer($demande, 'SOUMISE');
                    $demande->forceFill(['date_soumission' => now()->subDays(20)])->save();
                    StateMachine::pour($demande)->appliquer($demande, 'EN_ETUDE');
                    $demande->forceFill(['gestionnaire_id' => $gestionnaire->id, 'date_prise_en_charge' => now()->subDays(18)])->save();
                    StateMachine::pour($demande)->appliquer($demande, 'SANS_SUITE');
                    $demande->forceFill(['motif' => 'CONTACT_PERDU'])->save();
                    break;
            }
            $demandes[] = $demande;
            return $demande;
        };

        // ====================================================================
        // CRÉATION DES DEMANDES SIMPLES (sans devis)
        // ====================================================================
        // Partenaire 0 (COURTIER XXI) — l'utilisateur de test principal
        $d_soumise = $creerDemande(0, 'AUTO', 2, 'SOUMISE');
        $d_etude1 = $creerDemande(0, 'HABITATION', 3, 'EN_ETUDE');
        $d_pieces = $creerDemande(0, 'SANTE', 4, 'PIECES_MANQUANTES');
        $d_nonelig = $creerDemande(0, 'PRO-PRO', 0, 'NON_ELIGIBLE');
        $d_sanssuite = $creerDemande(0, 'AUTO', 7, 'SANS_SUITE');
        $d_etude2 = $creerDemande(0, 'FLOTTE', 8, 'EN_ETUDE');
        // Partenaire 1
        $d_soumise2 = $creerDemande(1, 'PREVOYANCE', 1, 'SOUMISE');
        $d_pieces2 = $creerDemande(1, 'SANTE', 5, 'PIECES_MANQUANTES');
        // Partenaire 2
        $d_etude3 = $creerDemande(2, 'AUTO', 6, 'EN_ETUDE');
        $d_soumise3 = $creerDemande(2, 'HABITATION', 9, 'SOUMISE');

        // ====================================================================
        // PARCOURS COMPLET (demande → devis → contrat) pour plusieurs dossiers
        // ====================================================================
        $completerContrat = function (DemandeTarification $demande, $produitCode, $clientIdx, $partenaireIdx, $fractionnement, $statutContrat, $avecQuittances = false) use (&$refs, &$calc, $produits, $porteurs, $grossistes, $clients, $partenaires, $gestionnaire, $conseiller, $tdPolice) {
            $primHt = random_int(30000, 95000);
            $taxes = (int) round($primHt * 0.13);
            $primTtc = $primHt + $taxes;

            StateMachine::pour($demande)->appliquer($demande, 'SOUMISE');
            $demande->forceFill(['date_soumission' => now()->subDays(40)])->save();
            StateMachine::pour($demande)->appliquer($demande, 'EN_ETUDE');
            $demande->forceFill(['gestionnaire_id' => $gestionnaire->id, 'date_prise_en_charge' => now()->subDays(38)])->save();

            $devis = Devis::create([
                'demande_id' => $demande->id,
                'version' => 1,
                'version_label' => 'V1',
                'porteur_risque_id' => $porteurs[array_rand($porteurs)]->id,
                'grossiste_id' => $grossistes[array_rand($grossistes)]->id,
                'produit_id' => $produits[$produitCode]->id,
                'prime_ht_cts' => $primHt,
                'taxes_cts' => $taxes,
                'prime_ttc_cts' => $primTtc,
                'frais_courtage_cts' => random_int(2000, 8000),
                'fractionnement' => $fractionnement,
                'date_effet_possible' => now()->addDays(7),
                'date_validite' => now()->addDays(30),
                'taux_commission_percue' => 20.0,
                'montant_retrocession_cts' => null,
                'conditions_particulieres' => 'Prise en charge sans délai de carence.',
                'statut' => 'BROUILLON',
            ]);
            StateMachine::pour($devis)->appliquer($devis, 'ENVOYE');
            $demande->forceFill(['date_premier_devis' => now()->subDays(30)])->save();
            StateMachine::pour($demande)->appliquer($demande, 'DEVIS_EMIS');
            StateMachine::pour($devis)->appliquer($devis, 'ACCEPTE');
            StateMachine::pour($demande)->appliquer($demande, 'ACCEPTEE');
            StateMachine::pour($demande)->appliquer($demande, 'EN_SOUSCRIPTION');
            StateMachine::pour($devis)->appliquer($devis, 'TRANSFORME');
            StateMachine::pour($demande)->appliquer($demande, 'TRANSFORMEE');

            $contrat = Contrat::create([
                'id' => (string) Str::uuid(),
                'reference' => $refs->contrat(),
                'numero_police' => 'POL-'.random_int(100000, 999999).'-'.now()->year,
                'devis_id' => $devis->id,
                'demande_id' => $demande->id,
                'organisation_id' => $partenaires[$partenaireIdx]->id,
                'client_id' => $clients[$clientIdx]->id,
                'porteur_risque_id' => $porteurs[array_rand($porteurs)]->id,
                'grossiste_id' => $grossistes[array_rand($grossistes)]->id,
                'produit_id' => $produits[$produitCode]->id,
                'date_effet' => now()->subMonths(random_int(1, 8)),
                'date_echeance_principale' => now()->addMonths(random_int(1, 11)),
                'prime_ht_cts' => $primHt,
                'taxes_cts' => $taxes,
                'prime_ttc_cts' => $primTtc,
                'frais_courtage_cts' => random_int(2000, 8000),
                'fractionnement' => $fractionnement,
                'annee_assurance' => 1,
                'statut' => 'EN_CONSTITUTION',
            ]);

            // Garanties du devis (relation morph sur devis, id numérique OK)
            $garantiesDevis = [
                ['intitule' => 'Garantie de base', 'plafond_cts' => $primTtc, 'franchise_cts' => 0, 'incluse' => true, 'optionnelle' => false],
                ['intitule' => 'Garantie étendue', 'plafond_cts' => (int) ($primTtc * 2), 'franchise_cts' => 15000, 'incluse' => false, 'optionnelle' => true],
                ['intitule' => 'Assistance 24/7', 'plafond_cts' => 500000, 'franchise_cts' => 0, 'incluse' => true, 'optionnelle' => false],
            ];
            foreach ($garantiesDevis as $g) {
                LigneGarantie::create(array_merge(['garantissable_type' => Devis::class, 'garantissable_id' => $devis->id], $g));
            }

            // Séquences du contrat selon statut
            switch ($statutContrat) {
                case 'EN_CONSTITUTION':
                    break;
                case 'EN_ATTENTE_SIGNATURE':
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');
                    break;
                case 'SIGNE':
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'SIGNE');
                    break;
                case 'SANS_EFFET':
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'SIGNE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'SANS_EFFET');
                    break;
                case 'EXPIRE':
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'SIGNE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_EMISSION');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_VIGUEUR');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EXPIRE');
                    break;
                case 'RESILIE':
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'SIGNE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_EMISSION');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_VIGUEUR');
                    $contrat->forceFill(['motif_resiliation' => 'NON_PAIEMENT', 'date_resiliation' => now()->addMonths(2)])->save();
                    StateMachine::pour($contrat)->appliquer($contrat, 'RESILIE');
                    break;
                case 'IMPAYE':
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'SIGNE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_EMISSION');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_VIGUEUR');
                    StateMachine::pour($contrat)->appliquer($contrat, 'IMPAYE');
                    break;
                default: // EN_VIGUEUR
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'SIGNE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_EMISSION');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_VIGUEUR');
            }

            // Ligne de commission prévisionnelle
            $calc->genererLignesPrevisionnelles($contrat);

            // Quittances
            if ($avecQuittances) {
                $nb = match ($fractionnement) { 'MENSUEL' => 12, 'TRIMESTRIEL' => 4, 'SEMESTRIEL' => 2, default => 1 };
                $montant = (int) round($primTtc / $nb);
                for ($i = 1; $i <= $nb; $i++) {
                    $q = Quittance::create([
                        'contrat_id' => $contrat->id,
                        'numero' => (string) $i,
                        'echeance' => $i,
                        'date_appel' => $contrat->date_effet->copy()->addMonths($i - 1),
                        'date_echeance' => $contrat->date_effet->copy()->addMonths($i),
                        'montant_cts' => $montant,
                        'statut' => in_array($statutContrat, ['IMPAYE', 'RESILIE']) && $i === 1 ? 'IMPAYEE' : 'ENCAISSEE',
                    ]);
                    // Une première quittance encaissée → bascule en ACQUISE
                    if ($i === 1 && !in_array($statutContrat, ['IMPAYE', 'RESILIE'])) {
                        $q->update(['date_encaissee' => $q->date_appel]);
                    }
                }
            }

            // Document (police) rattaché au contrat
            Document::create([
                'type_document_id' => $tdPolice->id,
                'nom_origine' => 'police_'.$contrat->reference.'.pdf',
                'taille' => random_int(50000, 400000),
                'mime_reel' => 'application/pdf',
                'mime_declare' => 'application/pdf',
                'objet_type' => 'contrat',
                'objet_id' => $contrat->id,
                'organisation_id' => $partenaires[$partenaireIdx]->id,
                'cle_stockage' => 'demo/'.$contrat->reference.'.pdf',
                'version' => 1,
                'statut_validation' => 'VALIDE',
                'sensibilite' => 'NORMALE',
                'statut_antivirus' => 'SAIN',
            ]);

            return ['demande' => $demande, 'devis' => $devis, 'contrat' => $contrat];
        };

        // Partenaire 0 — dossiers aboutis (pour tester la page contrats/échéances)
        $c1 = $completerContrat($creerDemande(0, 'AUTO', 2, 'BROUILLON'), 'AUTO-TOUS-RISQUES', 2, 0, 'MENSUEL', 'EN_VIGUEUR', true);
        $c2 = $completerContrat($creerDemande(0, 'HABITATION', 3, 'BROUILLON'), 'HAB-MULTI', 3, 0, 'ANNUEL', 'EN_VIGUEUR', true);
        $c3 = $completerContrat($creerDemande(0, 'SANTE', 4, 'BROUILLON'), 'SANTE-REF', 4, 0, 'MENSUEL', 'EN_ATTENTE_SIGNATURE');
        $c4 = $completerContrat($creerDemande(0, 'PREVOYANCE', 1, 'BROUILLON'), 'PREV-IT', 1, 0, 'ANNUEL', 'EN_CONSTITUTION');
        $c5 = $completerContrat($creerDemande(0, 'HABITATION', 0, 'BROUILLON'), 'HAB-MULTI', 0, 0, 'ANNUEL', 'RESILIE', true);
        $c6 = $completerContrat($creerDemande(0, 'AUTO', 7, 'BROUILLON'), 'AUTO-TIERS', 7, 0, 'TRIMESTRIEL', 'IMPAYE', true);

        // Partenaire 1 — dossiers aboutis
        $c7 = $completerContrat($creerDemande(1, 'PREVOYANCE', 5, 'BROUILLON'), 'PREV-DECES', 5, 1, 'ANNUEL', 'EN_VIGUEUR', true);
        $c8 = $completerContrat($creerDemande(1, 'SANTE', 8, 'BROUILLON'), 'SANTE-PREMIUM', 8, 1, 'MENSUEL', 'SIGNE');

        // Partenaire 2 — dossiers aboutis
        $c9 = $completerContrat($creerDemande(2, 'AUTO', 6, 'BROUILLON'), 'AUTO-TIERS', 6, 2, 'ANNUEL', 'EN_VIGUEUR', true);
        $c10 = $completerContrat($creerDemande(2, 'PRO-PRO', 9, 'BROUILLON'), 'PRO-RC', 9, 2, 'ANNUEL', 'EXPIRE');

        // ====================================================================
        // SINISTRES sur contrats en vigueur
        // ====================================================================
        $contratsEnVigueur = [$c1['contrat'], $c2['contrat'], $c7['contrat'], $c9['contrat']];
        foreach ($contratsEnVigueur as $k => $contrat) {
            Sinistre::create([
                'contrat_id' => $contrat->id,
                'numero' => 'SIN-'.now()->year.'-'.str_pad((string)($k + 1), 4, '0', STR_PAD_LEFT),
                'date_survenance' => now()->subMonths(random_int(1, 6)),
                'date_declaration' => now()->subMonths(random_int(1, 6)),
                'nature' => random_int(0, 1) ? 'Dégât des eaux' : 'Collision',
                'statut' => random_int(0, 1) ? 'OUVERT' : 'EN_COURS_EXPERTISE',
                'montant_estime_cts' => random_int(50000, 500000),
                'montant_regle_cts' => null,
                'declare_par' => 'PARTENAIRE',
            ]);
        }

        // ====================================================================
        // AVENANTS
        // ====================================================================
        Avenant::create([
            'contrat_id' => $c1['contrat']->id,
            'type' => 'CHANGEMENT_VEHICULE',
            'date_effet' => now()->subMonths(2),
            'variation_prime_cts' => 2000,
            'description' => 'Intégration d\'un second véhicule au contrat.',
            'statut' => 'APPLIQUE',
        ]);
        Avenant::create([
            'contrat_id' => $c2['contrat']->id,
            'type' => 'CHANGEMENT_ADRESSE',
            'date_effet' => now()->subMonths(1),
            'variation_prime_cts' => 0,
            'description' => 'Déménagement du souscripteur.',
            'statut' => 'APPLIQUE',
        ]);

        // ====================================================================
        // COMMISSIONS PERÇUES (cabinet uniquement)
        // ====================================================================
        foreach ([$c1['contrat'], $c2['contrat'], $c7['contrat'], $c9['contrat']] as $contrat) {
            $perque = random_int(15000, 40000);
            LigneCommission::create([
                'nature' => LigneCommission::NATURE_PERQUE,
                'contrat_id' => $contrat->id,
                'organisation_id' => $cabinet->id,
                'periode_debut' => now()->startOfMonth(),
                'periode_fin' => now()->endOfMonth(),
                'annee_assurance' => 1,
                'assiette_cts' => $contrat->prime_ht_cts,
                'mode_calcul' => 'PERCENT_COMMISSION_CABINET',
                'taux' => 20.0,
                'montant_cts' => $perque,
                'statut' => 'ACQUISE',
                'trace_calcul' => ['assiette' => 'COMMISSION_CABINET', 'taux' => 20],
            ]);
        }

        // ====================================================================
        // BORDEREAUX (sur les lignes rétrocédées ACQUISE)
        // ====================================================================
        $genereBordereau = function ($partenaireIdx, $statut) use (&$refs, $partenaires, $admin, $comptable) {
            $lignes = LigneCommission::where('organisation_id', $partenaires[$partenaireIdx]->id)
                ->where('nature', 'RETROCEDEE')
                ->whereIn('statut', ['ACQUISE', 'REPRISE'])
                ->get();

            if ($lignes->isEmpty()) {
                return null;
            }

            $totalBrut = $lignes->where('montant_cts', '>', 0)->sum('montant_cts');
            $totalReprises = abs($lignes->where('montant_cts', '<', 0)->sum('montant_cts'));
            $net = $totalBrut - $totalReprises;

            $bordereau = Bordereau::create([
                'organisation_id' => $partenaires[$partenaireIdx]->id,
                'reference' => $refs->bordereau(),
                'periode_debut' => now()->startOfMonth()->subMonths(1),
                'periode_fin' => now()->endOfMonth()->subMonths(1),
                'statut' => $statut,
                'report_anterieur_cts' => 0,
                'total_brut_cts' => $totalBrut,
                'total_reprises_cts' => $totalReprises,
                'net_a_payer_cts' => $net,
                'commentaire_comptable' => 'Bordereau de démonstration.',
            ]);

            foreach ($lignes as $ligne) {
                if ($ligne->statut === 'ACQUISE') {
                    $ligne->update(['statut' => 'BORDEREE', 'bordereau_id' => $bordereau->id]);
                }
            }

            if (in_array($statut, ['VALIDE', 'PUBLIE', 'PAYE'])) {
                foreach ($lignes as $ligne) {
                    if ($ligne->statut === 'REPRISE') {
                        $ligne->update(['bordereau_id' => $bordereau->id]);
                    }
                }
                if ($statut === 'PAYE') {
                    foreach ($lignes as $ligne) {
                        if ($ligne->statut === 'BORDEREE') {
                            $ligne->update(['statut' => 'PAYEE']);
                        }
                    }
                }
            }

            return $bordereau;
        };

        $b1 = $genereBordereau(0, 'PAYE');
        $b2 = $genereBordereau(1, 'A_VERIFIER');
        $b3 = $genereBordereau(2, 'VALIDE');

        // ====================================================================
        // CONTESTATION sur une ligne
        // ====================================================================
        $ligneRetro = LigneCommission::where('nature', 'RETROCEDEE')->first();
        if ($ligneRetro) {
            Contestation::create([
                'ligne_commission_id' => $ligneRetro->id,
                'auteur_id' => $dirigeant1->id,
                'message' => 'Le montant estimé semble inférieur à la prime réellement encaissée ce mois-ci.',
                'statut' => 'OUVERTE',
            ]);
        }

        // ====================================================================
        // CONVERSATIONS + MESSAGES
        // ====================================================================
        $conversations = [];
        foreach ([$c1['contrat'], $c2['contrat'], $c3['contrat']] as $contrat) {
            $convs = Conversation::firstOrCreate([
                'objet_type' => 'contrat',
                'objet_id' => $contrat->id,
            ], ['organisation_id' => $contrat->organisation_id]);
            $conversations[] = $convs;

            Message::create([
                'conversation_id' => $convs->id,
                'auteur_id' => $dirigeant1->id,
                'contenu' => "Bonjour, concernant le contrat {$contrat->reference}, pouvez-vous me confirmer la date d'effet de la prestation ?",
                'visibilite' => 'EXTERNE',
            ]);
            Message::create([
                'conversation_id' => $convs->id,
                'auteur_id' => $gestionnaire->id,
                'contenu' => "Bonjour David, la date d'effet est bien au {$contrat->date_effet->format('d/m/Y')}. N'hésitez pas si vous avez d'autres questions.",
                'visibilite' => 'EXTERNE',
            ]);
            // Note interne (visible cabinet uniquement, RG-55)
            Message::create([
                'conversation_id' => $convs->id,
                'auteur_id' => $gestionnaire->id,
                'contenu' => 'Note interne : dossier à re-vérifier avant échéance.',
                'visibilite' => 'INTERNE',
            ]);
        }

        // Conversation sur une demande
        $convDemande = Conversation::firstOrCreate([
            'objet_type' => 'demande',
            'objet_id' => $d_etude1->id,
        ], ['organisation_id' => $d_etude1->organisation_id]);
        Message::create(['conversation_id' => $convDemande->id, 'auteur_id' => $dirigeant1->id, 'contenu' => 'Bonjour, pouvez-vous me tenir informé de l\'avancement ?', 'visibilite' => 'EXTERNE']);

        // ====================================================================
        // NOTIFICATIONS
        // ====================================================================
        $notifs = [
            ['user' => $dirigeant1, 'type' => 'devis_envoye', 'data' => ['message' => 'Un nouveau devis a été émis pour la demande '.($d_etude1->reference ?? ''), 'ref' => $d_etude1->reference]],
            ['user' => $dirigeant1, 'type' => 'contrat_en_vigueur', 'data' => ['message' => 'Le contrat '.($c1['contrat']->reference).' est entré en vigueur.', 'ref' => $c1['contrat']->reference]],
            ['user' => $dirigeant1, 'type' => 'commission', 'data' => ['message' => 'Un nouveau bordereau de commissions est disponible.', 'ref' => $b1?->reference]],
            ['user' => $dirigeant1, 'type' => 'message', 'data' => ['message' => 'Vous avez de nouveaux messages non lus.']],
            ['user' => $admin, 'type' => 'demande_soumise', 'data' => ['message' => 'Une nouvelle demande a été soumise par '.$partenaires[0]->raison_sociale.'.', 'ref' => $d_soumise->reference]],
            ['user' => $admin, 'type' => 'bordereau', 'data' => ['message' => 'Un bordereau est à vérifier.', 'ref' => $b2?->reference]],
            ['user' => $admin, 'type' => 'sinistre', 'data' => ['message' => 'Un nouveau sinistre a été déclaré.']],
        ];
        foreach ($notifs as $i => $n) {
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $n['user']->id,
                'type' => $n['type'],
                'data' => $n['data'],
                'objet_type' => 'system',
                'objet_id' => null,
                'read_at' => $i === 0 ? null : null,
            ]);
        }
        // Marquer la première comme lue pour varier l'affichage
        Notification::orderBy('created_at')->first()?->update(['read_at' => now()]);

        // ====================================================================
        // AUDIT LOGS (pour la page Audit)
        // ====================================================================
        $actions = [
            ['user' => $admin, 'action' => 'connexion', 'detail' => 'Connexion réussie'],
            ['user' => $dirigeant1, 'action' => 'demande.cree', 'detail' => 'Création d\'une demande de tarification'],
            ['user' => $gestionnaire, 'action' => 'demande.prise_en_charge', 'detail' => 'Prise en charge de la demande'],
            ['user' => $conseiller, 'action' => 'devis.emis', 'detail' => 'Émission d\'un devis'],
            ['user' => $admin, 'action' => 'partenaire.valide', 'detail' => 'Validation d\'un partenaire'],
            ['user' => $comptable, 'action' => 'bordereau.paye', 'detail' => 'Déclaration de paiement d\'un bordereau'],
        ];
        foreach ($actions as $a) {
            AuditLog::create([
                'horodatage' => now()->subDays(random_int(0, 30)),
                'user_id' => $a['user']->id,
                'organisation_id' => $a['user']->organisation_id,
                'ip' => '192.168.1.'.random_int(10, 250),
                'action' => $a['action'],
                'objet_type' => 'system',
                'objet_id' => null,
                'detail' => $a['detail'],
            ]);
        }

        // ====================================================================
        // DOCUMENTS de l'organisation partenaire (page cabinet)
        // ====================================================================
        foreach ([0, 1, 2] as $i) {
            Document::create([
                'type_document_id' => $tdKbis->id,
                'nom_origine' => 'kbis_'.$partenaires[$i]->siren.'.pdf',
                'taille' => 120000,
                'mime_reel' => 'application/pdf',
                'mime_declare' => 'application/pdf',
                'objet_type' => 'organisation',
                'objet_id' => $partenaires[$i]->id,
                'organisation_id' => $partenaires[$i]->id,
                'cle_stockage' => 'demo/kbis_'.$partenaires[$i]->siren.'.pdf',
                'version' => 1,
                'statut_validation' => 'VALIDE',
                'sensibilite' => 'NORMALE',
                'statut_antivirus' => 'SAIN',
            ]);
        }

        // Démarrage de la séquence de références pour cohérence
        $this->command?->info('=== Données de démo enrichies générées ===');
        $this->command?->info('Admin cabinet :      admin@carrez.local / password');
        $this->command?->info('Gestionnaire :       gestion@carrez.local / password');
        $this->command?->info('Dirigeant partenaire : dirigeant@courtiervii.local / password');
        $this->command?->info('Collaborateur :      collab@courtiervii.local / password');
        $this->command?->info('Lecteur partenaire : lecteur@courtiervii.local / password');
        $this->command?->info('Autres partenaires : dirigeant@cafim.local et dirigeant@atlas.local / password');
    }
}
