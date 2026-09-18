<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * La carte morph (AppServiceProvider) enregistre les relations polymorphiques
 * avec des noms courts ('devis', 'contrat'). Les lignes de garantie créées
 * auparavant stockaient la FQCN (App\Models\Devis), ce qui empêchait la
 * relation `garanties` de les retrouver. On aligne les données existantes.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach ([
            \App\Models\Devis::class => 'devis',
            \App\Models\Contrat::class => 'contrat',
        ] as $fqcn => $alias) {
            DB::table('lignes_garantie')
                ->where('garantissable_type', $fqcn)
                ->update(['garantissable_type' => $alias]);
        }
    }

    public function down(): void
    {
        foreach ([
            'devis' => \App\Models\Devis::class,
            'contrat' => \App\Models\Contrat::class,
        ] as $alias => $fqcn) {
            DB::table('lignes_garantie')
                ->where('garantissable_type', $alias)
                ->update(['garantissable_type' => $fqcn]);
        }
    }
};
