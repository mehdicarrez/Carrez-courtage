<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\BelongsToOrganisation;

class Client extends Model
{
    use SoftDeletes, BelongsToOrganisation;

    protected $fillable = [
        'organisation_id', 'type', 'civilite', 'nom', 'prenom', 'date_naissance',
        'raison_sociale', 'siren', 'siret', 'email', 'telephone', 'adresse',
        'code_postal', 'ville', 'complement', 'notes',
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'complement' => 'array',
    ];

    public function getNomCompletAttribute(): string
    {
        if ($this->type === 'MORALE') {
            return $this->raison_sociale;
        }

        return trim($this->prenom.' '.$this->nom);
    }

    public function demandes()
    {
        return $this->hasMany(DemandeTarification::class, 'client_id');
    }

    public function contrats()
    {
        return $this->hasMany(Contrat::class, 'client_id');
    }

    public function quittances()
    {
        return $this->hasManyThrough(Quittance::class, Contrat::class, 'client_id', 'contrat_id');
    }

    public function sinistres()
    {
        return $this->hasManyThrough(Sinistre::class, Contrat::class, 'client_id', 'contrat_id');
    }

    public function taches()
    {
        return $this->hasMany(Tache::class, 'client_id');
    }

    public function factures()
    {
        return $this->hasMany(Facture::class, 'client_id');
    }

    public function reglements()
    {
        return $this->hasMany(Reglement::class, 'client_id');
    }

    public function utilisateurs()
    {
        return $this->belongsToMany(User::class, 'client_user', 'client_id', 'user_id')
            ->withTimestamps();
    }

    public function contratsActifsCount(): int
    {
        return \App\Models\Contrat::where('client_id', $this->id)
            ->where('statut', 'EN_VIGUEUR')
            ->count();
    }

    public function primesTotales(): int
    {
        return (int) \App\Models\Contrat::where('client_id', $this->id)
            ->where('statut', 'EN_VIGUEUR')
            ->sum('prime_ttc_cts');
    }
}
