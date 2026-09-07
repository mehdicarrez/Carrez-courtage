<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Avenant extends Model
{
    protected $fillable = [
        'contrat_id', 'type', 'date_effet', 'variation_prime_cts', 'description', 'statut',
    ];

    protected $casts = [
        'date_effet' => 'date',
        'variation_prime_cts' => 'integer',
    ];

    public function contrat()
    {
        return $this->belongsTo(Contrat::class);
    }
}
