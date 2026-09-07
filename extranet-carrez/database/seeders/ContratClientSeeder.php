<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Contrat;
use App\Models\Organisation;
use App\Models\Produit;
use App\Models\Facture;
use App\Models\FactureLigne;
use App\Models\Quittance;
use App\Models\Sinistre;
use App\Models\Tache;
use App\Services\ReferenceService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ContratClientSeeder extends Seeder
{
    public function run(): void
    {
        $refs = app(ReferenceService::class);

        $clients = Client::all();
        $produits = Produit::all();
        $cabinet = Organisation::where('type', 'CABINET')->first();

        if ($clients->isEmpty() || $produits->isEmpty()) {
            $this->command?->warn('Lancez DemoDataSeeder avant ContratClientSeeder.');
            return;
        }

        $defs = [
            [
                'client_idx' => 0,
                'produit_code' => 'AUTO-TOUS-RISQUES',
                'reference' => 'CTR-2026-00101',
                'numero_police' => 'POL-234567-2026',
                'statut' => 'EN_VIGUEUR',
                'prime_ht' => 48500,
                'fractionnement' => 'TRIMESTRIEL',
                'date_effet' => now()->subMonths(6),
                'date_echeance' => now()->addMonths(6),
            ],
            [
                'client_idx' => 0,
                'produit_code' => 'HAB-MULTI',
                'reference' => 'CTR-2026-00102',
                'numero_police' => 'POL-345678-2026',
                'statut' => 'EN_VIGUEUR',
                'prime_ht' => 22000,
                'fractionnement' => 'MENSUEL',
                'date_effet' => now()->subMonths(3),
                'date_echeance' => now()->addMonths(9),
            ],
            [
                'client_idx' => 1,
                'produit_code' => 'SANTE-REF',
                'reference' => 'CTR-2026-00103',
                'numero_police' => 'POL-456789-2026',
                'statut' => 'EN_VIGUEUR',
                'prime_ht' => 67000,
                'fractionnement' => 'MENSUEL',
                'date_effet' => now()->subMonths(10),
                'date_echeance' => now()->addMonths(2),
            ],
            [
                'client_idx' => 2,
                'produit_code' => 'PRO-RC',
                'reference' => 'CTR-2026-00104',
                'numero_police' => 'POL-567890-2026',
                'statut' => 'EN_ATTENTE_SIGNATURE',
                'prime_ht' => 35000,
                'fractionnement' => 'ANNUEL',
                'date_effet' => now()->addDays(15),
                'date_echeance' => now()->addYear(),
            ],
            [
                'client_idx' => 3,
                'produit_code' => 'PREV-IT',
                'reference' => 'CTR-2025-00098',
                'numero_police' => 'POL-678901-2025',
                'statut' => 'RESILIE',
                'prime_ht' => 19000,
                'fractionnement' => 'TRIMESTRIEL',
                'date_effet' => now()->subMonths(14),
                'date_echeance' => now()->subMonths(2),
            ],
            [
                'client_idx' => 4,
                'produit_code' => 'AUTO-TIERS',
                'reference' => 'CTR-2026-00105',
                'numero_police' => 'POL-789012-2026',
                'statut' => 'EN_VIGUEUR',
                'prime_ht' => 15500,
                'fractionnement' => 'ANNUEL',
                'date_effet' => now()->subMonths(2),
                'date_echeance' => now()->addMonths(10),
            ],
            [
                'client_idx' => 5,
                'produit_code' => 'FLOTTE-1',
                'reference' => 'CTR-2026-00106',
                'numero_police' => 'POL-890123-2026',
                'statut' => 'EN_VIGUEUR',
                'prime_ht' => 120000,
                'fractionnement' => 'TRIMESTRIEL',
                'date_effet' => now()->subMonths(4),
                'date_echeance' => now()->addMonths(8),
            ],
            [
                'client_idx' => 6,
                'produit_code' => 'HAB-MULTI',
                'reference' => 'CTR-2026-00107',
                'numero_police' => 'POL-901234-2026',
                'statut' => 'IMPAYE',
                'prime_ht' => 28000,
                'fractionnement' => 'MENSUEL',
                'date_effet' => now()->subMonths(7),
                'date_echeance' => now()->addMonths(5),
            ],
        ];

        $createdContrats = [];

        foreach ($defs as $d) {
            $client = $clients[$d['client_idx']] ?? $clients->first();
            $produit = $produits->firstWhere('code', $d['produit_code']) ?? $produits->first();
            $taxes = (int) round($d['prime_ht'] * 0.13);

            $contrat = Contrat::create([
                'id' => (string) Str::uuid(),
                'reference' => $d['reference'],
                'numero_police' => $d['numero_police'],
                'organisation_id' => $cabinet->id,
                'client_id' => $client->id,
                'produit_id' => $produit->id,
                'date_effet' => $d['date_effet'],
                'date_echeance_principale' => $d['date_echeance'],
                'prime_ht_cts' => $d['prime_ht'],
                'taxes_cts' => $taxes,
                'prime_ttc_cts' => $d['prime_ht'] + $taxes,
                'frais_courtage_cts' => random_int(2000, 6000),
                'fractionnement' => $d['fractionnement'],
                'annee_assurance' => 1,
                'statut' => $d['statut'],
            ]);

            $createdContrats[] = ['contrat' => $contrat, 'def' => $d];
        }

        $nbQuittances = 0;
        foreach ($createdContrats as $item) {
            $contrat = $item['contrat'];
            $d = $item['def'];

            if ($d['statut'] !== 'EN_VIGUEUR') {
                continue;
            }

            $nbEcheances = match ($d['fractionnement']) {
                'MENSUEL' => 12,
                'TRIMESTRIEL' => 4,
                'SEMESTRIEL' => 2,
                default => 1,
            };

            $montantEcheance = (int) round($contrat->prime_ttc_cts / $nbEcheances);

            for ($i = 1; $i <= $nbEcheances; $i++) {
                $dateAppel = $d['date_effet']->copy()->addMonthsNoOverflow($i - 1);
                $dateEcheance = $dateAppel->copy()->addDays(30);

                $statut = 'A_ECHELONNER';
                if ($dateAppel->isPast()) {
                    $statut = fake()->randomElement(['ENCAISSEE', 'ENCAISSEE', 'ENCAISSEE', 'IMPAYEE']);
                }

                Quittance::create([
                    'contrat_id' => $contrat->id,
                    'numero' => $contrat->numero_police . '-' . str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                    'echeance' => $i,
                    'date_appel' => $dateAppel,
                    'date_echeance' => $dateEcheance,
                    'montant_cts' => $montantEcheance,
                    'statut' => $statut,
                    'date_encaissee' => $statut === 'ENCAISSEE' ? $dateEcheance->copy()->subDays(rand(1, 10)) : null,
                ]);
                $nbQuittances++;
            }
        }

        $this->command?->info("8 contrats créés, {$nbQuittances} quittances générées.");

        $sinistresDefs = [
            ['contrat_idx' => 0, 'numero' => 'SIN-2026-001', 'ref_compagnie' => 'SIN-REF-4401', 'type_contrat' => 'Auto tous risques', 'compagnie' => 'AXA', 'garantie' => 'Collision', 'etat' => 'CLOS', 'nature' => 'Collision routière', 'statut' => 'REGLE', 'date_survenance' => now()->subMonths(4), 'date_declaration' => now()->subMonths(4)->addDays(2), 'estime' => 320000, 'regle' => 285000],
            ['contrat_idx' => 0, 'numero' => 'SIN-2026-005', 'ref_compagnie' => 'SIN-REF-4407', 'type_contrat' => 'Auto tous risques', 'compagnie' => 'AXA', 'garantie' => 'Vandalisme', 'etat' => 'EN_COURS_EXPERTISE', 'nature' => 'Vandalisme', 'statut' => 'EN_COURS', 'date_survenance' => now()->subMonth(), 'date_declaration' => now()->subMonth()->addDay(), 'estime' => 45000, 'regle' => null],
            ['contrat_idx' => 2, 'numero' => 'SIN-2026-002', 'ref_compagnie' => 'SIN-REF-4412', 'type_contrat' => 'Santé référence', 'compagnie' => 'Allianz', 'garantie' => 'Hospitalisation', 'etat' => 'CLOS', 'nature' => 'Hospitalisation', 'statut' => 'REGLE', 'date_survenance' => now()->subMonths(6), 'date_declaration' => now()->subMonths(6)->addDays(5), 'estime' => 180000, 'regle' => 180000],
            ['contrat_idx' => 5, 'numero' => 'SIN-2026-003', 'ref_compagnie' => 'SIN-REF-4420', 'type_contrat' => 'Flotte', 'compagnie' => 'MMA', 'garantie' => 'Incendie', 'etat' => 'OUVERT', 'nature' => 'Incendie local', 'statut' => 'DECLARE', 'date_survenance' => now()->subDays(20), 'date_declaration' => now()->subDays(18), 'estime' => 520000, 'regle' => null],
            ['contrat_idx' => 6, 'numero' => 'SIN-2025-010', 'ref_compagnie' => 'SIN-REF-4305', 'type_contrat' => 'Habitation multi', 'compagnie' => 'Generali', 'garantie' => 'Dégât des eaux', 'etat' => 'SANS_SUITE', 'nature' => 'Dégât des eaux', 'statut' => 'REJETE', 'date_survenance' => now()->subMonths(8), 'date_declaration' => now()->subMonths(8)->addDays(3), 'estime' => 75000, 'regle' => null],
        ];

        $enVigueur = array_filter($createdContrats, fn ($c) => $c['def']['statut'] === 'EN_VIGUEUR');
        $enVigueurArr = array_values($enVigueur);

        foreach ($sinistresDefs as $sd) {
            $contratItem = $enVigueurArr[$sd['contrat_idx']] ?? $enVigueurArr[0];
            Sinistre::create([
                'contrat_id' => $contratItem['contrat']->id,
                'numero' => $sd['numero'],
                'ref_compagnie' => $sd['ref_compagnie'],
                'type_contrat' => $sd['type_contrat'],
                'compagnie' => $sd['compagnie'],
                'garantie' => $sd['garantie'],
                'etat' => $sd['etat'],
                'suivi_par_id' => \App\Models\User::where('role', 'CONSEILLER')->value('id'),
                'franchise' => '500 €',
                'circonstance' => $sd['nature'],
                'description_dommages' => $sd['nature'] . ' — description détaillée des dommages constatés.',
                'responsabilite' => 'Tiers',
                'beneficiaire' => 'Client',
                'expertise' => 'Non requis',
                'recours' => 'Aucun',
                'cloture_le' => $sd['etat'] === 'CLOS' ? $sd['date_survenance']->copy()->addDays(30) : null,
                'date_survenance' => $sd['date_survenance'],
                'date_declaration' => $sd['date_declaration'],
                'nature' => $sd['nature'],
                'statut' => $sd['statut'],
                'montant_estime_cts' => $sd['estime'],
                'montant_regle_cts' => $sd['regle'],
                'gestionnaire_porteur' => $contratItem['contrat']->numero_police,
                'declare_par' => 'PARTENAIRE',
            ]);
        }

        $this->command?->info('5 sinistres créés.');

        $tachesDefs = [
            ['client_idx' => 0, 'objet' => 'Suivi sinistre', 'description' => 'En attente des pièces du client avant mise en ligne.', 'priorite' => 'HAUTE', 'statut' => 'EN_COURS', 'echeance' => now()->addDays(3), 'debut' => now(), 'fin' => now()->addDays(3), 'montant' => 500.00, 'avancement' => 40, 'temps' => 2.5],
            ['client_idx' => 0, 'objet' => 'Ouvrir sinistre', 'description' => 'Ouverture du sinistre suite au sinistre déclaré.', 'priorite' => 'FAIBLE', 'statut' => 'A_FAIRE', 'echeance' => now()->addDays(10), 'debut' => now(), 'fin' => now()->addDays(10), 'montant' => null, 'avancement' => 0, 'temps' => null],
            ['client_idx' => 1, 'objet' => 'Relance', 'description' => 'Relance pour le renouvellement santé.', 'priorite' => 'HAUTE', 'statut' => 'A_FAIRE', 'echeance' => now()->addDays(5), 'debut' => now(), 'fin' => now()->addDays(5), 'montant' => null, 'avancement' => 10, 'temps' => 1],
            ['client_idx' => 2, 'objet' => 'Clôturer sinistre', 'description' => 'Finaliser et clôturer le sinistre PRO.', 'priorite' => 'URGENTE', 'statut' => 'A_FAIRE', 'echeance' => now()->addDay(), 'debut' => now(), 'fin' => now()->addDay(), 'montant' => 1200.00, 'avancement' => 25, 'temps' => 3],
            ['client_idx' => 4, 'objet' => 'Expertise', 'description' => 'Transmettre l’attestation et clore l’expertise.', 'priorite' => 'BASSE', 'statut' => 'TERMINEE', 'echeance' => now()->subDays(2), 'debut' => now()->subDays(5), 'fin' => now()->subDays(2), 'montant' => 80.00, 'avancement' => 100, 'temps' => 1.5],
        ];

        $nbTaches = 0;
        $refService = app(\App\Services\ReferenceService::class);
        $conseillerDefault = \App\Models\User::where('role', \App\Models\User::ROLE_CONSEILLER)->value('id');
        foreach ($tachesDefs as $td) {
            $client = $clients[$td['client_idx']] ?? $clients->first();
            Tache::create([
                'client_id' => $client->id,
                'reference' => $refService->tache(),
                'titre' => $td['objet'],
                'type' => 'SINISTRE',
                'objet' => $td['objet'],
                'description' => $td['description'] ?? null,
                'priorite' => $td['priorite'],
                'statut' => $td['statut'],
                'date_echeance' => $td['echeance'] ?? null,
                'date_debut' => $td['debut'] ?? null,
                'date_fin' => $td['fin'] ?? null,
                'montant' => $td['montant'] ?? null,
                'avancement' => $td['avancement'] ?? 0,
                'temps_passe_h' => $td['temps'] ?? null,
                'assignee_id' => $conseillerDefault ?: null,
                'terminee_le' => $td['statut'] === 'TERMINEE' ? now()->subDays(2) : null,
            ]);
            $nbTaches++;
        }

        $this->command?->info("{$nbTaches} tâches créées.");

        $facturesDefs = [
            [
                'client_idx' => 0,
                'souscripteur' => 'Client 0',
                'adresse' => '12 rue de la Paix', 'code_postal' => '75002', 'ville' => 'Paris',
                'contact_commercial' => 'Marie Durand', 'moyens_reglement' => ['Carte bancaire', 'Virement'],
                'statut' => 'EMISE',
                'date_facture' => now()->subDays(10), 'date_echeance' => now()->addDays(20),
                'lignes' => [
                    ['type' => 'Prestation', 'designation' => 'Conseil en assurance auto', 'quantite' => 2, 'prix_unitaire_ht_cts' => 15000, 'taxe' => 20],
                    ['type' => 'Prestation', 'designation' => 'Étude des garanties habitation', 'quantite' => 1, 'prix_unitaire_ht_cts' => 25000, 'taxe' => 20],
                ],
            ],
            [
                'client_idx' => 1,
                'souscripteur' => 'Client 1',
                'adresse' => '8 avenue Foch', 'code_postal' => '75116', 'ville' => 'Paris',
                'contact_commercial' => 'Pierre Martin', 'moyens_reglement' => ['Virement'],
                'statut' => 'PAYEE',
                'date_facture' => now()->subMonths(2), 'date_echeance' => now()->subMonths(2)->addDays(30),
                'lignes' => [
                    ['type' => 'Prestation', 'designation' => 'Gestion de contrat santé', 'quantite' => 1, 'prix_unitaire_ht_cts' => 40000, 'taxe' => 20],
                ],
            ],
        ];

        $nbFactures = 0;
        foreach ($facturesDefs as $fd) {
            $client = $clients[$fd['client_idx']] ?? $clients->first();
            $facture = Facture::create([
                'organisation_id' => $cabinet->id,
                'client_id' => $client->id,
                'reference' => $refs->facture(),
                'souscripteur' => $fd['souscripteur'],
                'adresse' => $fd['adresse'],
                'code_postal' => $fd['code_postal'],
                'ville' => $fd['ville'],
                'contact_commercial' => $fd['contact_commercial'],
                'date_facture' => $fd['date_facture'],
                'date_echeance' => $fd['date_echeance'],
                'moyens_reglement' => $fd['moyens_reglement'],
                'statut' => $fd['statut'],
                'date_encaissee' => $fd['statut'] === 'PAYEE' ? $fd['date_echeance'] : null,
            ]);

            foreach ($fd['lignes'] as $l) {
                $totalHt = (int) round($l['quantite'] * $l['prix_unitaire_ht_cts']);
                $totalTaxes = (int) round($totalHt * $l['taxe'] / 100);
                FactureLigne::create([
                    'facture_id' => $facture->id,
                    'type' => $l['type'],
                    'designation' => $l['designation'],
                    'quantite' => $l['quantite'],
                    'prix_unitaire_ht_cts' => $l['prix_unitaire_ht_cts'],
                    'taxe' => $l['taxe'],
                    'total_ht_cts' => $totalHt,
                    'total_taxes_cts' => $totalTaxes,
                    'total_ttc_cts' => $totalHt + $totalTaxes,
                ]);
            }

            $facture->recalculeTotaux();
            $facture->save();
            $nbFactures++;
        }

        $this->command?->info("{$nbFactures} factures créées.");
    }
}
