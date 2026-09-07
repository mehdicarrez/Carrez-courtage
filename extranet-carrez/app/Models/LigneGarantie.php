<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LigneGarantie extends Model
{
    protected $table = 'lignes_garantie';

    protected $fillable = [
        'garantissable_type', 'garantissable_id', 'intitule', 'plafond_cts',
        'franchise_cts', 'incluse', 'optionnelle', 'prix_option_cts',
    ];

    protected $casts = [
        'plafond_cts' => 'integer',
        'franchise_cts' => 'integer',
        'prix_option_cts' => 'integer',
        'incluse' => 'boolean',
        'optionnelle' => 'boolean',
    ];

    public function garantissable()
    {
        return $this->morphTo();
    }
}
