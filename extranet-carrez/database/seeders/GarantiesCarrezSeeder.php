<?php

namespace Database\Seeders;

use App\Models\Branche;
use App\Models\Garantie;
use Illuminate\Database\Seeder;

/**
 * Catalogue des garanties de souscription (RG-21) — exemples demandés :
 * Vol, Incendie, Aléas climatiques, Dommages tous accidents,
 * Bris de glace, Responsabilité civile, Assistance, etc.
 *
 * Idempotent par code ; rattaché à la branche concernée (RG-21 branche_id).
 */
class GarantiesCarrezSeeder extends Seeder
{
    public function run(): void
    {
        $catalogue = [
            'AUTO' => [
                ['VOL', 'Vol'],
                ['INCENDIE', 'Incendie'],
                ['ALEAS_CLIMATIQUES', 'Aléas climatiques'],
                ['DOMMAGES_TOUS_ACCIDENTS', 'Dommages tous accidents'],
                ['BRIS_DE_GLACE', 'Bris de glace'],
                ['RESPONSABILITE_CIVILE', 'Responsabilité civile'],
                ['ASSISTANCE', 'Assistance'],
                ['DEFENSE_RECOURS', 'Défense recours'],
                ['PERSONNES_TRANSPORTEES', 'Dommages aux personnes transportées'],
            ],
            'HABITATION' => [
                ['VOL_HAB', 'Vol'],
                ['INCENDIE_HAB', 'Incendie'],
                ['DEGATS_EAU', 'Dégâts des eaux'],
                ['BRIS_GLACE_HAB', 'Bris de glace'],
                ['CATASTROPHES_NATURELLES', 'Catastrophes naturelles'],
                ['RESPONSABILITE_CIVILE_HAB', 'Responsabilité civile'],
                ['JARDIN_OBJETS', 'Jardin et objets'],
                ['ALEAS_CLIMATIQUES_HAB', 'Aléas climatiques'],
            ],
            'SANTE' => [
                ['HOSPITALISATION', 'Hospitalisation'],
                ['CONSULTATIONS', 'Consultations et soins courants'],
                ['PHARMACIE', 'Pharmacie'],
                ['OPTIQUE', 'Optique'],
                ['DENTAIRE', 'Dentaire'],
                ['MISE_A_NIVEAU', 'Indemnités de mise à niveau'],
                ['PREVENTION', 'Prévention'],
            ],
            'PREVOYANCE' => [
                ['DECES', 'Décès'],
                ['ITT', 'Incapacité temporaire de travail'],
                ['PTIA', 'Invalidité permanente totale'],
                ['DEPENDANCE', 'Dépendance'],
            ],
            'PRO-PRO' => [
                ['RC_PRO', 'Responsabilité civile professionnelle'],
                ['BIENS_PRO', 'Biens professionnels'],
                ['PERTE_EXPLOITATION', 'Perte d\'exploitation'],
                ['FRAIS_SUPPL_GESTION', 'Frais supplémentaires d\'exploitation'],
            ],
        ];

        foreach ($catalogue as $codeBranche => $items) {
            $branche = Branche::where('code', $codeBranche)->first();
            foreach ($items as [$code, $intitule]) {
                Garantie::updateOrCreate(
                    ['code' => $code],
                    [
                        'branche_id' => $branche?->id,
                        'intitule' => $intitule,
                        'famille' => $codeBranche,
                        'actif' => true,
                    ]
                );
            }
        }
    }
}
