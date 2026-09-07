<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('organisations', function (Blueprint $table) {
            // Candidature / validation réglementaire (RG-60)
            $table->json('checklist_validation')->nullable(); // [{cle, libelle, ok}]
            $table->json('branches_autorisees')->nullable();
            $table->string('decision')->nullable(); // ACCEPTEE | REFUSEE
            $table->string('motif_decision')->nullable();
            $table->timestamp('date_decision')->nullable();
            $table->foreignId('decide_par')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organisations', function (Blueprint $table) {
            $table->dropForeign(['decide_par']);
            $table->dropColumn([
                'checklist_validation', 'branches_autorisees', 'decision',
                'motif_decision', 'date_decision', 'decide_par',
            ]);
        });
    }
};
