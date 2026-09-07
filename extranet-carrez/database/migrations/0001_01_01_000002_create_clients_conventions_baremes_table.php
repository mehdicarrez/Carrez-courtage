<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Client final (personne physique ou morale)
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete(); // RG-74 cloisonnement
            $table->string('type'); // PHYSIQUE | MORALE
            // personne physique
            $table->string('civilite')->nullable();
            $table->string('nom')->nullable();
            $table->string('prenom')->nullable();
            $table->date('date_naissance')->nullable();
            // personne morale
            $table->string('raison_sociale')->nullable();
            $table->string('siren', 9)->nullable();
            $table->string('siret', 14)->nullable();
            // commun
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->string('code_postal', 10)->nullable();
            $table->string('ville')->nullable();
            $table->json('complement')->nullable();
            $table->string('cree_le')->nullable();
            $table->string('cree_par')->nullable();
            $table->string('modifie_le')->nullable();
            $table->string('modifie_par')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Convention de partenariat (RG-60, onboarding)
        Schema::create('conventions_partenariat', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('statut')->default('BROUILLON'); // BROUILLON | EN_SIGNATURE | SIGNE | RESILIEE
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->string('propriete_portefeuille')->nullable();
            $table->json('modalites')->nullable();
            $table->foreignId('document_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique('organisation_id');
        });

        // Barème de commission (RG-40, RG-41)
        Schema::create('baremes_commission', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('produit_id')->nullable()->constrained('produits')->nullOnDelete();
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->string('assiette'); // PERCENT_COMMISSION_CABINET | PERCENT_PRIME_HT | FORFAIT
            $table->decimal('taux_1ere_annee', 8, 4)->nullable();
            $table->decimal('taux_renouvellement', 8, 4)->nullable();
            $table->decimal('part_frais_courtage', 8, 4)->nullable(); // part fixe en %
            $table->bigInteger('plancher_cts')->nullable();
            $table->bigInteger('plafond_cts')->nullable();
            $table->integer('duree_reprise_mois')->nullable();
            $table->string('modalite_reprise')->nullable(); // INTEGRAL | PRORATA
            $table->string('regime_tva')->default('EXONERE');
            $table->boolean('courant')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('baremes_commission');
        Schema::dropIfExists('conventions_partenariat');
        Schema::dropIfExists('clients');
    }
};
