<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * RG-01 / RG-74 : Cloisonnement multi-organisation appliqué au niveau de la
 * couche d'accès aux données. Toute requête sur une table portant
 * organisation_id est filtrée par l'organisation de l'utilisateur courant.
 */
trait BelongsToOrganisation
{
    public static function bootBelongsToOrganisation(): void
    {
        static::addGlobalScope('organisation', function (Builder $builder) {
            $organisation = static::currentOrganisation();

            if ($organisation !== null) {
                $builder->where(fn ($q) => $q->where('organisation_id', $organisation));
            }
        });

        static::creating(function ($model) {
            if (!$model->getAttribute('organisation_id')) {
                $model->organisation_id = static::currentOrganisation();
            }
        });
    }

    protected static function currentOrganisation(): ?string
    {
        $user = Auth::user();

        // Un admin CABINET voit tout ; les autres sont cloisonnés à leur organisation.
        if ($user && $user->role !== 'ADMIN') {
            return $user->organisation_id;
        }

        return null;
    }

    public function organisation()
    {
        return $this->belongsTo(\App\Models\Organisation::class);
    }
}
