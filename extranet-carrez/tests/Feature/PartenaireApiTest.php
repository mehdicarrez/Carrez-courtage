<?php

namespace Tests\Feature;

use App\Models\Organisation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartenaireApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $orgCabinet = Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'CABINET',
            'raison_sociale' => 'Carrez Test',
            'statut' => 'ACTIVE',
        ]);

        $this->admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@test.local',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
            'organisation_id' => $orgCabinet->id,
            'actif' => true,
        ]);
    }

    private function creerPartenaire(string $statut = 'EN_VALIDATION'): Organisation
    {
        return Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Cabinet ' . \Illuminate\Support\Str::random(5),
            'statut' => $statut,
        ]);
    }

    public function test_lister_partenaires(): void
    {
        $this->creerPartenaire();
        $this->creerPartenaire();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/partenaires');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_valider_partenaire(): void
    {
        $partenaire = $this->creerPartenaire();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/partenaires/{$partenaire->id}/valider", [
                'checklist_validation' => [
                    ['cle' => 'kbis', 'libelle' => 'K-Bis à jour', 'ok' => true],
                    ['cle' => 'orias', 'libelle' => 'Immatriculation ORIAS', 'ok' => true],
                    ['cle' => 'id', 'libelle' => 'Pièce d\'identité', 'ok' => true],
                    ['cle' => 'assurance', 'libelle' => 'Attestation RC Pro', 'ok' => true],
                    ['cle' => 'mandat', 'libelle' => 'Mandat signé', 'ok' => true],
                    ['cle' => 'procedure', 'libelle' => 'Procédure en place', 'ok' => true],
                ],
                'branches_autorisees' => [1, 2, 3],
            ]);

        $response->assertOk();
        $this->assertEquals('ACCEPTEE', $response->json('data.decision'));
        $this->assertEquals('ACTIVE', $response->json('data.statut'));
    }

    public function test_valider_partenaire_echoue_sans_checklist(): void
    {
        $partenaire = $this->creerPartenaire();

        // RG-60 : la validation exige une checklist complète + branches autorisées
        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/partenaires/{$partenaire->id}/valider", [
                'checklist_validation' => [
                    ['cle' => 'kbis', 'libelle' => 'K-Bis à jour', 'ok' => false],
                ],
                'branches_autorisees' => [1],
            ]);

        $response->assertStatus(422);
    }

    public function test_suspendre_partenaire_requiert_motif(): void
    {
        $partenaire = $this->creerPartenaire('ACTIVE');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/partenaires/{$partenaire->id}/suspendre");

        $response->assertStatus(422);
    }

    public function test_suspendre_partenaire(): void
    {
        $partenaire = $this->creerPartenaire('ACTIVE');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/partenaires/{$partenaire->id}/suspendre", [
                'motif' => 'Non conformité documentaire',
            ]);

        $response->assertOk();
        $this->assertEquals('SUSPENDUE', $response->json('data.statut'));
        $this->assertFalse($response->json('data.actif'));
    }

    public function test_reactiver_partenaire(): void
    {
        $partenaire = $this->creerPartenaire('SUSPENDUE');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/partenaires/{$partenaire->id}/reactiver");

        $response->assertOk();
        $this->assertEquals('ACTIVE', $response->json('data.statut'));
        $this->assertTrue($response->json('data.actif'));
    }

    public function test_candidature_partenaire(): void
    {
        // La route candidature nécessite auth:sanctum
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/partenaires', [
                'raison_sociale' => 'Nouveau Cabinet',
                'dirigeant' => [
                    'nom' => 'Dupont',
                    'prenom' => 'Jean',
                    'email' => 'jean@dupont.local',
                ],
            ]);

        $response->assertStatus(201);
        $this->assertEquals('EN_VALIDATION', $response->json('data.statut'));
    }

    public function test_non_admin_ne_peut_pas_suspendre(): void
    {
        $orgPartenaire = Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Test',
            'statut' => 'ACTIVE',
        ]);

        $user = User::create([
            'name' => 'Partenaire',
            'email' => 'part@test.local',
            'password' => 'password',
            'role' => User::ROLE_COLLABORATEUR_PARTENAIRE,
            'organisation_id' => $orgPartenaire->id,
            'actif' => true,
        ]);

        $partenaire = $this->creerPartenaire('ACTIVE');

        $response = $this->actingAs($user)
            ->postJson("/api/v1/partenaires/{$partenaire->id}/suspendre", [
                'motif' => 'Test',
            ]);

        $response->assertStatus(403);
    }
}
