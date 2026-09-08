<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Messagerie extends Model
{
    protected $fillable = ['user_id', 'nom', 'lien', 'descriptif', 'logo'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}