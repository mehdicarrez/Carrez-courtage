<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Demande de tarification (machine à états 5.4)
        Schema::create('demandes_tarification', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference')->unique(); // DT-AAAA-NNNNNN (RG-16)
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete(); // partenaire apporteur
            $table->foreignId('branche_id')->constrained('branches');
            $table->integer('schema_formulaire_version');
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->json('donnees_risque')->nullable();
            $table->string('statut')->default('BROUILLON');
            $table->timestamp('date_statut')->nullable();
            $table->string('motif')->nullable();
            $table->foreignId('gestionnaire_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('date_soumission')->nullable();
            $table->timestamp('date_prise_en_charge')->nullable();
            $table->timestamp('date_premier_devis')->nullable();
            $table->string('origine')->default('PARTENAIRE'); // PARTENAIRE | CABINET | IMPORT
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organisation_id', 'statut']);
        });

        // Véhicules du parc (cas flottes, F-104)
        Schema::create('vehicules', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('demande_id')->constrained('demandes_tarification')->cascadeOnDelete();
            $table->string('immatriculation')->nullable();
            $table->string('marque')->nullable();
            $table->string('modele')->nullable();
            $table->date('date_premiere_mise_circulation')->nullable();
            $table->string('usage')->nullable();
            $table->integer('ptac_kg')->nullable();
            $table->json('donnees')->nullable();
            $table->integer('ligne_import')->nullable(); // ligne source dans le fichier
            $table->timestamps();
            $table->index('demande_id');
        });

        // Devis (machine à états 6.2) et lignes de garantie
        Schema::create('devis', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('demande_id')->constrained('demandes_tarification')->cascadeOnDelete();
            $table->string('version_label')->nullable();
            $table->integer('version')->default(1);
            $table->foreignId('porteur_risque_id')->nullable()->constrained('porteurs_risque');
            $table->foreignId('grossiste_id')->nullable()->constrained('grossistes');
            $table->foreignId('produit_id')->nullable()->constrained('produits');
            $table->string('reference_amont')->nullable();
            $table->bigInteger('prime_ht_cts')->nullable();
            $table->bigInteger('taxes_cts')->nullable();
            $table->bigInteger('prime_ttc_cts')->nullable();
            $table->bigInteger('frais_courtage_cts')->nullable();
            $table->string('fractionnement')->nullable();
            $table->bigInteger('premiere_echeance_cts')->nullable();
            $table->date('date_effet_possible')->nullable();
            $table->date('date_validite');
            $table->text('conditions_particulieres')->nullable();
            $table->text('reserves')->nullable();
            $table->decimal('taux_commission_percue', 8, 4)->nullable(); // interne, jamais visible partenaire (RG-03)
            $table->bigInteger('montant_retrocession_cts')->nullable();
            $table->string('statut')->default('BROUILLON'); // BROUILLON | ENVOYE | ACCEPTE | REFUSE | EXPIRE | TRANSFORME
            $table->integer('devis_parent_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('lignes_garantie', function (Blueprint $table) {
            $table->id();
            $table->morphs('garantissable'); // devis ou contrat
            $table->string('intitule');
            $table->bigInteger('plafond_cts')->nullable();
            $table->bigInteger('franchise_cts')->nullable();
            $table->boolean('incluse')->default(true);
            $table->boolean('optionnelle')->default(false);
            $table->bigInteger('prix_option_cts')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lignes_garantie');
        Schema::dropIfExists('devis');
        Schema::dropIfExists('vehicules');
        Schema::dropIfExists('demandes_tarification');
    }
};
