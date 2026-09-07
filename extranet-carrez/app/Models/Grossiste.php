<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Grossiste extends Model
{
    use SoftDeletes;

    protected $fillable = ['nom', 'orias', 'contact', 'actif'];
    protected $casts = ['contact' => 'array', 'actif' => 'boolean'];
}
