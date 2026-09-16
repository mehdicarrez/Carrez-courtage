<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\BelongsToOrganisation;

class Contrat extends Model
{
    use SoftDeletes, BelongsToOrganisation;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'reference', 'numero_police', 'devis_id', 'demande_id', 'organisation_id',
        'client_id', 'porteur_risque_id', 'grossiste_id', 'produit_id',
        'date_effet', 'date_echeance_principale', 'date_fin',
        'prime_ht_cts', 'taxes_cts', 'prime_ttc_cts', 'frais_courtage_cts',
        'fractionnement', 'statut', 'motif_resiliation', 'date_resiliation',
        'annee_assurance', 'bareme_applique', 'signature', 'souscription_checklist',
        'derniere_relance',
    ];

    protected $casts = [
        'date_effet' => 'date',
        'date_echeance_principale' => 'date',
        'date_fin' => 'date',
        'date_resiliation' => 'date',
        'prime_ht_cts' => 'integer',
        'taxes_cts' => 'integer',
        'prime_ttc_cts' => 'integer',
        'frais_courtage_cts' => 'integer',
        'annee_assurance' => 'integer',
        'bareme_applique' => 'array',
        'signature' => 'array',
        'souscription_checklist' => 'array',
        'derniere_relance' => 'datetime',
    ];

    // Étapes standard de la checklist de souscription (ordre de déroulement)
    public const ETAPES_SOUSCRIPTION = [
        'pieces_completes' => 'Pièces complètes',
        'devis_accepte' => 'Devis accepté',
        'garanties_validees' => 'Garanties validées',
        'police_generee' => 'Police générée',
        'envoye_signature' => 'Envoyé en signature',
        'signe' => 'Signé',
        'mise_en_vigueur' => 'Mis en vigueur',
    ];

    public const SOUSCRIPTION_ACTIVE = [
        'EN_CONSTITUTION', 'EN_ATTENTE_SIGNATURE', 'SIGNE', 'EN_ATTENTE_EMISSION',
    ];

    // Machine à états (7.2)
    public const ETATS = [
        'EN_CONSTITUTION', 'EN_ATTENTE_SIGNATURE', 'SIGNE', 'EN_ATTENTE_EMISSION',
        'EN_VIGUEUR', 'IMPAYE', 'SUSPENDU', 'RESILIE', 'SANS_EFFET', 'EXPIRE',
        'REGLE', 'NON_REGLE',
    ];

    public const TRANSITIONS = [
        'EN_CONSTITUTION' => ['EN_ATTENTE_SIGNATURE'],
        'EN_ATTENTE_SIGNATURE' => ['SIGNE', 'REGLE', 'NON_REGLE'],
        'SIGNE' => ['EN_ATTENTE_EMISSION', 'SANS_EFFET'],
        'EN_ATTENTE_EMISSION' => ['EN_VIGUEUR', 'SANS_EFFET'],
        'EN_VIGUEUR' => ['IMPAYE', 'SUSPENDU', 'RESILIE', 'SANS_EFFET', 'EXPIRE'],
        'IMPAYE' => ['EN_VIGUEUR', 'RESILIE'],
        'SUSPENDU' => ['EN_VIGUEUR', 'RESILIE'],
        'RESILIE' => [],
        'SANS_EFFET' => [],
        'EXPIRE' => [],
        'REGLE' => ['NON_REGLE'],
        'NON_REGLE' => ['REGLE'],
    ];

    public const MOTIFS_RESILIATION = [
        'ECHEANCE_ASSURE', 'ECHEANCE_ASSUREUR', 'LOI_HAMON', 'NON_PAIEMENT',
        'VENTE_DU_BIEN', 'CHANGEMENT_SITUATION', 'AGGRAVATION_RISQUE',
        'SINISTRE', 'DECES', 'RETRACTATION', 'AUTRE',
    ];

    public function organisation()
    {
        return $this->belongsTo(Organisation::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function demande()
    {
        return $this->belongsTo(DemandeTarification::class, 'demande_id');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }

    public function grossiste()
    {
        return $this->belongsTo(Grossiste::class);
    }

    public function porteurRisque()
    {
        return $this->belongsTo(PorteurRisque::class, 'porteur_risque_id');
    }

    public function avenants()
    {
        return $this->hasMany(Avenant::class);
    }

    public function quittances()
    {
        return $this->hasMany(Quittance::class);
    }

    public function sinistres()
    {
        return $this->hasMany(Sinistre::class);
    }

    public function garanties()
    {
        return $this->morphMany(LigneGarantie::class, 'garantissable');
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'objet');
    }

    public function lignesCommission()
    {
        return $this->hasMany(LigneCommission::class);
    }

    public function peutTransiterVers(string $nouvelEtat): bool
    {
        return in_array($nouvelEtat, self::TRANSITIONS[$this->statut] ?? [], true);
    }

    public function estEnSouscription(): bool
    {
        return in_array($this->statut, self::SOUSCRIPTION_ACTIVE, true);
    }

    public function getFournisseurAttribute(): ?string
    {
        return $this->grossiste?->nom ?? $this->porteurRisque?->nom;
    }

    public function souscriptionProgression(): int
    {
        $checklist = $this->souscription_checklist ?? [];
        $coches = count(array_filter($checklist, fn ($coche) => !empty($coche)));
        $total = count(self::ETAPES_SOUSCRIPTION);

        return $total > 0 ? (int) round(($coches / $total) * 100) : 0;
    }

    public function estEtapeCochee(string $etape): bool
    {
        return !empty(($this->souscription_checklist ?? [])[$etape]);
    }

    public function cocherEtape(string $etape, bool $coche = true): void
    {
        if (!array_key_exists($etape, self::ETAPES_SOUSCRIPTION)) {
            return;
        }

        $checklist = $this->souscription_checklist ?? [];
        $checklist[$etape] = $coche;
        $this->souscription_checklist = $checklist;
    }
}
