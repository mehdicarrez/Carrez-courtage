<?php

namespace Tests\Unit\Services;

use App\Models\BaremeCommission;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\LigneCommission;
use App\Services\CommissionCalculator;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CommissionCalculatorTest extends TestCase
{
    use RefreshDatabase;

    private function creerOrganisation(): \App\Models\Organisation
    {
        return \App\Models\Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Test SARL',
            'statut' => 'ACTIVE',
        ]);
    }

    private function creerContrat(string $organisationId): Contrat
    {
        $client = Client::create([
            'organisation_id' => $organisationId,
            'type' => 'PHYSIQUE',
            'nom' => 'Dupont',
            'prenom' => 'Jean',
        ]);

        return Contrat::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'CT-2026-000001',
            'organisation_id' => $organisationId,
            'client_id' => $client->id,
            'date_effet' => now(),
            'date_echeance_principale' => now()->addYear(),
            'prime_ht_cts' => 100000,
            'prime_ttc_cts' => 120000,
            'fractionnement' => 'ANNUEL',
            'annee_assurance' => 1,
            'statut' => 'EN_VIGUEUR',
        ]);
    }

    public function test_calculer_montant_pourcentage_prime_ht(): void
    {
        $org = $this->creerOrganisation();
        $bareme = BaremeCommission::create([
            'organisation_id' => $org->id,
            'date_debut' => now()->startOfYear(),
            'assiette' => 'PERCENT_PRIME_HT',
            'taux_1ere_annee' => 50.0,
            'courant' => true,
        ]);

        $calc = new CommissionCalculator(app(\App\Services\AuditLogger::class));

        $result = $calc->calculerMontant($bareme, 100000, 120000, 50.0);
        $this->assertEquals(50000, $result);
    }

    public function test_calculer_montant_pourcentage_commission_cabinet(): void
    {
        $org = $this->creerOrganisation();
        $bareme = BaremeCommission::create([
            'organisation_id' => $org->id,
            'date_debut' => now()->startOfYear(),
            'assiette' => 'PERCENT_COMMISSION_CABINET',
            'taux_1ere_annee' => 50.0,
            'courant' => true,
        ]);

        $calc = new CommissionCalculator(app(\App\Services\AuditLogger::class));

        $result = $calc->calculerMontant($bareme, 100000, 120000, 50.0);
        $this->assertEquals(10000, $result);
    }

    public function test_bareme_pour_recherche_bareme_en_vigueur(): void
    {
        $org = $this->creerOrganisation();

        $baremeCourant = BaremeCommission::create([
            'organisation_id' => $org->id,
            'date_debut' => now()->subMonth(),
            'assiette' => 'PERCENT_PRIME_HT',
            'taux_1ere_annee' => 50.0,
            'courant' => true,
        ]);

        $contrat = new Contrat();
        $contrat->organisation_id = $org->id;
        $contrat->date_effet = now();

        $calc = new CommissionCalculator(app(\App\Services\AuditLogger::class));
        $result = $calc->baremePour($contrat);

        $this->assertEquals($baremeCourant->id, $result->id);
    }

    public function test_generer_lignes_previsionnelles(): void
    {
        $org = $this->creerOrganisation();

        BaremeCommission::create([
            'organisation_id' => $org->id,
            'date_debut' => now()->startOfYear(),
            'assiette' => 'PERCENT_PRIME_HT',
            'taux_1ere_annee' => 50.0,
            'taux_renouvellement' => 45.0,
            'courant' => true,
        ]);

        $contrat = $this->creerContrat($org->id);

        $calc = new CommissionCalculator(app(\App\Services\AuditLogger::class));
        $calc->genererLignesPrevisionnelles($contrat);

        $ligne = LigneCommission::where('contrat_id', $contrat->id)->first();

        $this->assertNotNull($ligne);
        $this->assertEquals('PREVISIONNELLE', $ligne->statut);
        $this->assertEquals(50000, $ligne->montant_cts);
        $this->assertEquals(50.0, $ligne->taux);
        $this->assertEquals(100000, $ligne->assiette_cts);
    }

    public function test_generer_reprise_annule_lignes(): void
    {
        $org = $this->creerOrganisation();

        BaremeCommission::create([
            'organisation_id' => $org->id,
            'date_debut' => now()->startOfYear(),
            'assiette' => 'PERCENT_PRIME_HT',
            'taux_1ere_annee' => 50.0,
            'courant' => true,
        ]);

        $contrat = $this->creerContrat($org->id);

        $calc = new CommissionCalculator(app(\App\Services\AuditLogger::class));
        $calc->genererLignesPrevisionnelles($contrat);
        $calc->genererReprise($contrat, 'RESILIATION:NON_PAIEMENT');

        $ligneOrigine = LigneCommission::where('contrat_id', $contrat->id)
            ->where('statut', 'ANNULEE')
            ->first();
        $ligneReprise = LigneCommission::where('contrat_id', $contrat->id)
            ->where('statut', 'REPRISE')
            ->first();

        $this->assertNotNull($ligneOrigine);
        $this->assertNotNull($ligneReprise);
        $this->assertEquals(-50000, $ligneReprise->montant_cts);
        $this->assertEquals($ligneOrigine->id, $ligneReprise->ligne_reprise_de);
    }

    public function test_retrocession_estimation(): void
    {
        $org = $this->creerOrganisation();
        BaremeCommission::create([
            'organisation_id' => $org->id,
            'date_debut' => now()->startOfYear(),
            'assiette' => 'PERCENT_PRIME_HT',
            'taux_1ere_annee' => 50.0,
            'courant' => true,
        ]);

        $branche = \App\Models\Branche::create(['code' => 'AUTO', 'nom' => 'Auto', 'famille' => 'Biens']);
        $demande = \App\Models\DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000020',
            'organisation_id' => $org->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'BROUILLON',
        ]);

        $calc = new CommissionCalculator(app(\App\Services\AuditLogger::class));
        $result = $calc->estimerRetrocession($demande, 100000);

        $this->assertEquals(50000, $result);
    }
}
