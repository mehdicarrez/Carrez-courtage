<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Catalogue de garanties de souscription (référentiel RG-21).
 * Ex : Vol, Incendie, Aléas climatiques, Dommages tous accidents,
 * Bris de glace, Responsabilité civile, Assistance…
 *
 * Le partenaire sélectionne, lors de la saisie d'un devis, en cases à
 * cocher autant de garanties qu'il propose — « souscription garanties
 * incluses » (RG-21). La sélection est stockée proprement dans le
 * référentiel `garanties` puis reliée au devis via `devis_garanties`.
 */
class Garantie extends Model
{
    protected $fillable = ['branche_id', 'code', 'intitule', 'famille', 'actif'];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function branche()
    {
        return $this->belongsTo(Branche::class);
    }

    public function devis()
    {
        return $this->belongsToMany(Devis::class, 'devis_garanties')->withPivot('incluse')->withTimestamps();
    }
}
}
