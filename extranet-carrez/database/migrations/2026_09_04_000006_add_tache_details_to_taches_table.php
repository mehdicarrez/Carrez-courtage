<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taches', function (Blueprint $table) {
            $table->string('reference')->nullable()->unique()->after('id');
            $table->string('type')->default('SINISTRE')->after('titre');
            $table->string('objet')->nullable()->after('type');
            $table->date('date_debut')->nullable()->after('date_echeance');
            $table->date('date_fin')->nullable()->after('date_debut');
            $table->decimal('montant', 12, 2)->nullable()->after('date_fin');
            $table->unsignedInteger('avancement')->default(0)->after('montant');
            $table->decimal('temps_passe_h', 8, 2)->nullable()->after('avancement');
        });
    }

    public function down(): void
    {
        Schema::table('taches', function (Blueprint $table) {
            $table->dropUnique(['reference']);
            $table->dropColumn([
                'reference', 'type', 'objet', 'date_debut',
                'date_fin', 'montant', 'avancement', 'temps_passe_h',
            ]);
        });
    }
};
