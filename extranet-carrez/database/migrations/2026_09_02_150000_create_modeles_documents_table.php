<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Gabarits de documents PDF (RG-43, RG-72) — police, proposition, attestation
        Schema::create('modeles_documents', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('type'); // POLICE, PROPOSITION, ATTESTATION
            $table->string('version')->default('v1'); // /2026/
            $table->string('moteur')->default('dompdf');
            $table->string('chemin_vue'); // vue blade du gabarit
            $table->json('variables')->nullable(); // placeholders disponibles
            $table->string('statut')->default('ACTIF'); // ACTIF, DESACTIVE
            $table->boolean('par_defaut')->default(false); // gabarit par défaut pour le type
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modeles_documents');
    }
};
