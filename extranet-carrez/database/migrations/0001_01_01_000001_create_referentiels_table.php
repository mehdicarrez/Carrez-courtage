<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Branches du catalogue (RG-10)
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('nom');
            $table->string('famille'); // Dommages-roulant, Dommages-habitation, Personnes, Professionnels
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Schémas de formulaires versionnés (RG-10, RG-11)
        Schema::create('schemas_formulaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branche_id')->constrained()->cascadeOnDelete();
            $table->integer('version');
            $table->json('schema'); // JSON Schema du formulaire
            $table->json('pieces_attendues')->nullable(); // [{type_document_id, obligatoire}]
            $table->boolean('courant')->default(true);
            $table->foreignId('auteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['branche_id', 'version']);
        });

        // Porteurs de risque (compagnies)
        Schema::create('porteurs_risque', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('orias')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Grossistes / MGA
        Schema::create('grossistes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('orias')->nullable();
            $table->json('contact')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Produits rattachés à une branche
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('nom');
            $table->foreignId('branche_id')->constrained();
            $table->foreignId('porteur_risque_id')->nullable()->constrained('porteurs_risque');
            $table->foreignId('grossiste_id')->nullable()->constrained('grossistes');
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Types de documents (référentiel GED)
        Schema::create('types_documents', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('libelle');
            $table->boolean('sensible')->default(false); // ex: questionnaire de santé
            $table->integer('retenue_mois')->nullable(); // durée de rétention
            $table->timestamps();
        });

        // Motifs (refus, résiliation, sans suite, reprise...)
        Schema::create('motifs', function (Blueprint $table) {
            $table->id();
            $table->string('categorie'); // REFUS | RESILIATION | SANS_SUITE | REPRISE
            $table->string('code');
            $table->string('libelle');
            $table->timestamps();
            $table->unique(['categorie', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motifs');
        Schema::dropIfExists('types_documents');
        Schema::dropIfExists('grossistes');
        Schema::dropIfExists('porteurs_risque');
        Schema::dropIfExists('produits');
        Schema::dropIfExists('schemas_formulaires');
        Schema::dropIfExists('branches');
    }
};
