<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // RG-01 bis : trace le créateur d'un devis pour cloisonner la visibilité
        // (un partenaire ne voit que les devis qu'il a proposés)
        Schema::table('devis', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('demande_id')->constrained('users')->nullOnDelete();
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn('user_id');
        });
    }
};