<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemandeInscriptionPartenaire extends Model
{
    public const STATUT_EN_ATTENTE = 'EN_ATTENTE';
    public const STATUT_VALIDEE = 'VALIDEE';
    public const STATUT_REFUSEE = 'REFUSEE';

    protected $table = 'demandes_inscriptions_partenaires';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'nom', 'email', 'telephone', 'mot_de_passe',
        'statut', 'motif_refus', 'traite_par', 'traite_le',
    ];

    protected $casts = [
        'traite_le' => 'datetime',
    ];

    public function traitePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traite_par');
    }
}