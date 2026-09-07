<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LigneCommission extends Model
{
    protected $table = 'lignes_commission';

    protected $fillable = [
        'nature', 'contrat_id', 'quittance_id', 'avenant_id', 'organisation_id',
        'periode_debut', 'periode_fin', 'annee_assurance', 'assiette_cts', 'mode_calcul',
        'taux', 'montant_cts', 'statut', 'bordereau_id', 'ligne_reprise_de', 'motif', 'trace_calcul',
    ];

    protected $casts = [
        'periode_debut' => 'date',
        'periode_fin' => 'date',
        'annee_assurance' => 'integer',
        'assiette_cts' => 'integer',
        'montant_cts' => 'integer',
        'taux' => 'float',
        'trace_calcul' => 'array',
    ];

    public const NATURE_PERQUE = 'PERCUE';
    public const NATURE_RETROCEDEE = 'RETROCEDEE';

    // Machine à états (8.2)
    public const STATUTS = ['PREVISIONNELLE', 'ACQUISE', 'BORDEREE', 'PAYEE', 'ANNULEE', 'REPRISE'];

    public const TRANSITIONS = [
        'PREVISIONNELLE' => ['ACQUISE', 'ANNULEE'],
        'ACQUISE' => ['BORDEREE', 'ANNULEE'],
        'BORDEREE' => ['PAYEE'],
        'PAYEE' => [],
        'ANNULEE' => ['BORDEREE'],
        'REPRISE' => ['BORDEREE'],
    ];

    public function contrat()
    {
        return $this->belongsTo(Contrat::class);
    }

    public function quittance()
    {
        return $this->belongsTo(Quittance::class);
    }

    public function bordereau()
    {
        return $this->belongsTo(Bordereau::class);
    }

    public function ligneRepriseDe()
    {
        return $this->belongsTo(self::class, 'ligne_reprise_de');
    }

    public function organisation()
    {
        return $this->belongsTo(Organisation::class);
    }

    public function scopeRetrocedees($query)
    {
        return $query->where('nature', self::NATURE_RETROCEDEE);
    }

    public function scopePerques($query)
    {
        return $query->where('nature', self::NATURE_PERQUE);
    }
}
