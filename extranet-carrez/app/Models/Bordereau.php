<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToOrganisation;

class Bordereau extends Model
{
    use BelongsToOrganisation;

    protected $table = 'bordereaux';

    protected $fillable = [
        'organisation_id', 'reference', 'periode_debut', 'periode_fin', 'statut',
        'report_anterieur_cts', 'total_brut_cts', 'total_reprises_cts', 'net_a_payer_cts', 'commentaire_comptable',
    ];

    protected $casts = [
        'periode_debut' => 'date',
        'periode_fin' => 'date',
        'report_anterieur_cts' => 'integer',
        'total_brut_cts' => 'integer',
        'total_reprises_cts' => 'integer',
        'net_a_payer_cts' => 'integer',
    ];

    public const STATUTS = ['GENERATION', 'A_VERIFIER', 'VALIDE', 'PUBLIE', 'PAYE'];

    public function organisation()
    {
        return $this->belongsTo(Organisation::class);
    }

    public function lignes()
    {
        return $this->hasMany(LigneCommission::class);
    }

    public function paiements()
    {
        return $this->hasMany(PaiementDeclare::class);
    }

    public function estImmuable(): bool
    {
        return in_array($this->statut, ['VALIDE', 'PUBLIE', 'PAYE'], true); // RG-42
    }
}
