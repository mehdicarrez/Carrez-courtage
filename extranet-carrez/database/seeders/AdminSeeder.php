<?php

namespace Database\Seeders;

use App\Models\Organisation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public const EMAIL = 'admin@carrez.local';
    public const PASSWORD = 'Carrez@Admin2026';

    /**
     * Crée (ou met à jour) le compte administrateur du cabinet.
     */
    public function run(): void
    {
        $cabinet = Organisation::firstOrCreate(
            ['raison_sociale' => 'CARREZ CO COURTAGE'],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'type' => Organisation::TYPE_CABINET,
                'forme_juridique' => 'SELAS',
                'siren' => '853412367',
                'numero_orias' => '19001234',
                'categories_orias' => ['COURTIER'],
                'statut' => 'ACTIVE',
                'date_activation' => now()->subYears(3),
            ]
        );

        User::updateOrCreate(
            ['email' => self::EMAIL],
            [
                'name' => 'Camille Carrez',
                'password' => Hash::make(self::PASSWORD),
                'role' => User::ROLE_ADMIN,
                'organisation_id' => $cabinet->id,
                'access_level' => User::ACCESS_TOUS,
                'actif' => true,
                'email_verified_at' => now(),
                'visible_commissions' => true,
            ]
        );

        $this->command?->info('Admin créé : '.self::EMAIL.' / '.self::PASSWORD);
    }
}