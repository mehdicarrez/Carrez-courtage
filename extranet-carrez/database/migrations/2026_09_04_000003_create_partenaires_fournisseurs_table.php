<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partenaires_fournisseurs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('fournisseur_id');
            $table->string('partenaire')->nullable();
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->integer('contrats')->default(0);
            $table->decimal('montant_primes', 15, 2)->default(0);
            $table->timestamp('dernier_contrat')->nullable();
            $table->json('documents')->nullable();
            $table->timestamps();

            $table->foreign('fournisseur_id')->references('id')->on('fournisseurs')->cascadeOnDelete();
            $table->index('fournisseur_id');
        });

        Schema::table('fournisseurs', function (Blueprint $table) {
            $table->dropColumn([
                'partenaire', 'telephone', 'email', 'contrats',
                'montant_primes', 'dernier_contrat', 'documents',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('fournisseurs', function (Blueprint $table) {
            $table->string('partenaire')->nullable()->after('information');
            $table->string('telephone')->nullable()->after('partenaire');
            $table->string('email')->nullable()->after('telephone');
            $table->integer('contrats')->default(0)->after('email');
            $table->decimal('montant_primes', 15, 2)->default(0)->after('contrats');
            $table->timestamp('dernier_contrat')->nullable()->after('montant_primes');
            $table->json('documents')->nullable()->after('dernier_contrat');
        });

        Schema::dropIfExists('partenaires_fournisseurs');
    }
};