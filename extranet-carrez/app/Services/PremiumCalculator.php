<?php

namespace App\Services;

use App\Models\BaremeCommission;
use App\Models\DemandeTarification;

/**
 * Estimation des primes et rétrocessions au stade de la demande de tarification (devis).
 */
class PremiumCalculator
{
    /**
     * Estimation de la rétrocession prévisionnelle pour un partenaire.
     * Utilisé lors de la saisie d'un devis (F-200).
     */
    public function estimerRetrocession(DemandeTarification $demande, int $primeHtCts): ?int
    {
        $bareme = BaremeCommission::where('organisation_id', $demande->organisation_id)
            ->where('courant', true)
            ->orderByDesc('date_debut')
            ->first();

        if (!$bareme || !$bareme->taux_1ere_annee) {
            return null;
        }

        return match ($bareme->assiette) {
            BaremeCommission::ASSIETTE_COMMISSION_CABINET => (int) round(($this->assietteCommissionCabinet($primeHtCts) * $bareme->taux_1ere_annee) / 100),
            BaremeCommission::ASSIETTE_PRIME_HT => (int) round(($primeHtCts * $bareme->taux_1ere_annee) / 100),
            default => 0,
        };
    }

    /**
     * Commission perçue par le cabinet = prime HT × taux accord de distribution.
     */
    private function assietteCommissionCabinet(int $primeHtCts): int
    {
        return (int) round(($primeHtCts * config('extranet.taux_commission_cabinet', 20)) / 100);
    }
}
