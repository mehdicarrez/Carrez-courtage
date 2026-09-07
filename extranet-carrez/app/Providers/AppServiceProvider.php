<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Carte morph : les enregistrements polymorphiques de la solution sont
        // stockés avec des noms courts (ex. objet_type = 'contrat'), tandis que
        // d'autres relations polymorphiques utilisent la FQCN (ex. garantissable_type).
        // La carte ci-dessous rend les deux valeurs lisibles quel que soit le cas.
        Relation::morphMap([
            'demande' => \App\Models\DemandeTarification::class,
            'devis' => \App\Models\Devis::class,
            'contrat' => \App\Models\Contrat::class,
            'avenant' => \App\Models\Avenant::class,
            'quittance' => \App\Models\Quittance::class,
            'sinistre' => \App\Models\Sinistre::class,
            'bordereau' => \App\Models\Bordereau::class,
            'ligne_commission' => \App\Models\LigneCommission::class,
            'organisation' => \App\Models\Organisation::class,
            'client' => \App\Models\Client::class,
            'user' => \App\Models\User::class,
        ]);
    }
}
