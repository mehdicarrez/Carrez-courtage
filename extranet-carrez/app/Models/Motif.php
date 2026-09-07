<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Motif extends Model
{
    protected $fillable = ['categorie', 'code', 'libelle'];
}
