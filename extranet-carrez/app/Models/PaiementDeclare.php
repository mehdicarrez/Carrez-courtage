<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaiementDeclare extends Model
{
    protected $table = 'paiements_declares';

    protected $fillable = ['bordereau_id', 'date_paiement', 'montant_cts', 'reference', 'commentaire'];

    protected $casts = ['date_paiement' => 'date', 'montant_cts' => 'integer'];

    public function bordereau()
    {
        return $this->belongsTo(Bordereau::class);
    }
}
