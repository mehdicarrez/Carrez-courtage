<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ModeleDocument extends Model
{
    use SoftDeletes;

    protected $table = 'modeles_documents';

    protected $fillable = ['nom', 'type', 'version', 'moteur', 'chemin_vue', 'variables', 'statut', 'par_defaut'];
    protected $casts = [
        'variables' => 'array',
        'par_defaut' => 'boolean',
    ];

    public const TYPES = ['POLICE', 'PROPOSITION', 'ATTESTATION'];

    protected static function booted()
    {
        static::saving(function ($modele) {
            if ($modele->par_defaut) {
                static::where('type', $modele->type)
                    ->where('id', '!=', $modele->id)
                    ->update(['par_defaut' => false]);
            }
        });
    }
}
