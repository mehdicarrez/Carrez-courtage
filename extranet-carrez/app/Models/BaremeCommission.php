<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaremeCommission extends Model
{
    protected $table = 'baremes_commission';

    protected $fillable = [
        'organisation_id', 'produit_id', 'date_debut', 'date_fin', 'assiette',
        'taux_1ere_annee', 'taux_renouvellement', 'part_frais_courtage',
        'plancher_cts', 'plafond_cts', 'duree_reprise_mois', 'modalite_reprise',
        'regime_tva', 'courant',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'taux_1ere_annee' => 'float',
        'taux_renouvellement' => 'float',
        'part_frais_courtage' => 'float',
        'plancher_cts' => 'integer',
        'plafond_cts' => 'integer',
        'courant' => 'boolean',
    ];

    public const ASSIETTE_COMMISSION_CABINET = 'PERCENT_COMMISSION_CABINET';
    public const ASSIETTE_PRIME_HT = 'PERCENT_PRIME_HT';
    public const ASSIETTE_FORFAIT = 'FORFAIT';

    public function organisation()
    {
        return $this->belongsTo(Organisation::class);
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }
}
