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
use App\Services\CommissionCalculator;
use App\Services\ReferenceService;
use App\Services\StateMachine;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Désactive l'écriture du journal d'audit pendant le seed (transitions incluses)
        StateMachine::$logAuditTrail = false;

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

        $dirigeant1 = User::create(['name' => 'David Dirigeant', 'email' => 'dirigeant@courtiervii.local', 'password' => 'password', 'role' => User::ROLE_DIRIGEANT_PARTENAIRE, 'organisation_id' => $partenaires[0]->id, 'actif' => true]);
        $collab1 = User::create(['name' => 'Claire Collaboratrice', 'email' => 'collab@courtiervii.local', 'password' => 'password', 'role' => User::ROLE_COLLABORATEUR_PARTENAIRE, 'organisation_id' => $partenaires[0]->id, 'actif' => true, 'visible_commissions' => true]);

        $cabinet->update(['admin_id' => $admin->id]);
        $partenaires[0]->update(['admin_id' => $dirigeant1->id]);

        // ====================================================================
        // RÉFÉRENTIELS : branches + porteurs + grossistes + produits + schémas
        // ====================================================================
        $porteurs = [];
        foreach (['AXA France', 'MMA Assurances', 'Allianz', 'Axa Santé', 'Generali'] as $nom) {
            $porteurs[] = PorteurRisque::create(['nom' => $nom, 'orias' => '07'.random_int(100000, 999999)]);
        }
        $grossistes = [];
        foreach (['MMA Gestion Santé', 'GPS Addevic', 'Sferic Re', 'Cowork Santé', 'Axa Corporate'] as $nom) {
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
            ['code' => 'SANTE-REF', 'nom' => 'Santé Référence', 'categorie' => 'Assurances de personnes', 'branche' => 'SANTE'],
            ['code' => 'PREV-DECES', 'nom' => 'Prévoyance Décès', 'categorie' => 'Assurances de personnes', 'branche' => 'PREVOYANCE'],
            ['code' => 'AUTO-TOUS-RISQUES', 'nom' => 'Auto Tous Risques', 'categorie' => 'Assurances de dommages', 'branche' => 'AUTO'],
            ['code' => 'AUTO-TIERS', 'nom' => 'Auto Tiers Simple', 'categorie' => 'Assurances de dommages', 'branche' => 'AUTO'],
            ['code' => 'HAB-MULTI', 'nom' => 'Multirisque Habitation', 'categorie' => 'Immobilier', 'branche' => 'HABITATION'],
        ];
        $produits = [];
        foreach ($defsProduits as $dp) {
            $produits[$dp['code']] = Produit::create([
                'code' => $dp['code'],
                'nom' => $dp['nom'],
                'categorie' => $dp['categorie'],
                'branche_id' => $branches[$dp['branche']]->id,
                'porteur_risque_id' => $porteurs[array_rand($porteurs)]->id,
                'grossiste_id' => $grossistes[array_rand($grossistes)]->id,
                'actif' => true,
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

        // Motifs
        Motif::create(['categorie' => 'REFUS', 'code' => 'AGGRAVATION', 'libelle' => 'Aggravation du risque']);
        Motif::create(['categorie' => 'REFUS', 'code' => 'HORS_CADRE', 'libelle' => 'Hors cadre de souscription']);
        Motif::create(['categorie' => 'RESILIATION', 'code' => 'ECHEANCE_ASSURE', 'libelle' => 'Non renouvellement à échéance']);
        Motif::create(['categorie' => 'RESILIATION', 'code' => 'NON_PAIEMENT', 'libelle' => 'Non paiement des primes']);
        Motif::create(['categorie' => 'SANS_SUITE', 'code' => 'CONTACT_PERDU', 'libelle' => 'Client injoignable']);

        // ====================================================================
        // CLIENTS
        // ====================================================================
        $clients = [];
        $defsClients = [
            ['type' => 'PHYSIQUE', 'civilite' => 'M.', 'nom' => 'Durand', 'prenom' => 'Patrick', 'date_naissance' => '1975-06-12', 'telephone' => '0612345678', 'complement' => ['origine' => 'PARRAINAGE']],
            ['type' => 'PHYSIQUE', 'civilite' => 'Mme', 'nom' => 'Martin', 'prenom' => 'Sophie', 'date_naissance' => '1982-03-04', 'telephone' => '0622334455', 'complement' => ['origine' => 'PROSPECTION']],
            ['type' => 'PHYSIQUE', 'civilite' => 'M.', 'nom' => 'Bernard', 'prenom' => 'Lucas', 'date_naissance' => '1990-11-23', 'telephone' => '0633445566', 'complement' => ['origine' => 'INTERNET']],
            ['type' => 'PHYSIQUE', 'civilite' => 'Mme', 'nom' => 'Petit', 'prenom' => 'Élise', 'date_naissance' => '1968-09-15', 'telephone' => '0644556677', 'complement' => ['origine' => 'PARTENAIRE']],
            ['type' => 'MORALE', 'raison_sociale' => 'SAS Durand & Fils', 'siren' => '812345678', 'complement' => ['origine' => 'PARRAINAGE']],
        ];
        foreach ($defsClients as $idx => $dc) {
            $clients[$idx] = Client::create(array_merge([
                'organisation_id' => $partenaires[$idx % 2]->id,
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
        foreach ([0, 1] as $i) {
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
            }
            $demandes[] = $demande;
            return $demande;
        };

        // ====================================================================
        // PARCOURS COMPLET (demande → devis → contrat) pour plusieurs dossiers
        // ====================================================================
        $completerContrat = function (DemandeTarification $demande, $produitCode, $clientIdx, $partenaireIdx, $fractionnement, $statutContrat, $avecQuittances = false) use (&$refs, $calc, $produits, $porteurs, $grossistes, $clients, $partenaires, $gestionnaire) {
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

            // Garantie du devis (relation morph sur devis)
            LigneGarantie::create([
                'garantissable_type' => Devis::class,
                'garantissable_id' => $devis->id,
                'intitule' => 'Garantie de base',
                'plafond_cts' => $primTtc,
                'franchise_cts' => 0,
                'incluse' => true,
                'optionnelle' => false,
            ]);

            // Séquences du contrat selon statut
            switch ($statutContrat) {
                case 'EN_ATTENTE_SIGNATURE':
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');
                    break;
                case 'RESILIE':
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'SIGNE');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_EMISSION');
                    StateMachine::pour($contrat)->appliquer($contrat, 'EN_VIGUEUR');
                    $contrat->forceFill(['motif_resiliation' => 'NON_PAIEMENT', 'date_resiliation' => now()->addMonths(2)])->save();
                    StateMachine::pour($contrat)->appliquer($contrat, 'RESILIE');
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

            return ['demande' => $demande, 'devis' => $devis, 'contrat' => $contrat];
        };

        // Demandes ouvertes (restées dans le flux)
        $d_etude = $creerDemande(0, 'HABITATION', 2, 'EN_ETUDE');
        $d_pieces = $creerDemande(1, 'SANTE', 3, 'PIECES_MANQUANTES');
        $d_devis = $creerDemande(1, 'PREVOYANCE', 4, 'DEVIS_EMIS');

        // Devis ENVOYE sur la demande DEVIS_EMIS (proposé par le partenaire dirigeant)
        $devisEnvoie = Devis::create([
            'demande_id' => $d_devis->id,
            'user_id' => $dirigeant1->id,
            'version' => 1,
            'version_label' => 'V1',
            'porteur_risque_id' => $porteurs[array_rand($porteurs)]->id,
            'grossiste_id' => $grossistes[array_rand($grossistes)]->id,
            'produit_id' => $produits['PREV-DECES']->id,
            'prime_ht_cts' => 45000,
            'taxes_cts' => 5850,
            'prime_ttc_cts' => 50850,
            'frais_courtage_cts' => 3000,
            'fractionnement' => 'ANNUEL',
            'date_effet_possible' => now()->addDays(5),
            'date_validite' => now()->addDays(21),
            'taux_commission_percue' => 20.0,
            'montant_retrocession_cts' => null,
            'conditions_particulieres' => 'Proposition partenaire.',
            'statut' => 'BROUILLON',
        ]);
        StateMachine::pour($devisEnvoie)->appliquer($devisEnvoie, 'ENVOYE');

        // Dossiers aboutis (contrats)
        $c1 = $completerContrat($creerDemande(0, 'AUTO', 2, 'BROUILLON'), 'AUTO-TOUS-RISQUES', 2, 0, 'TRIMESTRIEL', 'EN_VIGUEUR', true);
        $c2 = $completerContrat($creerDemande(0, 'HABITATION', 3, 'BROUILLON'), 'HAB-MULTI', 3, 0, 'ANNUEL', 'EN_VIGUEUR', true);
        $c3 = $completerContrat($creerDemande(0, 'SANTE', 4, 'BROUILLON'), 'SANTE-REF', 4, 0, 'ANNUEL', 'EN_ATTENTE_SIGNATURE');
        $c5 = $completerContrat($creerDemande(0, 'HABITATION', 0, 'BROUILLON'), 'HAB-MULTI', 0, 0, 'ANNUEL', 'RESILIE', true);

        // ====================================================================
        // SINISTRES sur contrats en vigueur
        // ====================================================================
        $sinistre1 = Sinistre::create([
            'contrat_id' => $c1['contrat']->id,
            'numero' => 'SIN-'.now()->year.'-0001',
            'date_survenance' => now()->subMonths(3),
            'date_declaration' => now()->subMonths(3)->addDays(2),
            'nature' => 'Collision',
            'statut' => 'EN_COURS_EXPERTISE',
            'montant_estime_cts' => 320000,
            'montant_regle_cts' => null,
            'declare_par' => 'PARTENAIRE',
        ]);
        $sinistre2 = Sinistre::create([
            'contrat_id' => $c2['contrat']->id,
            'numero' => 'SIN-'.now()->year.'-0002',
            'date_survenance' => now()->subMonths(2),
            'date_declaration' => now()->subMonths(2)->addDays(3),
            'nature' => 'Dégât des eaux',
            'statut' => 'OUVERT',
            'montant_estime_cts' => 150000,
            'montant_regle_cts' => null,
            'declare_par' => 'CABINET',
        ]);
        $sinistre3 = Sinistre::create([
            'contrat_id' => $c2['contrat']->id,
            'numero' => 'SIN-'.now()->year.'-0003',
            'date_survenance' => now()->subWeeks(3),
            'date_declaration' => now()->subWeeks(3)->addDays(1),
            'nature' => 'Incendie',
            'statut' => 'EN_COURS_EXPERTISE',
            'montant_estime_cts' => 420000,
            'montant_regle_cts' => null,
            'declare_par' => 'PARTENAIRE',
        ]);
        $sinistre4 = Sinistre::create([
            'contrat_id' => $c1['contrat']->id,
            'numero' => 'SIN-'.now()->year.'-0004',
            'date_survenance' => now()->subMonths(5),
            'date_declaration' => now()->subMonths(5)->addDays(4),
            'nature' => 'Bris de glace',
            'statut' => 'CLOS',
            'cloture_le' => now()->subMonths(4),
            'montant_estime_cts' => 80000,
            'montant_regle_cts' => 76000,
            'declare_par' => 'PARTENAIRE',
        ]);

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
        Avenant::create([
            'contrat_id' => $c3['contrat']->id,
            'type' => 'CHANGEMENT_GARANTIE',
            'date_effet' => now()->addMonth(),
            'variation_prime_cts' => 5000,
            'description' => 'Extension de garantie en cours de négociation.',
            'statut' => 'PROJET',
        ]);
        Avenant::create([
            'contrat_id' => $c5['contrat']->id,
            'type' => 'CHANGEMENT_VEHICULE',
            'date_effet' => now()->subMonths(3),
            'variation_prime_cts' => -2000,
            'description' => 'Retrait d\'un véhicule proposé avant résiliation.',
            'statut' => 'REFUSE',
        ]);

        // ====================================================================
        // COMMISSIONS PERÇUES (cabinet uniquement)
        // ====================================================================
        foreach ([$c1['contrat'], $c2['contrat']] as $contrat) {
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
                'montant_cts' => random_int(15000, 40000),
                'statut' => 'ACQUISE',
                'trace_calcul' => ['assiette' => 'COMMISSION_CABINET', 'taux' => 20],
            ]);
        }

        // Lignes rétrocédées ACQUISES (alimentent le bordereau du partenaire 0)
        foreach ([$c1['contrat'], $c2['contrat']] as $contrat) {
            LigneCommission::create([
                'nature' => LigneCommission::NATURE_RETROCEDEE,
                'contrat_id' => $contrat->id,
                'organisation_id' => $partenaires[0]->id,
                'periode_debut' => now()->startOfMonth(),
                'periode_fin' => now()->endOfMonth(),
                'annee_assurance' => 1,
                'assiette_cts' => $contrat->prime_ht_cts,
                'mode_calcul' => 'RETROCESSION',
                'taux' => 50.0,
                'montant_cts' => random_int(8000, 20000),
                'statut' => 'ACQUISE',
                'trace_calcul' => ['assiette' => 'COMMISSION_CABINET', 'taux' => 50],
            ]);
        }

        // ====================================================================
        // BORDEREAU (partenaire 0)
        // ====================================================================
        $lignesRetro = LigneCommission::where('organisation_id', $partenaires[0]->id)
            ->where('nature', 'RETROCEDEE')
            ->whereIn('statut', ['ACQUISE', 'REPRISE'])
            ->get();

        $b1 = null;
        if ($lignesRetro->isNotEmpty()) {
            $totalBrut = $lignesRetro->where('montant_cts', '>', 0)->sum('montant_cts');
            $totalReprises = abs($lignesRetro->where('montant_cts', '<', 0)->sum('montant_cts'));
            $b1 = Bordereau::create([
                'organisation_id' => $partenaires[0]->id,
                'reference' => $refs->bordereau(),
                'periode_debut' => now()->startOfMonth()->subMonths(1),
                'periode_fin' => now()->endOfMonth()->subMonths(1),
                'statut' => 'PAYE',
                'report_anterieur_cts' => 0,
                'total_brut_cts' => $totalBrut,
                'total_reprises_cts' => $totalReprises,
                'net_a_payer_cts' => $totalBrut - $totalReprises,
                'commentaire_comptable' => 'Bordereau de démonstration.',
            ]);
            foreach ($lignesRetro as $ligne) {
                if ($ligne->statut === 'ACQUISE') {
                    $ligne->update(['statut' => 'PAYEE', 'bordereau_id' => $b1->id]);
                }
            }
        }

        // Bordereau en cours de constitution sur la période courante
        Bordereau::create([
            'organisation_id' => $partenaires[0]->id,
            'reference' => $refs->bordereau(),
            'periode_debut' => now()->startOfMonth(),
            'periode_fin' => now()->endOfMonth(),
            'statut' => 'GENERATION',
            'report_anterieur_cts' => 0,
            'total_brut_cts' => 0,
            'total_reprises_cts' => 0,
            'net_a_payer_cts' => 0,
            'commentaire_comptable' => 'Bordereau en cours de constitution.',
        ]);

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
        $ligneRetro2 = LigneCommission::where('nature', 'RETROCEDEE')->skip(1)->first();
        if ($ligneRetro2) {
            Contestation::create([
                'ligne_commission_id' => $ligneRetro2->id,
                'auteur_id' => $gestionnaire->id,
                'message' => 'Écart constaté entre la prime encaissée et le montant rétrocédé : ajustement demandé.',
                'statut' => 'RESOLUE',
            ]);
        }

        // ====================================================================
        // CONVERSATIONS + MESSAGES
        // ====================================================================
        $convContrat = Conversation::firstOrCreate([
            'objet_type' => 'contrat',
            'objet_id' => $c1['contrat']->id,
        ], ['organisation_id' => $c1['contrat']->organisation_id]);

        Message::create([
            'conversation_id' => $convContrat->id,
            'auteur_id' => $dirigeant1->id,
            'contenu' => "Bonjour, concernant le contrat {$c1['contrat']->reference}, pouvez-vous me confirmer la date d'effet de la prestation ?",
            'visibilite' => 'EXTERNE',
        ]);
        Message::create([
            'conversation_id' => $convContrat->id,
            'auteur_id' => $gestionnaire->id,
            'contenu' => "Bonjour David, la date d'effet est bien au {$c1['contrat']->date_effet->format('d/m/Y')}. N'hésitez pas si vous avez d'autres questions.",
            'visibilite' => 'EXTERNE',
        ]);
        Message::create([
            'conversation_id' => $convContrat->id,
            'auteur_id' => $gestionnaire->id,
            'contenu' => 'Note interne : dossier à re-vérifier avant échéance.',
            'visibilite' => 'INTERNE',
        ]);

        // Conversation sur une demande
        $convDemande = Conversation::firstOrCreate([
            'objet_type' => 'demande',
            'objet_id' => $d_etude->id,
        ], ['organisation_id' => $d_etude->organisation_id]);
        Message::create(['conversation_id' => $convDemande->id, 'auteur_id' => $dirigeant1->id, 'contenu' => 'Bonjour, pouvez-vous me tenir informé de l\'avancement ?', 'visibilite' => 'EXTERNE']);

        // Conversation sur le second contrat
        $convContrat2 = Conversation::firstOrCreate([
            'objet_type' => 'contrat',
            'objet_id' => $c2['contrat']->id,
        ], ['organisation_id' => $c2['contrat']->organisation_id]);
        Message::create(['conversation_id' => $convContrat2->id, 'auteur_id' => $dirigeant1->id, 'contenu' => 'Le sinistre dégât des eaux est-il bien pris en charge dans le cadre du contrat ?', 'visibilite' => 'EXTERNE']);
        Message::create(['conversation_id' => $convContrat2->id, 'auteur_id' => $gestionnaire->id, 'contenu' => 'Oui, une expertise est en cours, nous vous transmettons les conclusions dès réception.', 'visibilite' => 'EXTERNE']);

        // ====================================================================
        // NOTIFICATIONS
        // ====================================================================
        $notifs = [
            ['user' => $dirigeant1, 'type' => 'devis_envoye', 'data' => ['message' => 'Un nouveau devis a été émis pour la demande '.($d_devis->reference ?? ''), 'ref' => $d_devis->reference]],
            ['user' => $dirigeant1, 'type' => 'contrat_en_vigueur', 'data' => ['message' => 'Le contrat '.($c1['contrat']->reference).' est entré en vigueur.', 'ref' => $c1['contrat']->reference]],
            ['user' => $dirigeant1, 'type' => 'message', 'data' => ['message' => 'Vous avez de nouveaux messages non lus.']],
            ['user' => $admin, 'type' => 'demande_soumise', 'data' => ['message' => 'Une nouvelle demande a été soumise par '.$partenaires[0]->raison_sociale.'.', 'ref' => $d_etude->reference]],
            ['user' => $admin, 'type' => 'sinistre', 'data' => ['message' => 'Un nouveau sinistre a été déclaré.', 'ref' => $sinistre1->numero]],
        ];
        foreach ($notifs as $i => $n) {
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $n['user']->id,
                'type' => $n['type'],
                'data' => $n['data'],
                'objet_type' => 'system',
                'objet_id' => null,
                'read_at' => $i === 0 ? now() : null,
            ]);
        }

        // ====================================================================
        // AUDIT LOGS (pour la page Audit)
        // ====================================================================
        $actions = [
            ['user' => $admin, 'action' => 'connexion', 'detail' => 'Connexion réussie'],
            ['user' => $dirigeant1, 'action' => 'demande.cree', 'detail' => 'Création d\'une demande de tarification'],
            ['user' => $gestionnaire, 'action' => 'demande.prise_en_charge', 'detail' => 'Prise en charge de la demande'],
            ['user' => $conseiller, 'action' => 'devis.emis', 'detail' => 'Émission d\'un devis'],
            ['user' => $admin, 'action' => 'partenaire.valide', 'detail' => 'Validation d\'un partenaire'],
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
        // DOCUMENTS : Kbis partenaires + polices
        // ====================================================================
        foreach ([0, 1] as $i) {
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
        foreach ([$c1['contrat'], $c2['contrat']] as $contrat) {
            Document::create([
                'type_document_id' => $tdPolice->id,
                'nom_origine' => 'police_'.$contrat->reference.'.pdf',
                'taille' => random_int(50000, 200000),
                'mime_reel' => 'application/pdf',
                'mime_declare' => 'application/pdf',
                'objet_type' => 'contrat',
                'objet_id' => $contrat->id,
                'organisation_id' => $contrat->organisation_id,
                'cle_stockage' => 'demo/'.$contrat->reference.'.pdf',
                'version' => 1,
                'statut_validation' => 'VALIDE',
                'sensibilite' => 'NORMALE',
                'statut_antivirus' => 'SAIN',
            ]);
        }

        $this->command?->info('=== Données de démo réduites (5 lignes par table) ===');
        $this->command?->info('Admin cabinet :      admin@carrez.local / password');
        $this->command?->info('Gestionnaire :       gestion@carrez.local / password');
        $this->command?->info('Dirigeant partenaire : dirigeant@courtiervii.local / password');
        $this->command?->info('Collaborateur :      collab@courtiervii.local / password');

        StateMachine::$logAuditTrail = true;
    }
}