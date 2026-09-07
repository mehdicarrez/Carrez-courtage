<?php

namespace Tests\Feature;

use App\Models\Branche;
use App\Models\Client;
use App\Models\DemandeTarification;
use App\Models\Organisation;
use App\Models\SchemaFormulaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Tests\TestCase;

class ClientApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $partenaire;
    private Organisation $orgPartenaire;

    protected function setUp(): void
    {
        parent::setUp();

        $orgCabinet = Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => 'CABINET',
            'raison_sociale' => 'Carrez Test',
            'statut' => 'ACTIVE',
        ]);

        $this->orgPartenaire = Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Cabinet Test',
            'statut' => 'ACTIVE',
        ]);

        $this->admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@test.local',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
            'organisation_id' => $orgCabinet->id,
            'actif' => true,
        ]);

        $this->partenaire = User::create([
            'name' => 'Partenaire',
            'email' => 'partenaire@test.local',
            'password' => 'password',
            'role' => User::ROLE_DIRIGEANT_PARTENAIRE,
            'organisation_id' => $this->orgPartenaire->id,
            'actif' => true,
        ]);
    }

    public function test_creer_client_physique(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/clients', [
                'type' => 'PHYSIQUE',
                'nom' => 'Dupont',
                'prenom' => 'Jean',
                'email' => 'jean@dupont.fr',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.nom_complet', 'Jean Dupont');

        $this->assertDatabaseHas('clients', ['email' => 'jean@dupont.fr']);
    }

    public function test_lister_clients_recherche(): void
    {
        Client::create([
            'organisation_id' => $this->orgPartenaire->id,
            'type' => 'PHYSIQUE',
            'nom' => 'Martin',
            'prenom' => 'Sophie',
            'email' => 'sophie@martin.fr',
        ]);
        Client::create([
            'organisation_id' => $this->orgPartenaire->id,
            'type' => 'PHYSIQUE',
            'nom' => 'Durand',
            'prenom' => 'Paul',
            'email' => 'paul@durand.fr',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/clients?q=martin');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Martin', $response->json('data.0.nom'));
    }

    public function test_partenaire_cloisonne_voir_ses_clients(): void
    {
        Client::create([
            'organisation_id' => $this->orgPartenaire->id,
            'type' => 'PHYSIQUE',
            'nom' => 'Moi',
        ]);

        $autreOrg = Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Autre',
            'statut' => 'ACTIVE',
        ]);
        Client::create([
            'organisation_id' => $autreOrg->id,
            'type' => 'PHYSIQUE',
            'nom' => 'Autre',
        ]);

        $response = $this->actingAs($this->partenaire)->getJson('/api/v1/clients');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Moi', $response->json('data.0.nom'));
    }

    public function test_supprimer_client_rattache_a_demande_active_interdit(): void
    {
        $client = Client::create([
            'organisation_id' => $this->orgPartenaire->id,
            'type' => 'PHYSIQUE',
            'nom' => 'X',
            'prenom' => 'Y',
        ]);

        $branche = Branche::create(['code' => 'AUTO', 'nom' => 'Automobile', 'famille' => 'Biens']);
        SchemaFormulaire::create([
            'branche_id' => $branche->id,
            'version' => 1,
            'schema' => ['fields' => []],
            'courant' => true,
        ]);

        DemandeTarification::create([
            'id' => (string) Str::uuid(),
            'reference' => 'DT-2026-000500',
            'organisation_id' => $this->orgPartenaire->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'client_id' => $client->id,
            'statut' => 'SOUMISE',
            'origine' => 'PARTENAIRE',
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/clients/{$client->id}");

        $response->assertStatus(422);
    }

    public function test_import_csv_clients(): void
    {
        $csv = "nom;prenom;email;ville\nDupont;Jean;jean@dupont.fr;Paris\nMartin;Sophie;sophie@martin.fr;Lyon\n";
        $file = UploadedFile::fake()->createWithContent('clients.csv', $csv);

        $response = $this->actingAs($this->admin)
            ->post('/api/v1/clients/import', ['file' => $file]);

        $response->assertOk()
            ->assertJsonPath('crees', 2);
        $this->assertDatabaseHas('clients', ['email' => 'jean@dupont.fr']);
        $this->assertDatabaseHas('clients', ['email' => 'sophie@martin.fr']);
    }

    public function test_affecter_client_a_demande(): void
    {
        $client = Client::create([
            'organisation_id' => $this->orgPartenaire->id,
            'type' => 'PHYSIQUE',
            'nom' => 'Dupont',
            'prenom' => 'Jean',
        ]);

        $branche = Branche::create(['code' => 'AUTO', 'nom' => 'Automobile', 'famille' => 'Biens']);
        SchemaFormulaire::create([
            'branche_id' => $branche->id,
            'version' => 1,
            'schema' => ['fields' => []],
            'courant' => true,
        ]);

        $demande = DemandeTarification::create([
            'id' => (string) Str::uuid(),
            'reference' => 'DT-2026-000501',
            'organisation_id' => $this->orgPartenaire->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'SOUMISE',
            'origine' => 'PARTENAIRE',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/demandes/affectation-clients', [
                'demande_ids' => [$demande->id],
                'client_id' => $client->id,
            ]);

        $response->assertOk()->assertJsonPath('mis_a_jour', 1);
        $this->assertEquals($client->id, $demande->fresh()->client_id);
    }
}
