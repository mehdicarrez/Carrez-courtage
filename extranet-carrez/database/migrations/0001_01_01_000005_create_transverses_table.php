<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Documents / GED (RG-50..54)
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_document_id')->nullable()->constrained('types_documents')->nullOnDelete();
            $table->string('nom_origine');
            $table->bigInteger('taille')->nullable();
            $table->string('mime_reel')->nullable();
            $table->string('mime_declare')->nullable();
            $table->string('objet_type')->nullable(); // demande, devis, contrat, ligne_commission...
            $table->string('objet_id')->nullable();
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations'); // RG-74
            $table->string('cle_stockage')->nullable(); // clé opaque stockage objet
            $table->integer('version')->default(1);
            $table->foreignId('document_parent_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->string('statut_validation')->default('DEPOSE'); // DEPOSE | VALIDE | REFUSE
            $table->string('motif_refus')->nullable();
            $table->foreignId('valide_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('date_validation')->nullable();
            $table->string('sensibilite')->default('NORMALE'); // NORMALE | SENSIBLE
            $table->string('statut_antivirus')->default('EN_ATTENTE'); // EN_ATTENTE | SAIN | INFECTE
            $table->date('date_purge_prevue')->nullable();
            $table->string('hash_sha256')->nullable();
            $table->boolean('supprime_logiquement')->default(false);
            $table->timestamps();
            $table->index(['objet_type', 'objet_id']);
        });

        // Conversations (fils par objet métier, §9.2)
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->string('objet_type');
            $table->string('objet_id');
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations');
            $table->timestamps();
            $table->unique(['objet_type', 'objet_id']);
        });

        // Messages (RG-55 visibilité)
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('auteur_id')->constrained('users')->cascadeOnDelete();
            $table->text('contenu');
            $table->string('visibilite')->default('EXTERNE'); // EXTERNE (partenaires) | INTERNE (notes cabinet uniquement)
            $table->json('pieces_jointes')->nullable(); // ids documents
            $table->timestamps();
            $table->index(['conversation_id', 'visibilite']);
        });

        // Lu/non lu
        Schema::create('messages_lus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('lu_le');
            $table->unique(['message_id', 'user_id']);
        });

        // E-mails entrants/sortants rattachés (§9.3)
        Schema::create('e_mails', function (Blueprint $table) {
            $table->id();
            $table->string('sens'); // ENTRANT | SORTANT
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations');
            $table->string('objet_type')->nullable();
            $table->string('objet_id')->nullable();
            $table->string('expediteur')->nullable();
            $table->json('destinataires')->nullable();
            $table->string('sujet')->nullable();
            $table->text('corps')->nullable();
            $table->string('adresse_dossier')->nullable(); // dt-2026-000431@dossiers...
            $table->string('statut_rattachement')->default('RATTACHE'); // RATTACHE | NON_RATTACHE
            $table->string('statut_delivrabilite')->nullable(); // ENVOYE | REMIS | REJETE | OUVERT
            $table->boolean('visible_partenaire')->default(false); // RG-56
            $table->json('pieces_jointes_ids')->nullable();
            $table->timestamps();
            $table->index(['objet_type', 'objet_id']);
        });

        // Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type'); // in-app
            $table->json('data')->nullable();
            $table->string('objet_type')->nullable();
            $table->string('objet_id')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        // Journal d'audit (RG-62, RG-63)
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('horodatage')->useCurrent();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations')->nullOnDelete();
            $table->string('ip')->nullable();
            $table->string('action');
            $table->string('objet_type')->nullable();
            $table->string('objet_id')->nullable();
            $table->json('avant')->nullable();
            $table->json('apres')->nullable();
            $table->text('detail')->nullable();
            $table->index(['user_id', 'action']);
            $table->index('horodatage');
        });

        // Échéances de pièces réglementaires (RG-60)
        Schema::create('pieces_organisation', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('type_document_id')->constrained('types_documents');
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->date('date_validite')->nullable();
            $table->string('statut_controle')->nullable(); // EN_ATTENTE | VALIDE | EXPIREE
            $table->string('commentaire_controle')->nullable();
            $table->foreignId('controle_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('date_controle')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pieces_organisation');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('e_mails');
        Schema::dropIfExists('messages_lus');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('documents');
    }
};
