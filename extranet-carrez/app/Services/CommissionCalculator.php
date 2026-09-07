<?php

namespace App\Services;

use App\Models\BaremeCommission;
use App\Models\Contrat;
use App\Models\DemandeTarification;
use App\Models\LigneCommission;
use App\Models\Quittance;
use Illuminate\Support\Facades\DB;

/**
 * Module 4 — Calcul des commissions (RG-40..44, CA-40..41).
 *
 * RG-42 : montants stockés en entiers de centimes, arrondi au centime sur la
 * ligne (pas sur le total), règle commerciale.
 */
class CommissionCalculator
{
    public function __construct(private AuditLogger $audit)
    {
    }

    /**
     * RG-40 : barème en vigueur à la date d'effet du contrat, figé et copié.
     */
    public function baremePour(Contrat $contrat): ?BaremeCommission
    {
        return BaremeCommission::where('organisation_id', $contrat->organisation_id)
            ->where(function ($q) use ($contrat) {
                $q->whereNull('produit_id')->orWhere('produit_id', $contrat->produit_id);
            })
            ->where('date_debut', '<=', $contrat->date_effet)
            ->where(function ($q) use ($contrat) {
                $q->whereNull('date_fin')->orWhere('date_fin', '>=', $contrat->date_effet);
            })
            ->orderByDesc('date_debut')
            ->first();
    }

    /**
     * Estimation de rétrocession prévisionnelle, visible du partenaire.
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

        return $this->calculerMontant($bareme, $primeHtCts, null, $bareme->taux_1ere_annee);
    }

    /**
     * F-401 : génération des lignes prévisionnelles à l'émission du contrat.
     */
    public function genererLignesPrevisionnelles(Contrat $contrat): void
    {
        $bareme = $this->baremePour($contrat);

        // Copie figée du barème (RG-40)
        if ($bareme) {
            $contrat->bareme_applique = [
                'id' => $bareme->id,
                'assiette' => $bareme->assiette,
                'taux_1ere_annee' => $bareme->taux_1ere_annee,
                'taux_renouvellement' => $bareme->taux_renouvellement,
                'duree_reprise_mois' => $bareme->duree_reprise_mois,
                'modalite_reprise' => $bareme->modalite_reprise,
            ];
            $contrat->save();
        }

        // Ligne prévisionnelle de rétrocession (visible partenaire) — 1re année
        $taux = $contrat->annee_assurance === 1
            ? ($bareme?->taux_1ere_annee ?? 0)
            : ($bareme?->taux_renouvellement ?? 0);

        $montant = $bareme
            ? $this->calculerMontant($bareme, $contrat->prime_ht_cts, $contrat->prime_ttc_cts, $taux)
            : 0;

        LigneCommission::create([
            'nature' => LigneCommission::NATURE_RETROCEDEE,
            'contrat_id' => $contrat->id,
            'organisation_id' => $contrat->organisation_id,
            'periode_debut' => $contrat->date_effet,
            'periode_fin' => $contrat->date_echeance_principale,
            'annee_assurance' => $contrat->annee_assurance,
            'assiette_cts' => $bareme?->assiette === BaremeCommission::ASSIETTE_COMMISSION_CABINET
                ? $this->assietteCommissionCabinet($contrat->prime_ht_cts)
                : $contrat->prime_ht_cts,
            'mode_calcul' => $bareme?->assiette ?? 'FORFAIT',
            'taux' => $taux,
            'montant_cts' => $montant,
            'statut' => 'PREVISIONNELLE',
            'trace_calcul' => [
                'bareme_id' => $bareme?->id,
                'assiette' => $bareme?->assiette,
                'taux' => $taux,
                'arrondi' => 'centime_ligne',
            ],
        ]);

        $this->audit->log('commission.generee', 'contrat', (string) $contrat->id);
    }

    /**
     * F-402 : bascule en ACQUISE à l'encaissement d'une quittance (RG-33).
     */
    public function basculeAcquise(Quittance $quittance): void
    {
        LigneCommission::where('contrat_id', $quittance->contrat_id)
            ->where('statut', 'PREVISIONNELLE')
            ->update(['statut' => 'ACQUISE']);

        $this->audit->log('quittance.encaissee_acquise', 'quittance', (string) $quittance->id);
    }

    /**
     * F-403 : reprise de commission (résiliation précoce, impayé, sans effet).
     * RG-43 : une ligne bordereautée est immuable ; correction par ligne
     * compensatoire portant référence à la ligne d'origine.
     */
    public function genererReprise(Contrat $contrat, string $motif): void
    {
        $lignes = LigneCommission::where('contrat_id', $contrat->id)
            ->where('nature', LigneCommission::NATURE_RETROCEDEE)
            ->whereIn('statut', ['PREVISIONNELLE', 'ACQUISE'])
            ->get();

        foreach ($lignes as $ligne) {
            LigneCommission::create([
                'nature' => LigneCommission::NATURE_RETROCEDEE,
                'contrat_id' => $contrat->id,
                'quittance_id' => $ligne->quittance_id,
                'organisation_id' => $contrat->organisation_id,
                'periode_debut' => $ligne->periode_debut,
                'periode_fin' => $ligne->periode_fin,
                'annee_assurance' => $ligne->annee_assurance,
                'assiette_cts' => $ligne->assiette_cts,
                'mode_calcul' => $ligne->mode_calcul,
                'taux' => $ligne->taux,
                'montant_cts' => -$ligne->montant_cts,
                'statut' => 'REPRISE',
                'ligne_reprise_de' => $ligne->id,
                'motif' => $motif,
                'trace_calcul' => ['reprise_de' => $ligne->id, 'motif' => $motif],
            ]);

            $ligne->forceFill(['statut' => 'ANNULEE'])->save();
        }

        $this->audit->log('commission.reprise', 'contrat', (string) $contrat->id, null, ['motif' => $motif]);
    }

    /**
     * Calcule le montant d'une ligne selon le mode du barème.
     * RG-42 : arrondi au centime sur la ligne, règle commerciale.
     */
    public function calculerMontant(BaremeCommission $bareme, int $primeHtCts, ?int $primeTtcCts, float $taux): int
    {
        return match ($bareme->assiette) {
            BaremeCommission::ASSIETTE_COMMISSION_CABINET => (int) round(($this->assietteCommissionCabinet($primeHtCts) * $taux) / 100),
            BaremeCommission::ASSIETTE_PRIME_HT => (int) round(($primeHtCts * $taux) / 100),
            default => 0,
        };
    }

    /**
     * Commission perçue par le cabinet = prime HT × taux accord de distribution
     * (défaut 20 %). Étage 1 — RG-03 : jamais visible du partenaire.
     */
    private function assietteCommissionCabinet(int $primeHtCts): int
    {
        return (int) round(($primeHtCts * (config('extranet.taux_commission_cabinet', 20))) / 100);
    }
}
