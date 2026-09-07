<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ConventionPartenariat extends Model
{
    use SoftDeletes;

    protected $table = 'conventions_partenariat';

    protected $fillable = [
        'organisation_id', 'statut', 'date_debut', 'date_fin',
        'propriete_portefeuille', 'modalites', 'document_id',
    ];

    protected $casts = ['modalites' => 'array', 'date_debut' => 'date', 'date_fin' => 'date'];

    public function organisation()
    {
        return $this->belongsTo(Organisation::class);
    }
}
