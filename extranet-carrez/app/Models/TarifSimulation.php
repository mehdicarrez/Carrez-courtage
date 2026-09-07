<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarifSimulation extends Model
{
    protected $table = 'simulation_tarifs';

    protected $fillable = ['produit', 'niveau_garantie', 'prime_base'];

    protected $casts = [
        'prime_base' => 'decimal:2',
    ];
}