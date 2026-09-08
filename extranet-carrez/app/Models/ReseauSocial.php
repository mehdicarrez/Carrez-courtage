<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReseauSocial extends Model
{
    protected $table = 'reseaux_sociaux';

    protected $fillable = ['user_id', 'nom', 'lien', 'descriptif', 'logo'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}