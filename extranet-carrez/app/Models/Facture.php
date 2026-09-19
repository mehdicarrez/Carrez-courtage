<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    protected $fillable = [
        'organisation_id', 'client_id', 'reference', 'souscripteur', 'adresse',
        'code_postal', 'ville', 'contact_commercial', 'date_facture', 'date_echeance',
        'moyens_reglement', 'montant_ht_cts', 'montant_taxes_cts', 'montant_ttc_cts',
        'statut', 'date_encaissee',
    ];

    protected $casts = [
        'date_facture' => 'date',
        'date_echeance' => 'date',
        'date_encaissee' => 'date',
        'moyens_reglement' => 'array',
        'montant_ht_cts' => 'integer',
        'montant_taxes_cts' => 'integer',
        'montant_ttc_cts' => 'integer',
    ];

    public const STATUTS = ['BROUILLON', 'EMISE', 'PAYEE', 'IMPAYEE', 'ANNULEE'];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function lignes()
    {
        return $this->hasMany(FactureLigne::class);
    }

    public function reglements()
    {
        return $this->hasMany(Reglement::class);
    }

    public function recalculeTotaux(): void
    {
        $ht = 0;
        $taxes = 0;
        foreach ($this->lignes as $ligne) {
            $ht += $ligne->total_ht_cts;
            $taxes += $ligne->total_taxes_cts;
        }
        $this->montant_ht_cts = $ht;
        $this->montant_taxes_cts = $taxes;
        $this->montant_ttc_cts = $ht + $taxes;
    }
}
