<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contestation extends Model
{
    protected $fillable = ['ligne_commission_id', 'auteur_id', 'message', 'statut'];

    public function ligne()
    {
        return $this->belongsTo(LigneCommission::class, 'ligne_commission_id');
    }

    public function auteur()
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }
}
