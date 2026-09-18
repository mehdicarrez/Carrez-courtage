<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catalogue de garanties (référentiel, RG-21) + liaison
 * devis ↔ garanties incluses proposées par le partenaire.
 *
 * Le partenaire sélectionne en cases à cocher autant de garanties
 * (« souscription garanties incluses ») qu'il en propose.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('garanties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branche_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->unique();
            $table->string('intitule');
            $table->string('famille')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('devis_garanties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devis_id')->constrained()->cascadeOnDelete();
            $table->foreignId('garantie_id')->constrained()->cascadeOnDelete();
            $table->boolean('incluse')->default(true);
            $table->timestamps();
            $table->unique(['devis_id', 'garantie_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devis_garanties');
        Schema::dropIfExists('garanties');
    }
};
