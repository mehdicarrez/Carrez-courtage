<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branche extends Model
{
    use SoftDeletes;

    protected $fillable = ['code', 'nom', 'famille', 'actif'];
    protected $casts = ['actif' => 'boolean'];

    public function schemas()
    {
        return $this->hasMany(SchemaFormulaire::class);
    }

    public function schemaCourant()
    {
        return $this->hasOne(SchemaFormulaire::class)->where('courant', true);
    }

    public function produits()
    {
        return $this->hasMany(Produit::class);
    }
}
