<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * RG-16 : génération de références lisibles et non devinables dans leur
 * partie séquentielle (DT-AAAA-NNNNNN, BL-YYYYMM-xxx...).
 */
class ReferenceService
{
    public function demande(): string
    {
        return $this->generer('DT', date('Y'));
    }

    public function bordereau(): string
    {
        return $this->generer('BR', date('Y'));
    }

    public function contrat(): string
    {
        return $this->generer('CT', date('Y'));
    }

    public function facture(): string
    {
        return $this->generer('FAC', date('Y'));
    }

    public function sinistre(): string
    {
        return $this->generer('SIN', date('Y'));
    }

    public function tache(): string
    {
        return $this->generer('TR', date('Y'));
    }

    private function generer(string $prefixe, string $annee): string
    {
        return DB::transaction(function () use ($prefixe, $annee) {
            $lockKey = "seq_{$prefixe}_{$annee}";
            $sequence = DB::table('sequences')
                ->where('cle', $lockKey)
                ->lockForUpdate()
                ->first();

            $numero = $sequence ? $sequence->valeur + 1 : 1;

            DB::table('sequences')->updateOrInsert(
                ['cle' => $lockKey],
                ['valeur' => $numero, 'updated_at' => now()]
            );

            return sprintf('%s-%s-%06d', $prefixe, $annee, $numero);
        });
    }
}
