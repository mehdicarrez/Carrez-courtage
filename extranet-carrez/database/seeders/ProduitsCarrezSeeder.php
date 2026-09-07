<?php

namespace Database\Seeders;

use App\Models\Branche;
use App\Models\Produit;
use Illuminate\Database\Seeder;

/**
 * Alimente le référentiel des produits Carrez (liste commerciale) et les rattache
 * à une branche existante (détermine le schéma de risque affiché). Idempotent (par code).
 */
class ProduitsCarrezSeeder extends Seeder
{
    public function run(): void
    {
        // code_branche => code du produit => [nom, catégorie]
        $produits = [
            'AUTO' => [
                ['2ROUES', '2/3 ROUES / QUAD / NVEI', 'Assurances de dommages'],
                ['AUTO', 'AUTO', 'Assurances de dommages'],
                ['AUTO-PRO', 'AUTO DU PRO', 'Assurances de dommages'],
            ],
            'FLOTTE' => [
                ['FLOTTE-AUTO', 'FLOTTE AUTOMOBILE (4 VÉHICULES ET PLUS)', 'Assurances de dommages'],
                ['RC-TRANSPORT', 'RC TRANSPORT ET DÉMÉNAGEMENT', 'Services aux entreprises'],
            ],
            'PRO-PRO' => [
                ['GARAGISTE', 'GARAGISTE ET PRO DE L\'AUTOMOBILE', 'Assurances de dommages'],
                ['DOMMAGE-OUVRAGE', 'DOMMAGE OUVRAGE', 'Travaux'],
                ['MR-PRO', 'MULTIRISQUE PROFESSIONNEL', 'Assurances de dommages'],
                ['PERTE-EXPLOITATION', 'PERTE D\'EXPLOITATION', 'Services aux entreprises'],
                ['PROTECTION-JURIDIQUE', 'PROTECTION JURIDIQUE PRO', 'Services aux entreprises'],
                ['RC-DECENNALE', 'RESPONSABILITÉ CIVILE ET DÉCENNALE', 'Travaux'],
                ['RC-PRO', 'RESPONSABILITÉ CIVILE PROFESSIONNELLE', 'Services aux entreprises'],
            ],
            'HABITATION' => [
                ['HOME-LOISIRS', 'HOME ET RÉSIDENCE DE LOISIRS', 'Assurances de dommages'],
                ['MR-HABITATION', 'MULTIRISQUE HABITATION', 'Assurances de dommages'],
                ['MR-IMMEUBLE', 'MULTIRISQUE IMMEUBLE', 'Immobilier'],
                ['MR-AGRICOLE', 'MULTIRISQUE AGRICOLE ET GRÊLE', 'Assurances de dommages'],
            ],
        ];

        $branchesParCode = Branche::pluck('id', 'code');

        foreach ($produits as $codeBranche => $liste) {
            $brancheId = $branchesParCode[$codeBranche] ?? null;
            if (!$brancheId) {
                continue;
            }
            foreach ($liste as [$code, $nom, $categorie]) {
                Produit::updateOrCreate(
                    ['code' => $code],
                    ['nom' => $nom, 'categorie' => $categorie, 'branche_id' => $brancheId, 'actif' => true]
                );
            }
        }
    }
}
