<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Contrat (machine à états 7.2)
        Schema::create('contrats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference')->unique();
            $table->string('numero_police')->nullable();
            $table->foreignId('devis_id')->nullable()->constrained('devis')->nullOnDelete();
            $table->foreignUuid('demande_id')->nullable()->constrained('demandes_tarification')->nullOnDelete();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete(); // partenaire
            $table->foreignId('client_id')->constrained('clients');
            $table->foreignId('porteur_risque_id')->nullable()->constrained('porteurs_risque');
            $table->foreignId('grossiste_id')->nullable()->constrained('grossistes');
            $table->foreignId('produit_id')->nullable()->constrained('produits');
            $table->date('date_effet');
            $table->date('date_echeance_principale')->nullable();
            $table->date('date_fin')->nullable();
            $table->bigInteger('prime_ht_cts')->nullable();
            $table->bigInteger('taxes_cts')->nullable();
            $table->bigInteger('prime_ttc_cts')->nullable();
            $table->bigInteger('frais_courtage_cts')->nullable();
            $table->string('fractionnement');
            $table->string('statut')->default('EN_CONSTITUTION');
            $table->string('motif_resiliation')->nullable();
            $table->date('date_resiliation')->nullable();
            $table->integer('annee_assurance')->default(1);
            $table->json('bareme_applique')->nullable(); // copie figée (RG-40)
            $table->json('signature')->nullable(); // dossier de preuve eIDAS (RG-31)
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organisation_id', 'statut']);
        });

        // Avenants (RG-32)
        Schema::create('avenants', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('contrat_id')->constrained('contrats')->cascadeOnDelete();
            $table->string('type'); // changement véhicule, garanties, adresse, RIB, fractionnement, régularisation
            $table->date('date_effet');
            $table->bigInteger('variation_prime_cts')->nullable();
            $table->text('description')->nullable();
            $table->string('statut')->default('PROJET'); // PROJET | SIGNE | APPLIQUE | REFUSE
            $table->timestamps();
        });

        // Quittances (RG-33, F-306)
        Schema::create('quittances', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('contrat_id')->constrained('contrats')->cascadeOnDelete();
            $table->string('numero')->nullable();
            $table->integer('echeance'); // n° 1..12
            $table->date('date_appel');
            $table->date('date_echeance')->nullable();
            $table->bigInteger('montant_cts');
            $table->string('statut')->default('A_ECHELONNER'); // A_ECHELONNER | APPELEE | ENCAISSEE | IMPAYEE | ANNULEE
            $table->date('date_encaissee')->nullable();
            $table->timestamps();
            $table->index(['contrat_id', 'statut']);
        });

        // Sinistres (informatif)
        Schema::create('sinistres', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('contrat_id')->constrained('contrats')->cascadeOnDelete();
            $table->string('numero')->nullable();
            $table->date('date_survenance')->nullable();
            $table->date('date_declaration')->nullable();
            $table->string('nature')->nullable();
            $table->string('statut')->default('OUVERT'); // OUVERT | EN_COURS_EXPERTISE | CLOS | SANS_SUITE
            $table->bigInteger('montant_estime_cts')->nullable();
            $table->bigInteger('montant_regle_cts')->nullable();
            $table->string('gestionnaire_porteur')->nullable();
            $table->string('declare_par')->nullable(); // PARTENAIRE | CABINET
            $table->timestamps();
        });

        // Ligne de commission (RG-03, RG-41..43, §8.2)
        Schema::create('lignes_commission', function (Blueprint $table) {
            $table->id();
            $table->string('nature'); // PERCUE | RETROCEDEE
            $table->foreignUuid('contrat_id')->nullable()->constrained('contrats');
            $table->foreignId('quittance_id')->nullable()->constrained('quittances');
            $table->foreignId('avenant_id')->nullable()->constrained('avenants');
            $table->foreignUuid('organisation_id')->constrained('organisations'); // bénéficiaire pour rétrocédée
            $table->date('periode_debut')->nullable();
            $table->date('periode_fin')->nullable();
            $table->integer('annee_assurance')->default(1);
            $table->bigInteger('assiette_cts')->nullable();
            $table->string('mode_calcul')->nullable();
            $table->decimal('taux', 8, 4)->nullable();
            $table->bigInteger('montant_cts');
            $table->string('statut')->default('PREVISIONNELLE'); // PREVISIONNELLE | ACQUISE | BORDEREE | PAYEE | ANNULEE | REPRISE
            $table->integer('bordereau_id')->nullable();
            $table->foreignId('ligne_reprise_de')->nullable()->constrained('lignes_commission');
            $table->string('motif')->nullable();
            $table->json('trace_calcul')->nullable(); // RG-41 reconstruction
            $table->timestamps();
            $table->index(['organisation_id', 'statut']);
        });

        // Bordereaux de commissions (§8.3)
        Schema::create('bordereaux', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('reference')->unique();
            $table->date('periode_debut');
            $table->date('periode_fin');
            $table->string('statut')->default('GENERATION'); // GENERATION | A_VERIFIER | VALIDE | PUBLIE | PAYE
            $table->bigInteger('report_anterieur_cts')->default(0);
            $table->bigInteger('total_brut_cts')->default(0);
            $table->bigInteger('total_reprises_cts')->default(0);
            $table->bigInteger('net_a_payer_cts')->default(0);
            $table->text('commentaire_comptable')->nullable();
            $table->timestamps();
            $table->index(['organisation_id', 'statut']);
        });

        // Paiement déclaré
        Schema::create('paiements_declares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bordereau_id')->constrained('bordereaux')->cascadeOnDelete();
            $table->date('date_paiement');
            $table->bigInteger('montant_cts');
            $table->string('reference')->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamps();
        });

        // Contestation de ligne de commission (F-409)
        Schema::create('contestations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ligne_commission_id')->constrained('lignes_commission')->cascadeOnDelete();
            $table->foreignId('auteur_id')->constrained('users')->cascadeOnDelete();
            $table->text('message');
            $table->string('statut')->default('OUVERTE'); // OUVERTE | EN_COURS | RESOLUE
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contestations');
        Schema::dropIfExists('paiements_declares');
        Schema::dropIfExists('bordereaux');
        Schema::dropIfExists('lignes_commission');
        Schema::dropIfExists('sinistres');
        Schema::dropIfExists('quittances');
        Schema::dropIfExists('avenants');
        Schema::dropIfExists('contrats');
    }
};
