<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('reference')->nullable()->unique();
            $table->string('souscripteur')->nullable();
            $table->string('adresse')->nullable();
            $table->string('code_postal')->nullable();
            $table->string('ville')->nullable();
            $table->string('contact_commercial')->nullable();
            $table->date('date_facture')->nullable();
            $table->date('date_echeance')->nullable();
            $table->json('moyens_reglement')->nullable();
            $table->bigInteger('montant_ht_cts')->default(0);
            $table->bigInteger('montant_taxes_cts')->default(0);
            $table->bigInteger('montant_ttc_cts')->default(0);
            $table->string('statut')->default('BROUILLON');
            $table->date('date_encaissee')->nullable();
            $table->timestamps();
            $table->index(['client_id', 'statut']);
        });

        Schema::create('facture_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->string('type')->nullable();
            $table->string('designation');
            $table->decimal('quantite', 12, 2)->default(1);
            $table->bigInteger('prix_unitaire_ht_cts')->default(0);
            $table->decimal('taxe', 5, 2)->default(0);
            $table->bigInteger('total_ht_cts')->default(0);
            $table->bigInteger('total_taxes_cts')->default(0);
            $table->bigInteger('total_ttc_cts')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facture_lignes');
        Schema::dropIfExists('factures');
    }
};
