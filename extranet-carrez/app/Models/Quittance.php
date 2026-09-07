<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quittance extends Model
{
    protected $fillable = [
        'contrat_id', 'numero', 'echeance', 'date_appel', 'date_echeance', 'montant_cts', 'statut', 'date_encaissee',
    ];

    protected $casts = [
        'date_appel' => 'date',
        'date_echeance' => 'date',
        'date_encaissee' => 'date',
        'montant_cts' => 'integer',
    ];

    public const STATUTS = ['A_ECHELONNER', 'APPELEE', 'ENCAISSEE', 'IMPAYEE', 'ANNULEE'];

    public function contrat()
    {
        return $this->belongsTo(Contrat::class);
    }

    public function lignesCommission()
    {
        return $this->hasMany(LigneCommission::class);
    }
}
