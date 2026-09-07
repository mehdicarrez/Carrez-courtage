<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Email extends Model
{
    protected $table = 'e_mails';

    protected $fillable = [
        'sens', 'organisation_id', 'objet_type', 'objet_id', 'expediteur',
        'destinataires', 'sujet', 'corps', 'adresse_dossier', 'statut_rattachement',
        'statut_delivrabilite', 'visible_partenaire', 'pieces_jointes_ids',
    ];

    protected $casts = [
        'destinataires' => 'array',
        'pieces_jointes_ids' => 'array',
        'visible_partenaire' => 'boolean',
    ];
}
