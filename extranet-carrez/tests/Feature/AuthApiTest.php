<?php

namespace Tests\Feature;

use App\Models\Organisation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_avec_identifiants_valides(): void
    {
        $org = Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'CABINET',
            'raison_sociale' => 'Test',
            'statut' => 'ACTIVE',
        ]);

        User::create([
            'name' => 'Test User',
            'email' => 'test@test.local',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
            'organisation_id' => $org->id,
            'actif' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@test.local',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_avec_mauvais_mdp(): void
    {
        $org = Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'CABINET',
            'raison_sociale' => 'Test',
            'statut' => 'ACTIVE',
        ]);

        User::create([
            'name' => 'Test User',
            'email' => 'test@test.local',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
            'organisation_id' => $org->id,
            'actif' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@test.local',
            'password' => 'wrongpassword',
        ]);

        // AuthController throws ValidationException → 422
        $response->assertStatus(422);
    }

    public function test_me_retourne_utilisateur_connecte(): void
    {
        $org = Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'CABINET',
            'raison_sociale' => 'Test',
            'statut' => 'ACTIVE',
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@test.local',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
            'organisation_id' => $org->id,
            'actif' => true,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/auth/me');

        // AuthController::me returns ['user' => [...]]
        $response->assertOk()
            ->assertJsonPath('user.email', 'test@test.local');
    }

    public function test_logout_invalide_token(): void
    {
        $response = $this->postJson('/api/v1/auth/logout', [], [
            'Authorization' => 'Bearer invalid-token',
        ]);

        $response->assertStatus(401);
    }
}
