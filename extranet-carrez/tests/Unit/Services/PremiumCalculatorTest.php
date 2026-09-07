<?php

namespace Tests\Unit\Services;

use App\Models\BaremeCommission;
use App\Models\DemandeTarification;
use App\Services\PremiumCalculator;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PremiumCalculatorTest extends TestCase
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

    private function creerBareme(string $organisationId, float $taux = 50.0): BaremeCommission
    {
        return BaremeCommission::create([
            'organisation_id' => $organisationId,
            'date_debut' => now()->startOfYear(),
            'assiette' => 'PERCENT_PRIME_HT',
            'taux_1ere_annee' => $taux,
            'taux_renouvellement' => 45.0,
            'courant' => true,
        ]);
    }

    private function creerDemande(string $organisationId): DemandeTarification
    {
        $branche = \App\Models\Branche::create(['code' => 'AUTO', 'nom' => 'Auto', 'famille' => 'Biens']);
        return DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000001',
            'organisation_id' => $organisationId,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'BROUILLON',
        ]);
    }

    public function test_retourne_null_sans_bareme(): void
    {
        $org = $this->creerOrganisation();
        $demande = $this->creerDemande($org->id);

        $calc = new PremiumCalculator();
        $result = $calc->estimerRetrocession($demande, 100000);

        $this->assertNull($result);
    }

    public function test_calcule_retrocession_pourcentage_prime_ht(): void
    {
        $org = $this->creerOrganisation();
        $this->creerBareme($org->id, 50.0);

        $demande = $this->creerDemande($org->id);

        $calc = new PremiumCalculator();
        $result = $calc->estimerRetrocession($demande, 100000);

        $this->assertEquals(50000, $result);
    }

    public function test_calcule_retrocession_arrondi_centime(): void
    {
        $org = $this->creerOrganisation();
        $this->creerBareme($org->id, 33.33);

        $demande = $this->creerDemande($org->id);

        $calc = new PremiumCalculator();
        $result = $calc->estimerRetrocession($demande, 15000);

        $this->assertIsInt($result);
        $this->assertEquals(5000, $result);
    }

    public function test_bareme_sans_taux_retourne_null(): void
    {
        $org = $this->creerOrganisation();
        BaremeCommission::create([
            'organisation_id' => $org->id,
            'date_debut' => now()->startOfYear(),
            'assiette' => 'PERCENT_PRIME_HT',
            'taux_1ere_annee' => null,
            'courant' => true,
        ]);

        $demande = $this->creerDemande($org->id);

        $calc = new PremiumCalculator();
        $result = $calc->estimerRetrocession($demande, 100000);

        $this->assertNull($result);
    }
}
