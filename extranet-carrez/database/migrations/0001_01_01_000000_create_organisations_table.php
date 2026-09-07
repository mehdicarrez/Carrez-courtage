<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organisations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // CABINET | PARTENAIRE
            $table->string('raison_sociale');
            $table->string('forme_juridique')->nullable();
            $table->string('siren', 9)->nullable();
            $table->string('siret', 14)->nullable();
            $table->string('adresse')->nullable();
            $table->string('ville')->nullable();
            $table->string('code_postal', 10)->nullable();
            $table->string('pays', 2)->default('FR');
            $table->string('numero_orias')->nullable();
            $table->json('categories_orias')->nullable(); // COA, AGA, MIA, MIOBSP
            $table->string('statut')->default('CANDIDAT'); // CANDIDAT | EN_VALIDATION | ACTIVE | SUSPENDUE | RESILIEE
            $table->date('date_activation')->nullable();
            $table->date('date_suspension')->nullable();
            $table->string('motif_suspension')->nullable();
            $table->json('parametres')->nullable(); // préférences notification etc.
            $table->uuid('admin_id')->nullable(); // utilisateur dirigeant
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organisations');
    }
};
