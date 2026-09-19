<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganisation;
use Illuminate\Database\Eloquent\Model;

class BibliothequeDocument extends Model
{
    use BelongsToOrganisation;

    protected $table = 'bibliotheque_documents';

    public const CATEGORIES = [
        'Administration',
        'Contract',
        'Legaux',
        'Finaux',
        'Nouvelle tech',
        'Plan affaire',
        'Production',
        'Ressource',
        'Vente',
    ];

    protected $fillable = [
        'organisation_id', 'categorie', 'titre', 'nom_origine', 'taille', 'mime', 'cle_stockage',
    ];

    protected $casts = [
        'taille' => 'integer',
    ];
}
