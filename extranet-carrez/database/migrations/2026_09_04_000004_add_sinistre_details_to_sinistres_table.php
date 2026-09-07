<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sinistres', function (Blueprint $table) {
            $table->string('ref_compagnie')->nullable()->after('numero');
            $table->string('compagnie')->nullable()->after('ref_compagnie');
            $table->string('type_contrat')->nullable()->after('compagnie');
            $table->string('garantie')->nullable()->after('type_contrat');
            $table->string('etat')->default('OUVERT')->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('sinistres', function (Blueprint $table) {
            $table->dropColumn(['ref_compagnie', 'compagnie', 'type_contrat', 'garantie', 'etat']);
        });
    }
};
