<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'type_document_id', 'nom_origine', 'taille', 'mime_reel', 'mime_declare',
        'objet_type', 'objet_id', 'organisation_id', 'cle_stockage', 'version',
        'document_parent_id', 'statut_validation', 'motif_refus', 'valide_par', 'date_validation',
        'sensibilite', 'statut_antivirus', 'date_purge_prevue', 'hash_sha256', 'supprime_logiquement',
    ];

    protected $casts = [
        'taille' => 'integer',
        'version' => 'integer',
        'date_validation' => 'datetime',
        'date_purge_prevue' => 'date',
        'supprime_logiquement' => 'boolean',
    ];

    public const STATUTS_VALIDATION = ['DEPOSE', 'VALIDE', 'REFUSE'];
    public const SENSIBILITE_SENSIBLE = 'SENSIBLE';

    public function type()
    {
        return $this->belongsTo(TypeDocument::class, 'type_document_id');
    }

    public function objet()
    {
        return $this->morphTo();
    }

    public function validePar()
    {
        return $this->belongsTo(User::class, 'valide_par');
    }

    public function versionsPrecedentes()
    {
        return $this->hasMany(self::class, 'document_parent_id');
    }

    public function estSensible(): bool
    {
        return $this->sensibilite === self::SENSIBILITE_SENSIBLE;
    }
}
