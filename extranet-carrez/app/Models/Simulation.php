<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Simulation extends Model
{
    protected $fillable = ['user_id', 'client_id', 'produit', 'criteres', 'estimation', 'client_data'];

    protected $casts = [
        'criteres' => 'array',
        'estimation' => 'array',
        'client_data' => 'array',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function auteur()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}