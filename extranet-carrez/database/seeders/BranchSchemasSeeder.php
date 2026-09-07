<?php

namespace Database\Seeders;

use App\Models\Branche;
use App\Models\SchemaFormulaire;
use Illuminate\Database\Seeder;

class BranchSchemasSeeder extends Seeder
{
    /**
     * Définit un schéma de formulaire spécifique pour chaque branche.
     * Met à jour le schéma courant existant (idempotent, par code de branche).
     */
    public function run(): void
    {
        $schemas = [
            'AUTO' => [
                'fields' => [
                    ['name' => 'type_souscripteur', 'label' => 'Type de souscripteur', 'type' => 'select', 'required' => true,
                        'options' => [['value' => 'PARTICULIER', 'label' => 'Particulier'], ['value' => 'PROFESSIONNEL', 'label' => 'Professionnel']]],
                    ['name' => 'usage', 'label' => 'Usage du véhicule', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'PRIVE', 'label' => 'Privé'],
                            ['value' => 'TRAJET_DOMICILE_TRAVAIL', 'label' => 'Trajet domicile-travail'],
                            ['value' => 'PROFESSIONNEL', 'label' => 'Professionnel'],
                        ]],
                    ['name' => 'marque', 'label' => 'Marque', 'type' => 'text', 'required' => true],
                    ['name' => 'modele', 'label' => 'Modèle', 'type' => 'text', 'required' => true],
                    ['name' => 'immatriculation', 'label' => 'Immatriculation', 'type' => 'text', 'required' => true],
                    ['name' => 'puissance_cv', 'label' => 'Puissance (chevaux fiscaux)', 'type' => 'number', 'required' => true],
                    ['name' => 'carburant', 'label' => 'Carburant', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'ESSENCE', 'label' => 'Essence'],
                            ['value' => 'DIESEL', 'label' => 'Diesel'],
                            ['value' => 'HYBRIDE', 'label' => 'Hybride'],
                            ['value' => 'ELECTRIQUE', 'label' => 'Électrique'],
                        ]],
                    ['name' => 'mise_en_circulation', 'label' => 'Date de mise en circulation', 'type' => 'date', 'required' => true],
                    ['name' => 'valeur_vehicule', 'label' => 'Valeur du véhicule (€)', 'type' => 'number', 'required' => true],
                    ['name' => 'kilometrage', 'label' => 'Kilométrage annuel', 'type' => 'number'],
                    ['name' => 'permis_recent', 'label' => 'Permis obtenu depuis moins de 3 ans', 'type' => 'bool'],
                    ['name' => 'malus', 'label' => 'Malus / pénalité CRM', 'type' => 'number'],
                ],
            ],
            'HABITATION' => [
                'fields' => [
                    ['name' => 'type_souscripteur', 'label' => 'Type de souscripteur', 'type' => 'select', 'required' => true,
                        'options' => [['value' => 'PARTICULIER', 'label' => 'Particulier'], ['value' => 'PROFESSIONNEL', 'label' => 'Professionnel']]],
                    ['name' => 'adresse_bien', 'label' => 'Localisation du bien', 'type' => 'textarea', 'required' => true],
                    ['name' => 'code_postal_bien', 'label' => 'Code postal du bien', 'type' => 'text', 'required' => true],
                    ['name' => 'ville_bien', 'label' => 'Ville du bien', 'type' => 'text', 'required' => true],
                    ['name' => 'statut_occupation', 'label' => 'Statut', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'PROPRIETAIRE_OCCUPANT', 'label' => 'Propriétaire occupant'],
                            ['value' => 'PROPRIETAIRE_NON_OCCUPANT', 'label' => 'Propriétaire non occupant'],
                            ['value' => 'LOCATAIRE', 'label' => 'Locataire'],
                        ]],
                    ['name' => 'type_bien', 'label' => 'Type de bien', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'APPARTEMENT', 'label' => 'Appartement'],
                            ['value' => 'MAISON', 'label' => 'Maison'],
                            ['value' => 'STUDIO', 'label' => 'Studio'],
                            ['value' => 'IMMEUBLE', 'label' => 'Immeuble'],
                        ]],
                    ['name' => 'superficie', 'label' => 'Superficie (m²)', 'type' => 'number', 'required' => true],
                    ['name' => 'nb_pieces', 'label' => 'Nombre de pièces', 'type' => 'number', 'required' => true],
                    ['name' => 'annee_construction', 'label' => 'Année de construction', 'type' => 'number'],
                    ['name' => 'valeur_batiment', 'label' => 'Valeur du bâtiment (€)', 'type' => 'number'],
                    ['name' => 'valeur_contenu', 'label' => 'Valeur du contenu (mobilier, €)', 'type' => 'number'],
                ],
            ],
            'SANTE' => [
                'fields' => [
                    ['name' => 'type_souscripteur', 'label' => 'Type de souscripteur', 'type' => 'select', 'required' => true,
                        'options' => [['value' => 'PARTICULIER', 'label' => 'Particulier'], ['value' => 'PROFESSIONNEL', 'label' => 'Professionnel']]],
                    ['name' => 'regime', 'label' => 'Régime', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'GENERAL', 'label' => 'Régime général'],
                            ['value' => 'AGRICOLE', 'label' => 'Régime agricole (MSA)'],
                            ['value' => 'RSI', 'label' => 'Indépendant (SSI)'],
                            ['value' => 'SPECIAL', 'label' => 'Régime spécial'],
                        ]],
                    ['name' => 'formule', 'label' => 'Formule souhaitée', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'ESSENTIELLE', 'label' => 'Essentielle'],
                            ['value' => 'CONFORT', 'label' => 'Confort'],
                            ['value' => 'PREMIUM', 'label' => 'Premium'],
                        ]],
                    ['name' => 'nb_assures', 'label' => 'Nombre d\'assurés', 'type' => 'number', 'required' => true],
                    ['name' => 'membres_famille', 'label' => 'Membres à couvrir', 'type' => 'select',
                        'options' => [
                            ['value' => 'SOLO', 'label' => 'Assuré seul'],
                            ['value' => 'COUPLE', 'label' => 'Couple'],
                            ['value' => 'FAMILLE', 'label' => 'Famille'],
                        ]],
                    ['name' => 'anciennete_contrat_actuel', 'label' => 'Ancienneté du contrat actuel (années)', 'type' => 'number'],
                    ['name' => 'hospitalisation_renforcee', 'label' => 'Option hospitalisation renforcée', 'type' => 'bool'],
                    ['name' => 'questionnaire_medical', 'label' => 'Remarques médicales', 'type' => 'textarea'],
                ],
            ],
            'PREVOYANCE' => [
                'fields' => [
                    ['name' => 'type_souscripteur', 'label' => 'Type de souscripteur', 'type' => 'select', 'required' => true,
                        'options' => [['value' => 'PARTICULIER', 'label' => 'Particulier'], ['value' => 'PROFESSIONNEL', 'label' => 'Professionnel']]],
                    ['name' => 'garanties', 'label' => 'Garanties souhaitées', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'DECES', 'label' => 'Décès'],
                            ['value' => 'ITT', 'label' => 'Incapacité temporaire de travail'],
                            ['value' => 'PTIA', 'label' => 'Invalidité permanente'],
                            ['value' => 'DEPENDANCE', 'label' => 'Dépendance'],
                        ]],
                    ['name' => 'capital_assure', 'label' => 'Capital assuré (€)', 'type' => 'number'],
                    ['name' => 'montant_rente', 'label' => 'Montant de rente (€/mois)', 'type' => 'number'],
                    ['name' => 'situation_professionnelle', 'label' => 'Situation professionnelle', 'type' => 'select',
                        'options' => [
                            ['value' => 'SALARIE', 'label' => 'Salarié'],
                            ['value' => 'INDEPENDANT', 'label' => 'Indépendant'],
                            ['value' => 'CHOMEUR', 'label' => 'Sans emploi'],
                            ['value' => 'RETRAITE', 'label' => 'Retraité'],
                            ['value' => 'ETUDIANT', 'label' => 'Étudiant'],
                        ]],
                    ['name' => 'fumeur', 'label' => 'Fumeur', 'type' => 'bool'],
                    ['name' => 'date_naissance_assure', 'label' => 'Date de naissance de l\'assuré', 'type' => 'date', 'required' => true],
                ],
            ],
            'PRO-PRO' => [
                'fields' => [
                    ['name' => 'activite', 'label' => 'Activité / Profession', 'type' => 'text', 'required' => true],
                    ['name' => 'forme_juridique', 'label' => 'Forme juridique', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'EI', 'label' => 'Entreprise individuelle'],
                            ['value' => 'EIRL', 'label' => 'EIRL'],
                            ['value' => 'SARL', 'label' => 'SARL'],
                            ['value' => 'SAS', 'label' => 'SAS'],
                            ['value' => 'LIBERALE', 'label' => 'Profession libérale'],
                        ]],
                    ['name' => 'chiffre_affaires', 'label' => 'Chiffre d\'affaires annuel (€)', 'type' => 'number', 'required' => true],
                    ['name' => 'nb_salaries', 'label' => 'Nombre de salariés', 'type' => 'number'],
                    ['name' => 'siret', 'label' => 'SIRET', 'type' => 'text'],
                    ['name' => 'adresse_activite', 'label' => 'Adresse d\'activité', 'type' => 'textarea'],
                    ['name' => 'montant_garantie', 'label' => 'Montant de garantie souhaité (€)', 'type' => 'number'],
                    ['name' => 'sous_traitance', 'label' => 'Recours à la sous-traitance', 'type' => 'bool'],
                ],
            ],
            'FLOTTE' => [
                'fields' => [
                    ['name' => 'nb_vehicules', 'label' => 'Nombre de véhicules', 'type' => 'number', 'required' => true],
                    ['name' => 'type_vehicules', 'label' => 'Type de véhicules', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'VL', 'label' => 'Véhicules légers'],
                            ['value' => 'UTILITAIRES', 'label' => 'Utilitaires'],
                            ['value' => 'PL', 'label' => 'Poids lourds'],
                            ['value' => 'MIXTE', 'label' => 'Flotte mixte'],
                        ]],
                    ['name' => 'valeur_parc', 'label' => 'Valeur du parc (€)', 'type' => 'number', 'required' => true],
                    ['name' => 'usage_principal', 'label' => 'Usage principal', 'type' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'LIVRAISON', 'label' => 'Livraison'],
                            ['value' => 'TRANSPORT_PERSONNES', 'label' => 'Transport de personnes'],
                            ['value' => 'COMMERCIAL', 'label' => 'Déplacements commerciaux'],
                            ['value' => 'CHANTIER', 'label' => 'Chantier'],
                        ]],
                    ['name' => 'annee_parc', 'label' => 'Année moyenne des véhicules', 'type' => 'number'],
                    ['name' => 'immatriculations', 'label' => 'Immatriculations (une par ligne)', 'type' => 'textarea'],
                    ['name' => 'sinistralite_3ans', 'label' => 'Sinistralité sur 3 ans', 'type' => 'number'],
                ],
            ],
        ];

        // Certains environnements utilisent des codes de branche différents (ex. SANTE -> BR01).
        // On retrouve la branche par code, sinon par nom (insensible à la casse / accents ignorés).
        $noms = [
            'AUTO' => 'Automobile',
            'HABITATION' => 'Habitation',
            'SANTE' => 'Santé',
            'PREVOYANCE' => 'Prévoyance',
            'PRO-PRO' => 'Professionnels',
            'FLOTTE' => 'Flotte automobile',
        ];

        foreach ($schemas as $code => $schema) {
            $branche = Branche::where('code', $code)->first();

            if (!$branche && isset($noms[$code])) {
                $branche = Branche::whereRaw('LOWER(nom) = ?', [mb_strtolower($noms[$code])])->first();
            }

            if (!$branche) {
                continue;
            }

            // On garantit un seul schéma courant pour la branche.
            SchemaFormulaire::where('branche_id', $branche->id)->update(['courant' => false]);

            $existant = SchemaFormulaire::where('branche_id', $branche->id)->orderByDesc('version')->first();

            if ($existant) {
                $existant->update(['schema' => $schema, 'courant' => true]);
                continue;
            }

            SchemaFormulaire::create([
                'branche_id' => $branche->id,
                'version' => 1,
                'schema' => $schema,
                'pieces_attendues' => [['type_document_id' => null, 'obligatoire' => true]],
                'courant' => true,
                'auteur_id' => null,
            ]);
        }
    }
}
