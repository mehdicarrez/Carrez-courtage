<?php

namespace Tests\Feature;

use App\Models\Branche;
use App\Models\Client;
use App\Models\DemandeTarification;
use App\Models\Organisation;
use App\Models\SchemaFormulaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemandeApiTest extends TestCase
{
    use RefreshDatabase;

    private User $partenaire;
    private User $admin;
    private Organisation $orgPartenaire;

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
    }

    public function test_creer_demande_en_tant_que_partenaire(): void
    {
        $response = $this->actingAs($this->partenaire)
            ->postJson('/api/v1/demandes', [
                'branche_id' => Branche::first()->id,
                'client' => [
                    'type' => 'PHYSIQUE',
                    'nom' => 'Dupont',
                    'prenom' => 'Jean',
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'reference', 'statut'],
            ]);

        $this->assertEquals('BROUILLON', $response->json('data.statut'));
    }

    public function test_lister_demandes_partenaire_voit_uniquement_les_siennes(): void
    {
        $branche = Branche::first();

        DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000050',
            'organisation_id' => $this->orgPartenaire->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'SOUMISE',
            'origine' => 'PARTENAIRE',
        ]);

        $autreOrg = Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Autre Test',
            'statut' => 'ACTIVE',
        ]);

        DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000051',
            'organisation_id' => $autreOrg->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'SOUMISE',
            'origine' => 'PARTENAIRE',
        ]);

        $response = $this->actingAs($this->partenaire)
            ->getJson('/api/v1/demandes');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_supprimer_brouillon(): void
    {
        $branche = Branche::first();

        $demande = DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000052',
            'organisation_id' => $this->orgPartenaire->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'BROUILLON',
            'origine' => 'PARTENAIRE',
        ]);

        $response = $this->actingAs($this->partenaire)
            ->deleteJson("/api/v1/demandes/{$demande->id}");

        $response->assertOk();
        // SoftDeletes : le record existe encore mais avec deleted_at non null
        $this->assertSoftDeleted('demandes_tarification', ['id' => $demande->id]);
    }

    public function test_supprimer_demande_soumise_interdit(): void
    {
        $branche = Branche::first();

        $demande = DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000053',
            'organisation_id' => $this->orgPartenaire->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'SOUMISE',
            'origine' => 'PARTENAIRE',
        ]);

        $response = $this->actingAs($this->partenaire)
            ->deleteJson("/api/v1/demandes/{$demande->id}");

        $response->assertStatus(422);
    }

    public function test_transition_soumettre_demande(): void
    {
        $branche = Branche::first();

        $demande = DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000054',
            'organisation_id' => $this->orgPartenaire->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'BROUILLON',
            'origine' => 'PARTENAIRE',
        ]);

        $response = $this->actingAs($this->partenaire)
            ->postJson("/api/v1/demandes/{$demande->id}/transitions", [
                'action' => 'soumettre',
            ]);

        $response->assertOk();
        $this->assertEquals('SOUMISE', $response->json('data.statut'));
    }

    public function test_acces_demande_autre_partenaire_refuse(): void
    {
        $branche = Branche::first();

        $autreOrg = Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Autre',
            'statut' => 'ACTIVE',
        ]);

        $demande = DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000055',
            'organisation_id' => $autreOrg->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'SOUMISE',
        ]);

        $response = $this->actingAs($this->partenaire)
            ->getJson("/api/v1/demandes/{$demande->id}");

        $response->assertStatus(404);
    }
}
