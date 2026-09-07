<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\BelongsToOrganisation;

class DemandeTarification extends Model
{
    use SoftDeletes, BelongsToOrganisation;

    protected $table = 'demandes_tarification';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'reference', 'organisation_id', 'branche_id', 'schema_formulaire_version',
        'client_id', 'donnees_risque', 'statut', 'date_statut', 'motif',
        'gestionnaire_id', 'date_soumission', 'date_prise_en_charge', 'date_premier_devis', 'origine',
    ];

    protected $casts = [
        'donnees_risque' => 'array',
        'date_statut' => 'datetime',
        'date_soumission' => 'datetime',
        'date_prise_en_charge' => 'datetime',
        'date_premier_devis' => 'datetime',
    ];

    // Machine à états (RG-14) — transitions autorisées
    public const ETATS = [
        'BROUILLON', 'SOUMISE', 'EN_ETUDE', 'PIECES_MANQUANTES', 'DEVIS_EMIS',
        'ACCEPTEE', 'EN_SOUSCRIPTION', 'TRANSFORMEE',
        'NON_ELIGIBLE', 'SANS_SUITE', 'EXPIREE',
    ];

    public const TRANSITIONS = [
        'BROUILLON' => ['SOUMISE'],
        'SOUMISE' => ['EN_ETUDE'],
        'EN_ETUDE' => ['PIECES_MANQUANTES', 'DEVIS_EMIS', 'NON_ELIGIBLE', 'SANS_SUITE', 'EXPIREE'],
        'PIECES_MANQUANTES' => ['EN_ETUDE'],
        'DEVIS_EMIS' => ['ACCEPTEE', 'NON_ELIGIBLE', 'SANS_SUITE', 'EXPIREE'],
        'ACCEPTEE' => ['EN_SOUSCRIPTION'],
        'EN_SOUSCRIPTION' => ['TRANSFORMEE'],
        'NON_ELIGIBLE' => [],
        'SANS_SUITE' => [],
        'EXPIREE' => [],
        'TRANSFORMEE' => [],
    ];

    public function organisation()
    {
        return $this->belongsTo(Organisation::class);
    }

    public function branche()
    {
        return $this->belongsTo(Branche::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function gestionnaire()
    {
        return $this->belongsTo(User::class, 'gestionnaire_id');
    }

    public function vehicules()
    {
        return $this->hasMany(Vehicule::class, 'demande_id');
    }

    public function devis()
    {
        return $this->hasMany(Devis::class, 'demande_id');
    }

    public function contrats()
    {
        return $this->hasMany(Contrat::class, 'demande_id');
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'objet');
    }

    public function peutTransiterVers(string $nouvelEtat): bool
    {
        return in_array($nouvelEtat, self::TRANSITIONS[$this->statut] ?? [], true);
    }
}
