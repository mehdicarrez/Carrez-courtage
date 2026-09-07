<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tache extends Model
{
    protected $fillable = [
        'client_id', 'assignee_id', 'cree_par_id', 'reference', 'titre', 'type',
        'objet', 'description', 'priorite', 'statut', 'date_echeance',
        'date_debut', 'date_fin', 'montant', 'avancement', 'temps_passe_h', 'terminee_le',
    ];

    protected $casts = [
        'date_echeance' => 'date',
        'date_debut' => 'date',
        'date_fin' => 'date',
        'montant' => 'decimal:2',
        'avancement' => 'integer',
        'temps_passe_h' => 'decimal:2',
        'terminee_le' => 'datetime',
    ];

    public const PRIORITES = ['FAIBLE', 'BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'];
    public const STATUTS = ['A_FAIRE', 'EN_COURS', 'TERMINEE'];
    public const TYPES = ['SINISTRE'];
    public const OBJETS = [
        'Ouvrir sinistre',
        'Suivi sinistre',
        'Clôturer sinistre',
        'Expertise',
        'Relance',
        'Autre',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function creePar()
    {
        return $this->belongsTo(User::class, 'cree_par_id');
    }
}
