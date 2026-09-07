<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FactureLigne extends Model
{
    protected $fillable = [
        'facture_id', 'type', 'designation', 'quantite', 'prix_unitaire_ht_cts',
        'taxe', 'total_ht_cts', 'total_taxes_cts', 'total_ttc_cts',
    ];

    protected $casts = [
        'quantite' => 'float',
        'prix_unitaire_ht_cts' => 'integer',
        'taxe' => 'float',
        'total_ht_cts' => 'integer',
        'total_taxes_cts' => 'integer',
        'total_ttc_cts' => 'integer',
    ];

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }
}
