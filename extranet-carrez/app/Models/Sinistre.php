<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sinistre extends Model
{
    protected $fillable = [
        'contrat_id', 'numero', 'ref_compagnie', 'compagnie', 'type_contrat', 'garantie',
        'date_survenance', 'date_declaration', 'nature', 'statut', 'etat',
        'suivi_par_id', 'franchise', 'circonstance', 'description_dommages', 'responsabilite',
        'beneficiaire', 'expertise', 'recours', 'cloture_le',
        'montant_estime_cts', 'montant_regle_cts', 'gestionnaire_porteur', 'declare_par',
    ];

    protected $casts = [
        'date_survenance' => 'date',
        'date_declaration' => 'date',
        'cloture_le' => 'date',
        'montant_estime_cts' => 'integer',
        'montant_regle_cts' => 'integer',
    ];

    public function contrat()
    {
        return $this->belongsTo(Contrat::class);
    }

    public function suiviPar()
    {
        return $this->belongsTo(User::class, 'suivi_par_id');
    }
}
