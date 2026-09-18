<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branche;
use App\Models\Client;
use App\Models\DemandeTarification;
use App\Models\Devis;
use App\Models\Document;
use App\Models\SchemaFormulaire;
use App\Models\User;
use App\Models\Vehicule;
use App\Services\AuditLogger;
use App\Services\DynamicFormValidator;
use App\Services\ReferenceService;
use App\Services\StateMachine;
use App\Services\YousignService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DemandeController extends Controller
{
    public function __construct(
        private ReferenceService $refs,
        private DynamicFormValidator $validator,
        private AuditLogger $audit,
        private YousignService $yousign,
    ) {
    }

    public function index(Request $request)
    {
        // Les partenaires voient toutes les demandes pour pouvoir créer des devis
        $query = DemandeTarification::withoutGlobalScope('organisation')
            ->with(['branche', 'client', 'gestionnaire', 'organisation'])
            ->withCount('devis')
            ->where('statut', '!=', 'BROUILLON');

        $user = $request->user();

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }
        if ($request->filled('branche_id')) {
            $query->where('branche_id', $request->query('branche_id'));
        }
        if ($request->filled('gestionnaire_id') && $user->estCabinet() && $request->query('gestionnaire_id') !== 'non_attribue') {
            $query->where('gestionnaire_id', $request->query('gestionnaire_id'));
        }
        // File d'attribution : demandes soumises non encore attribuées
        if ($request->boolean('sans_gestionnaire')) {
            $query->whereNull('gestionnaire_id')
                ->whereIn('statut', ['SOUMISE', 'EN_ETUDE', 'PIECES_MANQUANTES', 'DEVIS_EMIS']);
        }
        if ($request->filled('partenaire_id') && $user->estCabinet()) {
            $query->where('organisation_id', $request->query('partenaire_id'));
        }
        // Recherche libre
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('reference', 'like', "%{$q}%")
                    ->orWhereHas('client', fn ($c) => $c->where('nom', 'like', "%{$q}%")
                        ->orWhere('prenom', 'like', "%{$q}%")
                        ->orWhere('raison_sociale', 'like', "%{$q}%"));
            });
        }

        // Tri
        $sort = $request->query('sort', 'recent');
        if ($sort === 'ancien') {
            // Ancienneté : les demandes les plus anciennes (non traitées) en premier
            $query->orderBy('date_statut')->orderBy('created_at');
        } else {
            $query->orderByDesc('created_at');
        }
        $demandes = $query->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => $demandes->map(fn (DemandeTarification $d) => $this->present($d)),
            'meta' => ['total' => $demandes->total(), 'per_page' => $demandes->perPage()],
        ]);
    }

    public function store(Request $request)
    {
        // RG-10 : sélection d'une branche, schéma dynamique
        $data = $request->validate([
            'branche_id' => 'required|exists:branches,id',
            'client' => 'required|array',
            'donnees_risque' => 'nullable|array',
            'mode_intervention' => 'nullable|in:DISTRIBUTEUR_COURTIER,APPORTEUR',
            'produit_ids' => 'nullable|array',
            'produit_ids.*' => 'exists:produits,id',
            'fournisseurs_plateforme' => 'nullable|array',
            'fournisseurs_plateforme.*' => 'exists:grossistes,id',
            'mes_fournisseurs' => 'nullable|array',
            'mes_fournisseurs.*' => 'string|max:255',
        ]);

        $branche = Branche::findOrFail($data['branche_id']);
        $schema = $branche->schemaCourant;

        if (!$schema) {
            abort(422, 'Aucun schéma de formulaire disponible pour cette branche.');
        }

        // RG-15 : les champs stockés proviennent de $donnees_risque validés côté back
        $this->validator->valider($schema->schema, $data['donnees_risque'] ?? []);

        $client = $this->creerOuRattacherClient($request->user(), $data['client']);

        $donneesRisque = $data['donnees_risque'] ?? [];
        if (isset($data['mode_intervention'])) {
            $donneesRisque['mode_intervention'] = $data['mode_intervention'];
        }
        if (isset($data['produit_ids'])) {
            $donneesRisque['produit_ids'] = $data['produit_ids'];
        }
        if (isset($data['fournisseurs_plateforme'])) {
            $donneesRisque['fournisseurs_plateforme'] = array_values(array_unique($data['fournisseurs_plateforme']));
        }
        if (isset($data['mes_fournisseurs'])) {
            $donneesRisque['mes_fournisseurs'] = array_values(array_filter(array_map('trim', $data['mes_fournisseurs'])));
        }

        $demande = DemandeTarification::create([
            'id' => (string) Str::uuid(),
            'reference' => $this->refs->demande(),
            'organisation_id' => $request->user()->organisation_id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => $schema->version,
            'client_id' => $client->id,
            'donnees_risque' => $donneesRisque,
            'statut' => 'BROUILLON',
            'date_statut' => now(),
            'origine' => $request->user()->estPartenaire() ? 'PARTENAIRE' : 'CABINET',
        ]);

        $this->audit->log('demande.creee', 'demande_tarification', $demande->id);

        return response()->json(['data' => $this->present($demande)], 201);
    }

    public function show($id, Request $request)
    {
        // Les partenaires voient toutes les demandes
        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);
        $demande->load(['branche', 'client', 'gestionnaire', 'vehicules', 'devis' => fn ($q) => $q->with(['garanties', 'user.organisation']), 'contrats', 'documents' => fn ($q) => $q->with('type')->where('supprime_logiquement', false)->latest()]);
        $demande->loadCount('devis');

        $sensible = $this->estDonneesSensibles($demande) && !$this->userHabiliteSante($request->user());
        $data = $this->present($demande);

        if ($sensible) {
            // RG-13 : le questionnaire de santé n'est pas visible des non-habilités
            $data['donnees_risque'] = null;
        }

        $data['documents'] = $demande->documents->map(fn ($doc) => [
            'id' => $doc->id,
            'type_document' => $doc->type?->libelle,
            'type_document_id' => $doc->type_document_id,
            'nom_origine' => $doc->nom_origine,
            'taille' => $doc->taille,
            'creation' => $doc->created_at,
            'statut_validation' => $doc->statut_validation,
        ])->values();

        // RG-01 bis : un partenaire ne voit que les devis qu'il a proposés
        $devis = $demande->devis;
        if ($request->user()->estPartenaire()) {
            $devis = $devis->where('user_id', $request->user()->id);
        }

        $data['devis'] = $devis->map(fn (Devis $d) => [
            'id' => $d->id,
            'version' => $d->version,
            'statut' => $d->statut,
            'est_expire' => $d->estExpire(),
            'prime_ttc_cts' => $d->prime_ttc_cts,
            'date_effet_possible' => $d->date_effet_possible,
            'date_validite' => $d->date_validite,
            'created_at' => $d->created_at,
            'propose_par' => $d->user?->organisation ? [
                'organisation_id' => $d->user->organisation->id,
                'nom' => $d->user->organisation->raison_sociale,
            ] : null,
            'garanties' => $d->garanties?->map(fn ($g) => [
                'intitule' => $g->intitule,
                'plafond_cts' => $g->plafond_cts,
                'franchise_cts' => $g->franchise_cts,
                'incluse' => $g->incluse,
                'optionnelle' => $g->optionnelle,
                'prix_option_cts' => $g->prix_option_cts,
            ])->values() ?? [],
        ])->values();

        return response()->json(['data' => $data]);
    }

    /**
     * Modification : brouillon uniquement (RG-15).
     */
    public function update($id, Request $request)
    {
        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);

        if ($demande->statut !== 'BROUILLON') {
            abort(422, 'Une demande soumise n\'est plus modifiable par le partenaire.');
        }

        $this->autoriserEcriture($request->user(), $demande);

        $data = $request->validate([
            'branche_id' => 'nullable|exists:branches,id',
            'client' => 'nullable|array',
            'donnees_risque' => 'nullable|array',
            'mode_intervention' => 'nullable|in:DISTRIBUTEUR_COURTIER,APPORTEUR',
            'produit_ids' => 'nullable|array',
            'produit_ids.*' => 'exists:produits,id',
            'fournisseurs_plateforme' => 'nullable|array',
            'fournisseurs_plateforme.*' => 'exists:grossistes,id',
            'mes_fournisseurs' => 'nullable|array',
            'mes_fournisseurs.*' => 'string|max:255',
        ]);

        // Changement de branche : charge le schéma courant associé
        if (isset($data['branche_id']) && (string) $data['branche_id'] !== (string) $demande->branche_id) {
            $branche = Branche::findOrFail($data['branche_id']);
            $schema = $branche->schemaCourant;
            if (!$schema) {
                abort(422, 'Aucun schéma de formulaire disponible pour cette branche.');
            }
            $demande->branche_id = $branche->id;
            $demande->schema_formulaire_version = $schema->version;
        }

        $schema = SchemaFormulaire::where('branche_id', $demande->branche_id)
            ->where('version', $demande->schema_formulaire_version)
            ->firstOrFail();

        $donneesRisque = $demande->donnees_risque ?? [];

        if (isset($data['donnees_risque'])) {
            $this->validator->valider($schema->schema, $data['donnees_risque']);
            $donneesRisque = $data['donnees_risque'];
        }
        if (isset($data['mode_intervention'])) {
            $donneesRisque['mode_intervention'] = $data['mode_intervention'];
        }
        if (isset($data['produit_ids'])) {
            $donneesRisque['produit_ids'] = $data['produit_ids'];
        }
        if (isset($data['fournisseurs_plateforme'])) {
            $donneesRisque['fournisseurs_plateforme'] = array_values(array_unique($data['fournisseurs_plateforme']));
        }
        if (isset($data['mes_fournisseurs'])) {
            $donneesRisque['mes_fournisseurs'] = array_values(array_filter(array_map('trim', $data['mes_fournisseurs'])));
        }

        $demande->donnees_risque = $donneesRisque;

        if (isset($data['client'])) {
            $client = $this->creerOuRattacherClient($request->user(), $data['client']);
            $demande->client_id = $client->id;
        }

        $demande->save();

        $this->audit->log('demande.modifiee', 'demande_tarification', $demande->id);

        return response()->json(['data' => $this->present($demande)]);
    }

    public function destroy($id, Request $request)
    {
        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);
        $this->autoriserEcriture($request->user(), $demande);
        $demande->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * RG-14 : machine à états côté serveur (soumettre, prise en charge, etc.).
     */
    public function transition($id, Request $request)
    {
        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);
        $this->autoriserEcriture($request->user(), $demande); // RG-01

        $data = $request->validate([
            'action' => 'required|string',
            'motif' => 'nullable|string',
        ]);

        $nouvelEtat = $this->resoudreTransition($data['action']);

        // RG-15 : contrôle de complétude bloquant à la soumission (F-103)
        if ($data['action'] === 'soumettre') {
            $schema = SchemaFormulaire::where('branche_id', $demande->branche_id)
                ->where('version', $demande->schema_formulaire_version)
                ->firstOrFail();
            $pieces = $demande->documents()->get()->map(fn ($d) => ['cle' => $d->type_document_id])->toArray();
            $manquantes = $this->validator->piecesManquantes($schema->schema, $pieces);

            if (count($manquantes) > 0) {
                return response()->json([
                    'message' => 'Pièces manquantes',
                    'pieces_manquantes' => $manquantes,
                ], 422);
            }
        }

        if ($nouvelEtat && in_array($nouvelEtat, ['NON_ELIGIBLE', 'SANS_SUITE'], true) && empty($data['motif'])) {
            throw ValidationException::withMessages(['motif' => ['Le motif est obligatoire.']]);
        }

        $demande->motif = $data['motif'] ?? $demande->motif;
        $nouvelEtat = StateMachine::pour($demande)->appliquer($demande, $nouvelEtat);

        // horodatages utiles au pilotage
        $this->majHorodatages($demande, $data['action']);

        return response()->json(['data' => $this->present($demande->fresh())]);
    }

    /**
     * Signature électronique (Yousign sandbox).
     * Crée une demande de signature, y dépose les documents sélectionnés,
     * ajoute le signataire puis active l'envoi.
     */
    public function signer($id, Request $request)
    {
        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);
        $this->autoriserEcriture($request->user(), $demande);

        $data = $request->validate([
            'email' => 'required|email',
            'mobile' => 'required|string|max:30',
            'message' => 'required|string|max:4000',
            'document_ids' => 'required|array|min:1',
            'document_ids.*' => 'integer|exists:documents,id',
        ]);

        // Documents autorisés : ceux rattachés à la demande OU à l'un de ses devis
        $idsDemande = $demande->documents()
            ->where('supprime_logiquement', false)
            ->pluck('documents.id');

        $idsDevis = \App\Models\Document::where('supprime_logiquement', false)
            ->whereIn('objet_id', $demande->devis()->pluck('devis.id'))
            ->where('objet_type', 'devis')
            ->pluck('id');

        $idsAutorises = $idsDemande->merge($idsDevis)->unique();

        $documents = \App\Models\Document::where('supprime_logiquement', false)
            ->whereIn('id', $idsAutorises)
            ->whereIn('id', $data['document_ids'])
            ->get();

        if ($documents->isEmpty()) {
            abort(422, 'Aucun document valide sélectionné pour la signature.');
        }

        try {
            $resultat = $this->yousign->envoyerSignature($documents->all(), [
                'email' => $data['email'],
                'mobile' => $data['mobile'],
                'message' => $data['message'],
                'first_name' => $demande->client?->prenom,
                'last_name' => $demande->client?->nom,
            ]);
        } catch (\Throwable $e) {
            $this->audit->log('signature.echec', 'demande_tarification', (string) $demande->id, null, ['erreur' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de l\'envoi pour signature.', 'detail' => $e->getMessage()], 502);
        }

        $this->audit->log('signature.envoyee', 'demande_tarification', (string) $demande->id, null, [
            'yousign_id' => $resultat['id'] ?? null,
        ]);

        return response()->json(['data' => $resultat]);
    }

    /**
     * Duplication d'une demande : copie en statut BROUILLON avec une nouvelle référence.
     */
    public function dupliquer($id, Request $request)
    {
        abort_unless($request->user()->estCabinet(), 403, 'Seul le cabinet peut dupliquer une demande.');

        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);

        $nouvelle = DemandeTarification::create([
            'id' => (string) Str::uuid(),
            'reference' => $this->refs->demande(),
            'organisation_id' => $demande->organisation_id,
            'branche_id' => $demande->branche_id,
            'schema_formulaire_version' => $demande->schema_formulaire_version,
            'client_id' => $demande->client_id,
            'donnees_risque' => $demande->donnees_risque,
            'statut' => 'BROUILLON',
            'date_statut' => now(),
            'origine' => $demande->origine,
        ]);

        $this->audit->log('demande.dupliquee', 'demande_tarification', (string) $nouvelle->id, null, ['source' => $demande->reference]);

        return response()->json(['data' => $this->present($nouvelle)], 201);
    }

    /**
     * Enregistrement de précisions libres sur la demande (colonne motif).
     */
    public function precision($id, Request $request)
    {
        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);
        $this->autoriserEcriture($request->user(), $demande);

        $data = $request->validate([
            'precision' => 'nullable|string|max:5000',
        ]);

        $demande->motif = trim($data['precision'] ?? '');
        $demande->save();

        $this->audit->log('demande.precision', 'demande_tarification', (string) $demande->id, null, [
            'precision' => Str::limit($demande->motif, 200),
        ]);

        return response()->json(['data' => $this->present($demande)]);
    }

    /**
     * F-104 : import de parc véhicules (flottes) avec rapport d'erreurs.
     */
    public function importParc($id, Request $request)
    {
        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);
        $this->autoriserEcriture($request->user(), $demande);

        $data = $request->validate([
            'vehicules' => 'required|array',
            'vehicules.*.immatriculation' => 'required_without:vehicules.*.marque|string',
            'vehicules.*.marque' => 'nullable|string',
            'vehicules.*.modele' => 'nullable|string',
            'vehicules.*.date_premiere_mise_circulation' => 'nullable|date',
            'vehicules.*.usage' => 'nullable|string',
        ]);

        $cree = 0;
        $erreurs = [];

        DB::transaction(function () use ($demande, $data, &$cree, &$erreurs) {
            foreach ($data['vehicules'] as $index => $ligne) {
                try {
                    Vehicule::create([
                        'demande_id' => $demande->id,
                        'immatriculation' => $ligne['immatriculation'] ?? null,
                        'marque' => $ligne['marque'] ?? null,
                        'modele' => $ligne['modele'] ?? null,
                        'date_premiere_mise_circulation' => $ligne['date_premiere_mise_circulation'] ?? null,
                        'usage' => $ligne['usage'] ?? null,
                        'donnees' => $ligne,
                        'ligne_import' => $index + 2,
                    ]);
                    $cree++;
                } catch (\Throwable $e) {
                    $erreurs[] = ['ligne' => $index + 2, 'cause' => $e->getMessage()];
                }
            }
        });

        return response()->json([
            'crees' => $cree,
            'erreurs' => $erreurs,
        ]);
    }

    /**
     * F-107 : demande de pièces complémentaires (parts en PIECES_MANQUANTES).
     */
    public function demanderPieces($id, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);

        $data = $request->validate([
            'pieces' => 'required|array',
            'message' => 'nullable|string',
        ]);

        if ($demande->peutTransiterVers('PIECES_MANQUANTES')) {
            StateMachine::pour($demande)->appliquer($demande, 'PIECES_MANQUANTES');
        }

        $this->audit->log('demande.pieces_demandees', 'demande_tarification', $demande->id, null, $data);

        return response()->json(['data' => $this->present($demande->fresh())]);
    }

    /**
     * F-106 : attribution d'une demande à un gestionnaire.
     */
    public function attribuer($id, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $demande = DemandeTarification::withoutGlobalScope('organisation')->findOrFail($id);

        $data = $request->validate(['gestionnaire_id' => 'required|exists:users,id']);

        $demande->gestionnaire_id = $data['gestionnaire_id'];

        if (!$demande->date_prise_en_charge && $demande->statut === 'SOUMISE') {
            $demande->date_prise_en_charge = now();
            StateMachine::pour($demande)->appliquer($demande, 'EN_ETUDE');
        }

        $demande->save();
        $this->audit->log('demande.attribuee', 'demande_tarification', $demande->id, null, ['gestionnaire' => $data['gestionnaire_id']]);

        return response()->json(['data' => $this->present($demande->fresh())]);
    }

    /**
     * F-105 : liste des gestionnaires (cabinet) pour le menu d'attribution.
     */
    public function gestionnaires(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $users = User::where('organisation_id', $request->user()->organisation_id)
            ->whereIn('role', ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER'])
            ->where('actif', true)
            ->orderBy('name')
            ->get(['id', 'name', 'role']);

        return response()->json(['data' => $users]);
    }

    /**
     * F-108 : attribution en masse de demandes à un gestionnaire.
     */
    public function attributionMassive(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'demande_ids' => 'required|array|min:1',
            'demande_ids.*' => 'required|uuid|exists:demandes_tarification,id',
            'gestionnaire_id' => 'required|exists:users,id',
        ]);

        $attribuees = 0;
        $demandes = DemandeTarification::whereIn('id', $data['demande_ids'])->get();

        foreach ($demandes as $demande) {
            $demande->gestionnaire_id = $data['gestionnaire_id'];
            if (!$demande->date_prise_en_charge && $demande->statut === 'SOUMISE') {
                $demande->date_prise_en_charge = now();
                StateMachine::pour($demande)->appliquer($demande, 'EN_ETUDE');
            }
            $demande->save();
            $attribuees++;
            $this->audit->log('demande.attribuee.masse', 'demande_tarification', $demande->id, null, ['gestionnaire' => $data['gestionnaire_id']]);
        }

        return response()->json(['attribuees' => $attribuees]);
    }

    // ---- Helpers ----

    private function resoudreTransition(string $action): ?string
    {
        return match ($action) {
            'soumettre' => 'SOUMISE',
            'prendre_en_charge' => 'EN_ETUDE',
            'pieces_requises' => 'PIECES_MANQUANTES',
            'pieces_recues' => 'EN_ETUDE',
            'non_eligible' => 'NON_ELIGIBLE',
            'sans_suite' => 'SANS_SUITE',
            'expirer' => 'EXPIREE',
            'souscrire' => 'EN_SOUSCRIPTION',
            'transformer' => 'TRANSFORMEE',
            default => null,
        };
    }

    private function majHorodatages(DemandeTarification $demande, string $action): void
    {
        if ($action === 'soumettre') {
            $demande->date_soumission = now();
        }
        if ($action === 'prendre_en_charge') {
            $demande->date_prise_en_charge = now();
        }
        $demande->save();
    }

    private function creerOuRattacherClient($user, array $data): Client
    {
        $type = ($data['type'] ?? 'PHYSIQUE') === 'MORALE' ? 'MORALE' : 'PHYSIQUE';

        $champsCompatibles = array_intersect_key($data, array_flip([
            'civilite', 'nom', 'prenom', 'date_naissance', 'raison_sociale',
            'siren', 'siret', 'email', 'telephone', 'adresse', 'code_postal', 'ville',
        ]));

        // Champs complémentaires stockés dans la colonne JSON `complement`
        $complement = array_filter([
            'personne_a_contacter' => $data['personne_a_contacter'] ?? null,
            'tel2' => $data['tel2'] ?? null,
            'email2' => $data['email2'] ?? null,
            'preference_contact' => $data['preference_contact'] ?? null,
            'forme_juridique' => $data['forme_juridique'] ?? null,
            'origine' => $data['origine'] ?? null,
            'rgpd_consentement' => isset($data['rgpd_consentement']) ? (bool) $data['rgpd_consentement'] : null,
            'exclure_marketing' => isset($data['exclure_marketing']) ? (bool) $data['exclure_marketing'] : null,
        ], fn ($v) => $v !== null && $v !== '');

        if (!empty($data['id'])) {
            $client = Client::findOrFail($data['id']);
            $client->fill($champsCompatibles);
            $complementExistant = $client->complement ?: [];
            $client->complement = array_merge($complementExistant, $complement);
            $client->save();
            return $client;
        }

        $champsCompatibles['organisation_id'] = $user->organisation_id;
        $champsCompatibles['type'] = $type;
        $champsCompatibles['complement'] = $complement;

        return Client::create($champsCompatibles);
    }

    private function autoriserEcriture($user, DemandeTarification $demande): void
    {
        // Les partenaires peuvent écrire sur toutes les demandes (pour créer des devis)
        // Seules les opérations sensibles (attribution, pièces manquantes) sont restreintes au cabinet via estCabinet()
    }

    private function estDonneesSensibles(DemandeTarification $demande): bool
    {
        return in_array($demande->branche?->code, ['sante', 'prevoyance'], true);
    }

    private function userHabiliteSante($user): bool
    {
        return $user->estCabinet() && in_array($user->role, ['ADMIN', 'CONSEILLER', 'GESTIONNAIRE'], true);
    }

    private function present(DemandeTarification $d): array
    {
        $ageJours = $d->created_at ? max(0, (int) $d->created_at->diffInDays(now())) : 0;

        $transitions = [];
        foreach (DemandeTarification::TRANSITIONS[$d->statut] ?? [] as $cible) {
            $action = match ($cible) {
                'SOUMISE' => 'soumettre',
                'EN_ETUDE' => 'prendre_en_charge',
                'PIECES_MANQUANTES' => 'pieces_requises',
                'DEVIS_EMIS' => null, // via devis controller
                'NON_ELIGIBLE' => 'non_eligible',
                'SANS_SUITE' => 'sans_suite',
                'EXPIREE' => 'expirer',
                'ACCEPTEE' => null, // via devis controller
                'EN_SOUSCRIPTION' => 'souscrire',
                'TRANSFORMEE' => 'transformer',
                default => null,
            };
            if ($action) {
                $transitions[] = ['action' => $action, 'cible' => $cible, 'motif_requis' => in_array($cible, ['NON_ELIGIBLE', 'SANS_SUITE'])];
            }
        }

        return [
            'id' => $d->id,
            'reference' => $d->reference,
            'statut' => $d->statut,
            'branche' => $d->branche?->nom,
            'branche_id' => $d->branche_id,
            'client' => $d->client?->getNomCompletAttribute(),
            'client_detail' => $this->presentClient($d->client),
            'gestionnaire' => $d->gestionnaire?->name,
            'gestionnaire_id' => $d->gestionnaire_id,
            'partenaire' => $d->organisation?->raison_sociale,
            'partenaire_id' => $d->organisation_id,
            'origine' => $d->origine,
            'date_soumission' => $d->date_soumission,
            'date_prise_en_charge' => $d->date_prise_en_charge,
            'date_statut' => $d->date_statut,
            'age_jours' => $ageJours,
            'donnees_risque' => $d->donnees_risque,
            'nb_devis' => $d->devis_count ?? 0,
            'created_at' => $d->created_at,
            'motif' => $d->motif,
            'transitions' => $transitions,
        ];
    }

    private function presentClient(?Client $client): ?array
    {
        if (!$client) {
            return null;
        }

        return [
            'id' => $client->id,
            'type' => $client->type,
            'civilite' => $client->civilite,
            'nom' => $client->nom,
            'prenom' => $client->prenom,
            'nom_complet' => $client->getNomCompletAttribute(),
            'date_naissance' => $client->date_naissance?->format('d/m/Y'),
            'raison_sociale' => $client->raison_sociale,
            'siren' => $client->siren,
            'siret' => $client->siret,
            'email' => $client->email,
            'telephone' => $client->telephone,
            'adresse' => $client->adresse,
            'code_postal' => $client->code_postal,
            'ville' => $client->ville,
            'personne_a_contacter' => $client->complement['personne_a_contacter'] ?? null,
            'tel2' => $client->complement['tel2'] ?? null,
            'email2' => $client->complement['email2'] ?? null,
            'preference_contact' => $client->complement['preference_contact'] ?? null,
            'forme_juridique' => $client->complement['forme_juridique'] ?? null,
            'origine' => $client->complement['origine'] ?? null,
            'rgpd_consentement' => $client->complement['rgpd_consentement'] ?? false,
            'exclure_marketing' => $client->complement['exclure_marketing'] ?? false,
        ];
    }
}
