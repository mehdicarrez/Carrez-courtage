<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->timestamp('date_envoye')->nullable()->after('date_validite');
        });
    }

    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->dropColumn('date_envoye');
        });
    }
};