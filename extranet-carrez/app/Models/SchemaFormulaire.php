<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchemaFormulaire extends Model
{
    protected $table = 'schemas_formulaires';

    protected $fillable = ['branche_id', 'version', 'schema', 'pieces_attendues', 'courant', 'auteur_id'];
    protected $casts = [
        'schema' => 'array',
        'pieces_attendues' => 'array',
        'courant' => 'boolean',
        'version' => 'integer',
    ];

    public function branche()
    {
        return $this->belongsTo(Branche::class);
    }
}
