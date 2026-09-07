<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeDocument extends Model
{
    protected $table = 'types_documents';

    protected $fillable = ['code', 'libelle', 'sensible', 'retenue_mois'];
    protected $casts = ['sensible' => 'boolean'];
}
