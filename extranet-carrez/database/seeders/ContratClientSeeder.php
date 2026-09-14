<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Organisation;
use App\Models\Produit;
use App\Models\Facture;
use App\Models\FactureLigne;
use App\Models\Tache;
use App\Services\ReferenceService;
use Illuminate\Database\Seeder;

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
            [
                'client_idx' => 2,
                'souscripteur' => 'SAS Durand & Fils',
                'adresse' => '5 avenue des Champs', 'code_postal' => '75008', 'ville' => 'Paris',
                'contact_commercial' => 'Julie Bertrand', 'moyens_reglement' => ['Virement'],
                'statut' => 'EMISE',
                'date_facture' => now()->subDays(3), 'date_echeance' => now()->addDays(27),
                'lignes' => [
                    ['type' => 'Prestation', 'designation' => 'Conseil RC professionnelle', 'quantite' => 1, 'prix_unitaire_ht_cts' => 18500, 'taxe' => 20],
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
