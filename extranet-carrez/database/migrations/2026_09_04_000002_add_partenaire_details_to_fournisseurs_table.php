<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fournisseurs', function (Blueprint $table) {
            $table->string('service')->nullable()->after('nom');
            $table->string('partenaire')->nullable()->after('information');
            $table->string('telephone')->nullable()->after('partenaire');
            $table->string('email')->nullable()->after('telephone');
            $table->integer('contrats')->default(0)->after('email');
            $table->decimal('montant_primes', 15, 2)->default(0)->after('contrats');
            $table->timestamp('dernier_contrat')->nullable()->after('montant_primes');
            $table->json('documents')->nullable()->after('dernier_contrat');
        });
    }

    public function down(): void
    {
        Schema::table('fournisseurs', function (Blueprint $table) {
            $table->dropColumn([
                'service', 'partenaire', 'telephone', 'email', 'contrats',
                'montant_primes', 'dernier_contrat', 'documents',
            ]);
        });
    }
};