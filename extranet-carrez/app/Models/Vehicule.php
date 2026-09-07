<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicule extends Model
{
    protected $fillable = [
        'demande_id', 'immatriculation', 'marque', 'modele',
        'date_premiere_mise_circulation', 'usage', 'ptac_kg', 'donnees', 'ligne_import',
    ];

    protected $casts = [
        'date_premiere_mise_circulation' => 'date',
        'donnees' => 'array',
    ];

    public function demande()
    {
        return $this->belongsTo(DemandeTarification::class, 'demande_id');
    }
}
