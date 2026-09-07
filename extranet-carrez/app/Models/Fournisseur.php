<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fournisseur extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'nom', 'service', 'logo', 'information', 'actif', 'devenir_partenaire',
        'partenaire', 'telephone', 'email', 'contrats', 'montant_primes', 'dernier_contrat', 'documents',
        'type_assurance', 'url_assurance',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'devenir_partenaire' => 'boolean',
        'montant_primes' => 'decimal:2',
        'dernier_contrat' => 'datetime',
        'documents' => 'array',
    ];
}