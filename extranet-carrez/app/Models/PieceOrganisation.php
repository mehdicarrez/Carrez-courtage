<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PieceOrganisation extends Model
{
    protected $table = 'pieces_organisation';

    protected $fillable = [
        'organisation_id', 'type_document_id', 'document_id', 'date_validite',
        'statut_controle', 'commentaire_controle', 'controle_par', 'date_controle',
    ];

    protected $casts = [
        'date_validite' => 'date',
        'date_controle' => 'datetime',
    ];

    public function organisation()
    {
        return $this->belongsTo(Organisation::class);
    }

    public function typeDocument()
    {
        return $this->belongsTo(TypeDocument::class, 'type_document_id');
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function estExpiree(): bool
    {
        return $this->date_validite && $this->date_validite->isPast();
    }
}
