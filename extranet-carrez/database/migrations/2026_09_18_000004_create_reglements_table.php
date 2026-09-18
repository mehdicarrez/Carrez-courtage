<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reglements', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->string('reference')->nullable()->unique();
            $table->string('mode_reglement');
            $table->bigInteger('montant_cts')->default(0);
            $table->text('details')->nullable();
            $table->text('mentions')->nullable();
            $table->date('date_reglement')->nullable();
            $table->string('statut')->default('ENCAISSE');
            $table->timestamps();
            $table->index(['client_id', 'statut']);
            $table->index('facture_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reglements');
    }
};
