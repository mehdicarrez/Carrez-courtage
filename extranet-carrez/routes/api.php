<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\BrancheController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CommissionController;
use App\Http\Controllers\Api\ContratController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\DemandeController;
use App\Http\Controllers\Api\DemandeInscriptionPartenaireController;
use App\Http\Controllers\Api\DevisController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmailController;
use App\Http\Controllers\Api\FournisseurController;
use App\Http\Controllers\Api\GrossisteController;
use App\Http\Controllers\Api\MessagerieController;
use App\Http\Controllers\Api\PartenaireController;
use App\Http\Controllers\Api\ProduitController;
use App\Http\Controllers\Api\ReferentielController;
use App\Http\Controllers\Api\ReseauSocialController;
use App\Http\Controllers\Api\SimulationController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Authentification publique
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/enable-2fa', [AuthController::class, 'activer'])->middleware('auth:sanctum');
Route::post('/auth/confirm-2fa', [AuthController::class, 'validerActivation'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Notifications
    Route::get('/notifications', [DashboardController::class, 'notifications']);
    Route::post('/notifications/{notification}/read', [DashboardController::class, 'marquerLue']);

    // Tableaux de bord
    Route::get('/dashboard', [DashboardController::class, 'resume']);
    Route::get('/pilotage', [DashboardController::class, 'pilotage']);
    Route::get('/pilotage/export', [DashboardController::class, 'pilotageExport']);

    // Simulateur de primes
    Route::post('/simulator/estimate', [SimulationController::class, 'estimer']);
    Route::get('/simulations', [SimulationController::class, 'index']);
    Route::post('/simulations', [SimulationController::class, 'store']);

    // Référentiels
    Route::get('/branches', [BrancheController::class, 'index']);
    Route::get('/branches/{branche}', [BrancheController::class, 'show']);
    Route::get('/branches/{branche}/schema', [BrancheController::class, 'schema']);
    Route::get('/produits', [ProduitController::class, 'index']);
    Route::get('/grossistes', [GrossisteController::class, 'index']);
    Route::get('/referentiels', [ReferentielController::class, 'index']);
    Route::get('/referentiels/actifs', [ReferentielController::class, 'actifs']);
    Route::post('/referentiels/{cle}', [ReferentielController::class, 'store']);
    Route::put('/referentiels/{cle}/{id}', [ReferentielController::class, 'update']);
    Route::delete('/referentiels/{cle}/{id}', [ReferentielController::class, 'destroy']);
    Route::patch('/referentiels/{cle}/{id}/toggle', [ReferentielController::class, 'toggle']);

    // Module 1 — Demandes
    Route::get('/demandes', [DemandeController::class, 'index']);
    Route::post('/demandes', [DemandeController::class, 'store']);
    Route::get('/demandes/gestionnaires', [DemandeController::class, 'gestionnaires']); // F-105
    Route::post('/demandes/attribution-massive', [DemandeController::class, 'attributionMassive']); // F-108
    Route::get('/demandes/{demande}', [DemandeController::class, 'show']);
    Route::patch('/demandes/{demande}', [DemandeController::class, 'update']); // brouillon uniquement
    Route::delete('/demandes/{demande}', [DemandeController::class, 'destroy']); // brouillon uniquement
    Route::post('/demandes/{demande}/transitions', [DemandeController::class, 'transition']); // {action, motif}
    Route::post('/demandes/{demande}/signature', [DemandeController::class, 'signer']); // Yousign sandbox
    Route::post('/demandes/{demande}/vehicules/import', [DemandeController::class, 'importParc']);
    Route::post('/demandes/{demande}/demande-pieces', [DemandeController::class, 'demanderPieces']); // F-107
    Route::post('/demandes/{demande}/attribuer', [DemandeController::class, 'attribuer']); // F-106

    // Répertoire de clients + rattachement aux demandes
    Route::get('/clients', [ClientController::class, 'index']);
    Route::post('/clients', [ClientController::class, 'store']);
    Route::post('/clients/import', [ClientController::class, 'importCsv']);

    // Affectation client-utilisateur (accès « Limité aux clients attribués »)
    Route::get('/clients/affectation/utilisateurs', [ClientController::class, 'utilisateursAffectables']);
    Route::put('/clients/affectation/utilisateurs/{user}', [ClientController::class, 'enregistrerAffectation']);

    Route::get('/clients/{client}', [ClientController::class, 'show']);
    Route::get('/clients/{client}/demandes', [ClientController::class, 'demandes']);
    Route::get('/clients/{client}/contrats', [ClientController::class, 'contrats']);
    Route::get('/clients/{client}/factures', [ClientController::class, 'factures']);
    Route::get('/clients/{client}/sinistres', [ClientController::class, 'sinistres']);
    Route::post('/clients/{client}/sinistres', [ClientController::class, 'creerSinistre']);
    Route::post('/clients/{client}/factures', [ClientController::class, 'creerFacture']);
    Route::post('/factures/{facture}/lignes', [ClientController::class, 'ajouterLignes']);

    Route::get('/clients/{client}/taches', [ClientController::class, 'taches']);
    Route::get('/taches', [ClientController::class, 'toutesTaches']);
    Route::post('/clients/{client}/taches', [ClientController::class, 'creerTache']);
    Route::put('/taches/{tache}', [ClientController::class, 'majTache']);
    Route::delete('/taches/{tache}', [ClientController::class, 'supprimerTache']);
    Route::put('/clients/{client}', [ClientController::class, 'update']);
    Route::delete('/clients/{client}', [ClientController::class, 'destroy']);
    Route::post('/demandes/{demande}/affecter-client', [ClientController::class, 'affecterADemande']);
    Route::post('/demandes/affectation-clients', [ClientController::class, 'affectationMassive']);

    // Module 2 — Devis
    Route::get('/devis', [DevisController::class, 'liste']);
    Route::get('/demandes/{demande}/devis', [DevisController::class, 'index']);
    Route::post('/demandes/{demande}/devis', [DevisController::class, 'store']);
    Route::get('/devis/{devis}', [DevisController::class, 'show']);
    Route::patch('/devis/{devis}', [DevisController::class, 'update']);
    Route::post('/devis/{devis}/transitions', [DevisController::class, 'transition']); // envoyer|accepter|refuser|prolonger
    Route::get('/devis/{devis}/pdf', [DevisController::class, 'pdf']); // F-205
    Route::post('/devis/{devis}/contrat', [ContratController::class, 'creerDepuisDevis']); // F-303

    // Module 3 — Contrats
    Route::get('/contrats', [ContratController::class, 'index']);
    Route::post('/contrats', [ContratController::class, 'store']);
    Route::get('/contrats/{contrat}', [ContratController::class, 'show']);
    Route::put('/contrats/{contrat}', [ContratController::class, 'update']);
    Route::post('/contrats/{contrat}/transitions', [ContratController::class, 'transition']);
    Route::post('/contrats/{contrat}/avenants', [ContratController::class, 'creerAvenant']);
    Route::post('/contrats/{contrat}/quittances', [ContratController::class, 'genererQuittances']);
    Route::patch('/quittances/{quittance}', [ContratController::class, 'majQuittance']);
    Route::post('/contrats/{contrat}/sinistres', [ContratController::class, 'declarerSinistre']);
    Route::post('/contrats/{contrat}/resiliation', [ContratController::class, 'resilier']);
    Route::get('/echeances', [ContratController::class, 'echeances']); // F-309
    Route::post('/contrats/{contrat}/relancer', [ContratController::class, 'relancer']);
    Route::post('/contrats/import', [ContratController::class, 'importPortefeuille']); // F-312

    // Module 3 — Souscription (checklist, génération police, signature simulée)
    Route::get('/contrats/{contrat}/souscription', [ContratController::class, 'souscription']);
    Route::patch('/contrats/{contrat}/souscription/checklist', [ContratController::class, 'updateChecklist']);
    Route::post('/contrats/{contrat}/documents/generer-police', [ContratController::class, 'genererPolice']);
    Route::post('/contrats/{contrat}/documents/generer-document', [ContratController::class, 'genererDocument']);
    Route::post('/contrats/{contrat}/souscription/envoyer-signature', [ContratController::class, 'envoyerSignature']);
    Route::post('/contrats/{contrat}/souscription/marquer-signe', [ContratController::class, 'marquerSigne']);

    // Module 4 — Commissions
    Route::get('/commissions', [CommissionController::class, 'index']);
    Route::get('/commissions/perques', [CommissionController::class, 'perques']);
    Route::post('/commissions/perques', [CommissionController::class, 'saisirPerque']);
    Route::post('/commissions/import-csv', [CommissionController::class, 'importCsv']);
    Route::get('/commissions/rapprochement', [CommissionController::class, 'rapprochement']);
    Route::post('/commissions/{ligne}/contester', [CommissionController::class, 'contester']); // F-409
    Route::get('/bordereaux', [CommissionController::class, 'bordereaux']);
    Route::post('/bordereaux', [CommissionController::class, 'genererBordereau']);
    Route::get('/bordereaux/{bordereau}', [CommissionController::class, 'showBordereau']);
    Route::post('/bordereaux/{bordereau}/valider', [CommissionController::class, 'validerBordereau']);
    Route::post('/bordereaux/{bordereau}/publier', [CommissionController::class, 'publierBordereau']);
    Route::get('/bordereaux/{bordereau}/pdf', [CommissionController::class, 'pdfBordereau']);
    Route::get('/bordereaux/{bordereau}/csv', [CommissionController::class, 'csvBordereau']);
    Route::post('/bordereaux/{bordereau}/paiement', [CommissionController::class, 'declarerPaiement']);

    // Module 5 — Documents (GED)
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']); // upload multipart
    Route::get('/documents/{document}', [DocumentController::class, 'show']);
    Route::get('/documents/{document}/url', [DocumentController::class, 'urlSignee']); // RG-51
    Route::post('/documents/{document}/valider', [DocumentController::class, 'valider']);
    Route::post('/documents/{document}/refuser', [DocumentController::class, 'refuser']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']); // RG-55

    // Module 5 — Conversations
    Route::get('/conversations/{type}/{id}', [ConversationController::class, 'show']);
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'posterMessage']);

    // Messageries non référencées (colonne droite du tableau de bord)
    Route::get('/messageries', [MessagerieController::class, 'index']);
    Route::post('/messageries', [MessagerieController::class, 'store']);

    // Réseaux sociaux non référencés (colonne droite du tableau de bord)
    Route::get('/reseaux-sociaux', [ReseauSocialController::class, 'index']);
    Route::post('/reseaux-sociaux', [ReseauSocialController::class, 'store']);

    // Module 5 — E-mails
    Route::get('/emails', [EmailController::class, 'index']);
    Route::post('/emails', [EmailController::class, 'envoyer']);
    Route::get('/emails/attachements-possibles', [EmailController::class, 'attachementsPossibles']);
    Route::post('/emails/{email}/rattacher', [EmailController::class, 'rattacher']);

    // Module 6 — Back-office / partenaires / utilisateurs
    Route::get('/fournisseurs', [FournisseurController::class, 'index']);
    Route::post('/fournisseurs', [FournisseurController::class, 'store']);
    Route::post('/fournisseurs/{fournisseur}/informations', [FournisseurController::class, 'updateInformations']);
    Route::post('/fournisseurs/{fournisseur}/devenir-partenaire', [FournisseurController::class, 'togglePartenaire']);
    Route::post('/fournisseurs/{fournisseur}/activer', [FournisseurController::class, 'activer']);

    // Demandes d'inscription partenaire (liées au formulaire du login)
    Route::get('/demandes-inscriptions', [DemandeInscriptionPartenaireController::class, 'index']);
    Route::post('/demandes-inscriptions/{demande}/approuver', [DemandeInscriptionPartenaireController::class, 'approuver']);
    Route::post('/demandes-inscriptions/{demande}/refuser', [DemandeInscriptionPartenaireController::class, 'refuser']);

    Route::get('/partenaires', [PartenaireController::class, 'index']);
    Route::post('/partenaires', [PartenaireController::class, 'candidature']); // F-600
    Route::get('/partenaires/{partenaire}', [PartenaireController::class, 'show']);
    Route::post('/partenaires/{partenaire}/valider', [PartenaireController::class, 'valider']); // F-601/602
    Route::post('/partenaires/{partenaire}/refuser', [PartenaireController::class, 'refuser']); // F-602 refus
    Route::post('/partenaires/{partenaire}/suspendre', [PartenaireController::class, 'suspendre']);
    Route::post('/partenaires/{partenaire}/reactiver', [PartenaireController::class, 'reactiver']);
    Route::post('/partenaires/{partenaire}/baremes', [PartenaireController::class, 'creerBareme']); // F-400
    Route::put('/partenaires/{partenaire}/pieces/{piece}', [PartenaireController::class, 'controlePiece']); // RG-60

    Route::get('/utilisateurs', [UserController::class, 'index']);
    Route::post('/utilisateurs', [UserController::class, 'store']);
    Route::patch('/utilisateurs/{user}', [UserController::class, 'update']);
    Route::delete('/utilisateurs/{user}', [UserController::class, 'destroy']);

    // Journal d'audit
    Route::get('/audit', [AuditController::class, 'index']);
    Route::get('/audit/export', [AuditController::class, 'export']);

    // Export RGPD (F-608)
    Route::get('/rgpd/export', [UserController::class, 'exportRgpd']);
});
