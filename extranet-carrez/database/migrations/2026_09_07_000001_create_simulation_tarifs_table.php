<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulation_tarifs', function (Blueprint $table) {
            $table->id();
            $table->string('produit');
            $table->string('niveau_garantie');
            $table->decimal('prime_base', 10, 2);
            $table->timestamps();

            $table->unique(['produit', 'niveau_garantie']);
        });

        DB::table('simulation_tarifs')->insert([
            ['produit' => 'AUTO', 'niveau_garantie' => 'Basique', 'prime_base' => 420.00, 'created_at' => now(), 'updated_at' => now()],
            ['produit' => 'AUTO', 'niveau_garantie' => 'Renforcé', 'prime_base' => 690.00, 'created_at' => now(), 'updated_at' => now()],
            ['produit' => 'Moto', 'niveau_garantie' => 'Basique', 'prime_base' => 250.00, 'created_at' => now(), 'updated_at' => now()],
            ['produit' => 'Moto', 'niveau_garantie' => 'Renforcé', 'prime_base' => 430.00, 'created_at' => now(), 'updated_at' => now()],
            ['produit' => 'Immobilier', 'niveau_garantie' => 'Basique', 'prime_base' => 300.00, 'created_at' => now(), 'updated_at' => now()],
            ['produit' => 'Immobilier', 'niveau_garantie' => 'Renforcé', 'prime_base' => 520.00, 'created_at' => now(), 'updated_at' => now()],
            ['produit' => 'Travaux', 'niveau_garantie' => 'Basique', 'prime_base' => 600.00, 'created_at' => now(), 'updated_at' => now()],
            ['produit' => 'Travaux', 'niveau_garantie' => 'Renforcé', 'prime_base' => 950.00, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('simulation_tarifs');
    }
};