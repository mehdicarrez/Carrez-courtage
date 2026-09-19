<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reglement extends Model
{
    protected $fillable = [
        'organisation_id', 'client_id', 'facture_id', 'reference', 'mode_reglement',
        'montant_cts', 'details', 'mentions', 'date_reglement', 'statut',
    ];

    protected $casts = [
        'date_reglement' => 'date',
        'montant_cts' => 'integer',
    ];

    public const STATUTS = ['ENCAISSE', 'EN_ATTENTE', 'REJETE'];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }
}
