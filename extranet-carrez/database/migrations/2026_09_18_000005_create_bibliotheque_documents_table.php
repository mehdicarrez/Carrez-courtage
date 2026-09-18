<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bibliotheque_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('categorie');
            $table->string('titre');
            $table->string('nom_origine');
            $table->bigInteger('taille')->default(0);
            $table->string('mime')->nullable();
            $table->string('cle_stockage');
            $table->timestamps();
            $table->index(['organisation_id', 'categorie']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bibliotheque_documents');
    }
};
