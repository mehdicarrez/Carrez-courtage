<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Produit extends Model
{
    use SoftDeletes;

    protected $fillable = ['code', 'nom', 'categorie', 'branche_id', 'porteur_risque_id', 'grossiste_id', 'actif'];
    protected $casts = ['actif' => 'boolean'];

    public function branche()
    {
        return $this->belongsTo(Branche::class);
    }

    public function porteurRisque()
    {
        return $this->belongsTo(PorteurRisque::class);
    }

    public function grossiste()
    {
        return $this->belongsTo(Grossiste::class);
    }
}
