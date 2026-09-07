<?php

namespace Tests\Feature;

use App\Models\BaremeCommission;
use App\Models\Branche;
use App\Models\DemandeTarification;
use App\Models\Devis;
use App\Models\Organisation;
use App\Models\Produit;
use App\Models\SchemaFormulaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DevisApiTest extends TestCase
{
    use RefreshDatabase;

    private User $partenaire;
    private User $admin;
    private Organisation $orgPartenaire;
    private DemandeTarification $demande;

    protected function setUp(): void
    {
        parent::setUp();

        $this->orgPartenaire = Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Cabinet Test',
            'statut' => 'ACTIVE',
        ]);

        $orgCabinet = Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'CABINET',
            'raison_sociale' => 'Carrez Test',
            'statut' => 'ACTIVE',
        ]);

        $this->partenaire = User::create([
            'name' => 'Partenaire Test',
            'email' => 'partenaire@test.local',
            'password' => 'password',
            'role' => User::ROLE_DIRIGEANT_PARTENAIRE,
            'organisation_id' => $this->orgPartenaire->id,
            'actif' => true,
        ]);

        $this->admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@test.local',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
            'organisation_id' => $orgCabinet->id,
            'actif' => true,
        ]);

        $branche = Branche::create(['code' => 'AUTO', 'nom' => 'Automobile', 'famille' => 'Biens']);

        SchemaFormulaire::create([
            'branche_id' => $branche->id,
            'version' => 1,
            'schema' => ['fields' => []],
            'courant' => true,
        ]);

        BaremeCommission::create([
            'organisation_id' => $this->orgPartenaire->id,
            'date_debut' => now()->startOfYear(),
            'assiette' => 'PERCENT_PRIME_HT',
            'taux_1ere_annee' => 50.0,
            'taux_renouvellement' => 45.0,
            'courant' => true,
        ]);

        $this->demande = DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000100',
            'organisation_id' => $this->orgPartenaire->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'EN_ETUDE',
            'origine' => 'PARTENAIRE',
        ]);
    }

    public function test_cabinet_cree_devis(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/demandes/{$this->demande->id}/devis", [
                'prime_ht_cts' => 100000,
                'taxes_cts' => 20000,
                'date_validite' => now()->addDays(30)->toDateString(),
                'garanties' => [
                    ['intitule' => 'RC', 'incluse' => true],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'prime_ht_cts', 'prime_ttc_cts', 'statut'],
            ]);

        $this->assertEquals('BROUILLON', $response->json('data.statut'));
        $this->assertEquals(120000, $response->json('data.prime_ttc_cts'));
    }

    public function test_partenaire_ne_peut_pas_cree_devis(): void
    {
        $response = $this->actingAs($this->partenaire)
            ->postJson("/api/v1/demandes/{$this->demande->id}/devis", [
                'prime_ht_cts' => 100000,
                'date_validite' => now()->addDays(30)->toDateString(),
            ]);

        $response->assertStatus(403);
    }

    public function test_lister_devis_dune_demande(): void
    {
        Devis::create([
            'demande_id' => $this->demande->id,
            'version' => 1,
            'prime_ht_cts' => 100000,
            'prime_ttc_cts' => 120000,
            'date_validite' => now()->addDays(30),
            'statut' => 'ENVOYE',
        ]);

        $response = $this->actingAs($this->partenaire)
            ->getJson("/api/v1/demandes/{$this->demande->id}/devis");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_transition_envoyer_devis(): void
    {
        $devis = Devis::create([
            'demande_id' => $this->demande->id,
            'version' => 1,
            'prime_ht_cts' => 100000,
            'prime_ttc_cts' => 120000,
            'date_validite' => now()->addDays(30),
            'statut' => 'BROUILLON',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/devis/{$devis->id}/transitions", [
                'action' => 'envoyer',
            ]);

        $response->assertOk();
        $this->assertEquals('ENVOYE', $response->json('data.statut'));
    }

    public function test_partenaire_peut_accepter_devis(): void
    {
        $devis = Devis::create([
            'demande_id' => $this->demande->id,
            'version' => 1,
            'prime_ht_cts' => 100000,
            'prime_ttc_cts' => 120000,
            'date_validite' => now()->addDays(30),
            'statut' => 'ENVOYE',
        ]);

        $response = $this->actingAs($this->partenaire)
            ->postJson("/api/v1/devis/{$devis->id}/transitions", [
                'action' => 'accepter',
            ]);

        $response->assertOk();
        $this->assertEquals('ACCEPTE', $response->json('data.statut'));
    }

    public function test_devis_expire_ne_peut_pas_etre_accepte(): void
    {
        $devis = Devis::create([
            'demande_id' => $this->demande->id,
            'version' => 1,
            'prime_ht_cts' => 100000,
            'prime_ttc_cts' => 120000,
            'date_validite' => now()->subDay(),
            'statut' => 'ENVOYE',
        ]);

        $response = $this->actingAs($this->partenaire)
            ->postJson("/api/v1/devis/{$devis->id}/transitions", [
                'action' => 'accepter',
            ]);

        $response->assertStatus(422);
    }

    public function test_refus_requiert_motif(): void
    {
        $devis = Devis::create([
            'demande_id' => $this->demande->id,
            'version' => 1,
            'prime_ht_cts' => 100000,
            'prime_ttc_cts' => 120000,
            'date_validite' => now()->addDays(30),
            'statut' => 'ENVOYE',
        ]);

        $response = $this->actingAs($this->partenaire)
            ->postJson("/api/v1/devis/{$devis->id}/transitions", [
                'action' => 'refuser',
            ]);

        $response->assertStatus(422);
    }
}
