<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sinistres', function (Blueprint $table) {
            $table->foreignId('suivi_par_id')->nullable()->after('etat')->constrained('users')->nullOnDelete();
            $table->string('franchise')->nullable()->after('suivi_par_id');
            $table->text('circonstance')->nullable()->after('franchise');
            $table->text('description_dommages')->nullable()->after('circonstance');
            $table->string('responsabilite')->nullable()->after('description_dommages');
            $table->string('beneficiaire')->nullable()->after('responsabilite');
            $table->string('expertise')->nullable()->after('beneficiaire');
            $table->string('recours')->nullable()->after('expertise');
            $table->date('cloture_le')->nullable()->after('recours');
        });
    }

    public function down(): void
    {
        Schema::table('sinistres', function (Blueprint $table) {
            $table->dropConstrainedForeignId('suivi_par_id');
            $table->dropColumn([
                'franchise', 'circonstance', 'description_dommages', 'responsabilite',
                'beneficiaire', 'expertise', 'recours', 'cloture_le',
            ]);
        });
    }
};
