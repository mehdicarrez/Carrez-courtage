<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PorteurRisque extends Model
{
    use SoftDeletes;

    protected $table = 'porteurs_risque';

    protected $fillable = ['nom', 'orias', 'actif'];
    protected $casts = ['actif' => 'boolean'];
}
