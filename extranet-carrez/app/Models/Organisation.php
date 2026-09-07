<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organisation extends Model
{
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'type', 'raison_sociale', 'forme_juridique', 'siren', 'siret',
        'adresse', 'ville', 'code_postal', 'pays', 'numero_orias', 'categories_orias',
        'statut', 'date_activation', 'date_suspension', 'motif_suspension', 'parametres', 'admin_id',
        'checklist_validation', 'branches_autorisees', 'decision', 'motif_decision', 'date_decision', 'decide_par',
    ];

    protected $casts = [
        'categories_orias' => 'array',
        'parametres' => 'array',
        'checklist_validation' => 'array',
        'branches_autorisees' => 'array',
        'date_activation' => 'date',
        'date_suspension' => 'date',
        'date_decision' => 'datetime',
    ];

    public const TYPE_CABINET = 'CABINET';
    public const TYPE_PARTENAIRE = 'PARTENAIRE';

    public function utilisateurs()
    {
        return $this->hasMany(User::class);
    }

    public function convention()
    {
        return $this->hasOne(ConventionPartenariat::class);
    }

    public function baremes()
    {
        return $this->hasMany(BaremeCommission::class);
    }

    public function pieces()
    {
        return $this->hasMany(PieceOrganisation::class);
    }

    public function demandes()
    {
        return $this->hasMany(DemandeTarification::class);
    }

    public function estPartenaire(): bool
    {
        return $this->type === self::TYPE_PARTENAIRE;
    }

    public function estActif(): bool
    {
        return $this->statut === 'ACTIVE';
    }
}
