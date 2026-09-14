<?php

namespace Database\Seeders;

use App\Models\Fournisseur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Catalogue des fournisseurs (compagnies, mutuelles, grossistes) avec lesquels
 * le cabinet peut être partenaire ou courtier référencé. Idempotent (par nom).
 */
class FournisseurSeeder extends Seeder
{
    public function run(): void
    {
        $fournisseurs = [
            ['AXA FRANCE [COURTAGE]', 'Compagnie intégrée toutes branches.'],
            ['MMA [COURTAGE]', 'Compagnie mutualiste — dommages et santé.'],
            ['ALLIANZ [COURTAGE]', 'Compagnie d\'assurance tous risques.'],
            ['GENERALI [COURTAGE]', 'Compagnie spécialisée — biens et responsabilité.'],
            ['APRIL COURTAGE', 'Courtier grossiste — référentiel produits varié.'],
        ];

        foreach ($fournisseurs as [$nom, $information]) {
            Fournisseur::firstOrCreate(
                ['nom' => $nom],
                ['id' => (string) Str::uuid(), 'nom' => $nom, 'information' => $information, 'actif' => true]
            );
        }
    }
}