<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Devis extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'demande_id', 'user_id', 'version_label', 'version', 'porteur_risque_id', 'grossiste_id', 'produit_id',
        'reference_amont', 'prime_ht_cts', 'taxes_cts', 'prime_ttc_cts', 'frais_courtage_cts',
        'fractionnement', 'premiere_echeance_cts', 'date_effet_possible', 'date_validite',
        'date_envoye',
        'conditions_particulieres', 'reserves', 'taux_commission_percue', 'montant_retrocession_cts',
        'statut', 'motif', 'devis_parent_id',
    ];

    protected $casts = [
        'date_effet_possible' => 'date',
        'date_validite' => 'date',
        'date_envoye' => 'datetime',
        'prime_ht_cts' => 'integer',
        'taxes_cts' => 'integer',
        'prime_ttc_cts' => 'integer',
        'frais_courtage_cts' => 'integer',
        'montant_retrocession_cts' => 'integer',
        'taux_commission_percue' => 'float',
    ];

    public const ETATS = ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE', 'TRANSFORME', 'DEVIS_SIGNE'];

    public const TRANSITIONS = [
        'BROUILLON' => ['ENVOYE'],
        'ENVOYE' => ['ACCEPTE', 'REFUSE', 'EXPIRE'],
        'ACCEPTE' => ['TRANSFORME', 'DEVIS_SIGNE'],
        'REFUSE' => [],
        'EXPIRE' => ['ENVOYE'], // prolongation (RG-21)
        'TRANSFORME' => [],
        'DEVIS_SIGNE' => [],
    ];

    public function demande()
    {
        return $this->belongsTo(DemandeTarification::class, 'demande_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function proposant()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }

    public function garanties()
    {
        return $this->morphMany(LigneGarantie::class, 'garantissable');
    }

    public function garantiesCatalogue()
    {
        return $this->belongsToMany(Garantie::class, 'devis_garanties')->withPivot('incluse')->withTimestamps();
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'objet');
    }

    public function contrat()
    {
        return $this->hasOne(Contrat::class);
    }

    public function peutTransiterVers(string $nouvelEtat): bool
    {
        return in_array($nouvelEtat, self::TRANSITIONS[$this->statut] ?? [], true);
    }

    public function estExpire(): bool
    {
        return $this->date_validite && $this->date_validite->isPast();
    }
}
