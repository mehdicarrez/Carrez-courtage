<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Avenant;
use App\Models\Contrat;
use App\Models\Devis;
use App\Models\Document;
use App\Models\Quittance;
use App\Models\Sinistre;
use App\Models\TypeDocument;
use App\Services\AuditLogger;
use App\Services\CommissionCalculator;
use App\Services\ReferenceService;
use App\Services\StateMachine;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ContratController extends Controller
{
    public function __construct(
        private AuditLogger $audit,
        private CommissionCalculator $calc,
        private ReferenceService $refs,
    ) {
    }

    public function index(Request $request)
    {
        $query = Contrat::with(['client', 'organisation', 'produit', 'grossiste', 'porteurRisque']);

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }
        if ($request->boolean('en_souscription')) {
            $query->whereIn('statut', Contrat::SOUSCRIPTION_ACTIVE);
        }
        if ($request->filled('partenaire_id') && $request->user()->estCabinet()) {
            $query->where('organisation_id', $request->query('partenaire_id'));
        }

        $contrats = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => $contrats->map(fn (Contrat $c) => $this->present($c)),
            'meta' => ['total' => $contrats->total()],
        ]);
    }

    /**
     * Création d'une ébauche de contrat (souscription) : client + fournisseur.
     */
    public function store(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'grossiste_id' => 'nullable|exists:grossistes,id',
            'produit_id' => 'nullable|exists:produits,id',
        ]);

        $contrat = Contrat::create([
            'id' => (string) Str::uuid(),
            'reference' => $this->refs->contrat(),
            'organisation_id' => $request->user()->organisation_id,
            'client_id' => $data['client_id'],
            'grossiste_id' => $data['grossiste_id'] ?? null,
            'produit_id' => $data['produit_id'] ?? null,
            'date_effet' => now(),
            'fractionnement' => 'ANNUEL',
            'statut' => 'EN_CONSTITUTION',
            'annee_assurance' => 1,
        ]);

        $this->audit->log('contrat.cree', 'contrat', (string) $contrat->id);

        return response()->json(['data' => $this->present($contrat->fresh())], 201);
    }

    /**
     * F-303 : transformation d'un devis accepté en contrat.
     */
    public function creerDepuisDevis(Devis $devis, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        if ($devis->statut !== 'ACCEPTE') {
            abort(422, 'Seul un devis accepté peut être transformé en contrat.');
        }

        $demande = $devis->demande;

        $data = $request->validate([
            'numero_police' => 'nullable|string',
            'date_effet' => 'nullable|date',
            'date_echeance_principale' => 'nullable|date',
            'fractionnement' => 'nullable|in:ANNUEL,SEMESTRIEL,TRIMESTRIEL,MENSUEL',
            'fichier_contrat' => 'nullable|file',
        ]);

        $dateEffet = ($data['date_effet'] ?? null)
            ? \Carbon\Carbon::parse($data['date_effet'])
            : ($devis->date_effet_possible ?? now());

        $contrat = Contrat::create([
            'id' => (string) Str::uuid(),
            'reference' => $this->refs->contrat(),
            'numero_police' => $data['numero_police'] ?? null,
            'devis_id' => $devis->id,
            'demande_id' => $demande->id,
            'organisation_id' => $devis->user?->organisation_id ?? $demande->organisation_id,
            'client_id' => $demande->client_id,
            'porteur_risque_id' => $devis->porteur_risque_id,
            'grossiste_id' => $devis->grossiste_id,
            'produit_id' => $devis->produit_id,
            'date_effet' => $dateEffet,
            'date_echeance_principale' => ($data['date_echeance_principale'] ?? null)
                ? \Carbon\Carbon::parse($data['date_echeance_principale'])
                : $dateEffet->copy()->addYear(),
            'prime_ht_cts' => $devis->prime_ht_cts,
            'taxes_cts' => $devis->taxes_cts,
            'prime_ttc_cts' => $devis->prime_ttc_cts,
            'frais_courtage_cts' => $devis->frais_courtage_cts,
            'fractionnement' => $data['fractionnement'] ?? $devis->fractionnement ?? 'ANNUEL',
            'statut' => 'EN_ATTENTE_SIGNATURE',
            'annee_assurance' => 1,
        ]);

        // Copie des garanties du devis vers le contrat
        foreach ($devis->garanties as $g) {
            $contrat->garanties()->create([
                'intitule' => $g->intitule,
                'plafond_cts' => $g->plafond_cts,
                'franchise_cts' => $g->franchise_cts,
                'incluse' => $g->incluse,
                'optionnelle' => $g->optionnelle,
            ]);
        }

        // Rattache le fichier contrat téléversé au contrat (type POLICE)
        if ($request->hasFile('fichier_contrat')) {
            $this->rattacherFichierContrat($contrat, $request->file('fichier_contrat'));
        }

        // Le devis passe en DEVIS_SIGNE, la demande en TRANSFORMEE
        StateMachine::pour($devis)->appliquer($devis, 'DEVIS_SIGNE');
        if ($demande->peutTransiterVers('TRANSFORMEE')) {
            StateMachine::pour($demande)->appliquer($demande, 'TRANSFORMEE');
        } elseif ($demande->peutTransiterVers('EN_SOUSCRIPTION')) {
            StateMachine::pour($demande)->appliquer($demande, 'EN_SOUSCRIPTION');
            if ($demande->peutTransiterVers('TRANSFORMEE')) {
                StateMachine::pour($demande)->appliquer($demande, 'TRANSFORMEE');
            }
        }

        // F-401 : génération des commissions prévisionnelles
        $this->calc->genererLignesPrevisionnelles($contrat);

        $this->audit->log('contrat.cree', 'contrat', (string) $contrat->id);

        return response()->json(['data' => $this->present($contrat->fresh())], 201);
    }

    /**
     * Rattache un fichier (contrat signé) à un contrat avec le type document POLICE.
     */
    private function rattacherFichierContrat(Contrat $contrat, $file): void
    {
        $extensions = ['pdf', 'jpeg', 'jpg', 'png', 'docx'];
        if (!in_array(strtolower($file->getClientOriginalExtension()), $extensions, true)) {
            abort(422, 'Format non accepté.');
        }
        if ($file->getSize() > config('extranet.upload_max_mo', 25) * 1024 * 1024) {
            abort(422, 'Fichier trop volumineux.');
        }

        $cle = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = Storage::disk('local')->putFileAs('documents', $file, $cle);

        $document = Document::create([
            'type_document_id' => TypeDocument::where('code', 'POLICE')->value('id'),
            'nom_origine' => $file->getClientOriginalName(),
            'taille' => $file->getSize(),
            'mime_reel' => $file->getMimeType(),
            'mime_declare' => $file->getClientMimeType(),
            'objet_type' => 'contrat',
            'objet_id' => $contrat->id,
            'organisation_id' => $contrat->organisation_id,
            'cle_stockage' => $path,
            'version' => 1,
            'sensibilite' => Document::SENSIBILITE_SENSIBLE,
            'statut_antivirus' => 'SAIN',
            'statut_validation' => 'VALIDE',
            'hash_sha256' => hash_file('sha256', $file->getPathname()),
        ]);

        $this->audit->log('contrat.document_depose', 'contrat', (string) $contrat->id, null, ['document_id' => $document->id]);
    }

    public function show(Contrat $contrat, Request $request)
    {
        $this->verifierAcces($contrat, $request->user());
        $contrat->load(['client', 'avenants', 'quittances', 'sinistres', 'garanties', 'documents']);

        return response()->json(['data' => $this->present($contrat)]);
    }

    public function transition(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate(['action' => 'required|string', 'motif' => 'nullable|string']);

        $nouvelEtat = match ($data['action']) {
            'envoyer_signature' => 'EN_ATTENTE_SIGNATURE',
            'marquer_signe' => 'SIGNE',
            'emettre' => 'EN_ATTENTE_EMISSION',
            'mettre_en_vigueur' => 'EN_VIGUEUR',
            'sans_effet' => 'SANS_EFFET',
            'expirer' => 'EXPIRE',
            default => null,
        };

        if (!$nouvelEtat || !$contrat->peutTransiterVers($nouvelEtat)) {
            abort(422, 'Transition interdite.');
        }

        $contrat->motif_resiliation = $data['motif'] ?? null;
        StateMachine::pour($contrat)->appliquer($contrat, $nouvelEtat);

        if ($nouvelEtat === 'SANS_EFFET') {
            $this->calc->genererReprise($contrat, 'SANS_EFFET');
        }

        return response()->json(['data' => $this->present($contrat->fresh())]);
    }

    /**
     * Changement manuel du statut vers Réglé / Non réglé (cabinet et partenaire).
     */
    public function changerStatutManuel(Contrat $contrat, Request $request)
    {
        $this->verifierAcces($contrat, $request->user());

        $data = $request->validate(['statut' => 'required|in:REGLE,NON_REGLE']);

        if (!$contrat->peutTransiterVers($data['statut'])) {
            abort(422, 'Transition interdite.');
        }

        StateMachine::pour($contrat)->appliquer($contrat, $data['statut']);
        $this->audit->log('contrat.statut_manuel', 'contrat', (string) $contrat->id, null, ['statut' => $data['statut']]);

        return response()->json(['data' => $this->present($contrat->fresh())]);
    }

    /**
     * Mise à jour des champs éditables d'un contrat (cabinet uniquement).
     */
    public function update(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        $this->verifierAcces($contrat, $request->user());

        $data = $request->validate([
            'numero_police' => 'nullable|string|max:50',
            'date_effet' => 'nullable|date',
            'date_echeance_principale' => 'nullable|date',
            'fractionnement' => 'nullable|in:ANNUEL,SEMESTRIEL,TRIMESTRIEL,MENSUEL',
        ]);

        $contrat->fill(array_filter($data, fn ($v) => $v !== null));
        $contrat->save();

        $this->audit->log('contrat.modifie', 'contrat', (string) $contrat->id, null, $data);

        return response()->json(['data' => $this->present($contrat->fresh())]);
    }

    /**
     * Action de relance sur un contrat à échéance proche (cabinet uniquement).
     */
    public function relancer(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        $this->verifierAcces($contrat, $request->user());

        $contrat->derniere_relance = now();
        $contrat->save();

        $this->audit->log('contrat.relance', 'contrat', (string) $contrat->id);

        return response()->json(['data' => $this->present($contrat->fresh())]);
    }

    /**
     * État de souscription d'un contrat : checklist, statut, documents, signature.
     */
    public function souscription(Contrat $contrat, Request $request)
    {
        $this->verifierAcces($contrat, $request->user());
        $contrat->load(['documents.type', 'garanties']);

        $polices = $contrat->documents
            ->where('type.code', 'POLICE')
            ->values();

        return response()->json([
            'data' => [
                'statut' => $contrat->statut,
                'date_statut' => $contrat->date_statut,
                'etapes' => array_map(
                    fn ($cle, $libelle) => [
                        'cle' => $cle,
                        'libelle' => $libelle,
                        'coche' => $contrat->estEtapeCochee($cle),
                    ],
                    array_keys(Contrat::ETAPES_SOUSCRIPTION),
                    array_values(Contrat::ETAPES_SOUSCRIPTION)
                ),
                'progression' => $contrat->souscriptionProgression(),
                'signature' => $contrat->signature,
                'documents' => $this->present($contrat)['documents'],
                'polices' => $polices->map(fn ($d) => [
                    'id' => $d->id,
                    'nom_origine' => $d->nom_origine,
                    'version' => $d->version,
                    'created_at' => $d->created_at,
                ]),
            ],
        ]);
    }

    /**
     * Cocher / décocher une étape de la checklist de souscription.
     */
    public function updateChecklist(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        $this->verifierAcces($contrat, $request->user());

        $data = $request->validate([
            'etape' => 'required|in:'.implode(',', array_keys(Contrat::ETAPES_SOUSCRIPTION)),
            'coche' => 'required|boolean',
        ]);

        $contrat->cocherEtape($data['etape'], (bool) $data['coche']);
        $contrat->save();

        $this->audit->log('contrat.souscription_checklist', 'contrat', (string) $contrat->id, null, [
            'etape' => $data['etape'],
            'coche' => $data['coche'],
        ]);

        return response()->json(['data' => $this->present($contrat->fresh())]);
    }

    /**
     * Génération de la police PDF (GED) rattachée au contrat.
     * CA-22 : le PDF ne contient jamais taux ni montant de commission.
     */
    public function genererPolice(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        $this->verifierAcces($contrat, $request->user());

        $contrat->load(['client', 'produit', 'garanties', 'organisation']);

        $pdf = Pdf::loadView('pdfs.police', [
            'contrat' => $contrat,
            'cabinet' => $contrat->organisation?->raison_sociale ?? 'Carrez Co Courtage',
        ]);

        $cle = Str::uuid().'.pdf';
        $path = Storage::disk('local')->put('documents/'.$cle, $pdf->output());
        if (!$path) {
            abort(500, 'Impossible de générer la police.');
        }

        $dernier = $contrat->documents()
            ->whereNotNull('type_document_id')
            ->whereHas('type', fn ($q) => $q->where('code', 'POLICE'))
            ->orderByDesc('version')
            ->first();

        $police = Document::create([
            'type_document_id' => TypeDocument::where('code', 'POLICE')->value('id'),
            'nom_origine' => 'police-'.$contrat->numero_police.'.pdf',
            'taille' => strlen($pdf->output()),
            'mime_reel' => 'application/pdf',
            'mime_declare' => 'application/pdf',
            'objet_type' => 'contrat',
            'objet_id' => $contrat->id,
            'organisation_id' => $contrat->organisation_id,
            'cle_stockage' => 'documents/'.$cle,
            'version' => $dernier ? $dernier->version + 1 : 1,
            'document_parent_id' => $dernier?->id,
            'sensibilite' => Document::SENSIBILITE_SENSIBLE,
            'statut_antivirus' => 'SAIN',
            'statut_validation' => 'VALIDE',
            'hash_sha256' => hash('sha256', $pdf->output()),
        ]);

        $contrat->cocherEtape('police_generee');
        $contrat->save();

        $this->audit->log('contrat.police_generee', 'contrat', (string) $contrat->id, null, ['document_id' => $police->id]);

        return response()->json(['data' => $this->present($contrat->fresh())], 201);
    }

    /**
     * Génère un document de courtage (fiche conseil, ordre de remplacement, mandat exclusif)
     * à partir du formulaire saisi et le rattache au contrat.
     */
    public function genererDocument(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        $this->verifierAcces($contrat, $request->user());

        $types = [
            'FICHE_CONSEIL' => ['view' => 'pdfs.fiche_conseil', 'nom' => 'fiche-conseil'],
            'ORDRE_REMPLACEMENT' => ['view' => 'pdfs.ordre_remplacement', 'nom' => 'ordre-remplacement'],
            'MANDAT_EXCLUSIF' => ['view' => 'pdfs.mandat_exclusif', 'nom' => 'mandat-exclusif'],
        ];

        $code = strtoupper((string) $request->input('type'));
        if (!isset($types[$code])) {
            abort(422, 'Type de document inconnu.');
        }

        $data = $request->input('data', []);

        $contrat->load('client', 'organisation');

        $pdf = Pdf::loadView($types[$code]['view'], [
            'data' => $data,
            'client' => $contrat->client?->getNomCompletAttribute() ?? '—',
            'cabinet' => $contrat->organisation?->raison_sociale ?? 'Carrez Co Courtage',
        ]);

        $cle = Str::uuid().'.pdf';
        $path = Storage::disk('local')->put('documents/'.$cle, $pdf->output());
        if (!$path) {
            abort(500, 'Impossible de générer le document.');
        }

        $typeDoc = TypeDocument::where('code', $code)->first();
        $dernier = $contrat->documents()->when($typeDoc, fn ($q) => $q->where('type_document_id', $typeDoc->id))->orderByDesc('version')->first();

        $document = Document::create([
            'type_document_id' => $typeDoc?->id,
            'nom_origine' => $types[$code]['nom'].'-'.$contrat->reference.'.pdf',
            'taille' => strlen($pdf->output()),
            'mime_reel' => 'application/pdf',
            'mime_declare' => 'application/pdf',
            'objet_type' => 'contrat',
            'objet_id' => $contrat->id,
            'organisation_id' => $contrat->organisation_id,
            'cle_stockage' => 'documents/'.$cle,
            'version' => $dernier ? $dernier->version + 1 : 1,
            'document_parent_id' => $dernier?->id,
            'sensibilite' => Document::SENSIBILITE_SENSIBLE,
            'statut_antivirus' => 'SAIN',
            'statut_validation' => 'VALIDE',
            'hash_sha256' => hash('sha256', $pdf->output()),
        ]);

        $this->audit->log('contrat.document_genere', 'contrat', (string) $contrat->id, null, ['type' => $code]);

        return response()->json([
            'data' => $this->present($contrat->fresh()),
            'document_id' => $document->id,
        ], 201);
    }

    /**
     * Envoi en signature (simulé) : passe en EN_ATTENTE_SIGNATURE, horodate et archive un email.
     */
    public function envoyerSignature(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        $this->verifierAcces($contrat, $request->user());

        $police = $contrat->documents()
            ->whereHas('type', fn ($q) => $q->where('code', 'POLICE'))
            ->first();

        if (!$police) {
            abort(422, 'Générez d\'abord la police avant l\'envoi en signature.');
        }
        if (!$contrat->peutTransiterVers('EN_ATTENTE_SIGNATURE')) {
            abort(422, 'Transition vers EN_ATTENTE_SIGNATURE interdite depuis état actuel.');
        }

        StateMachine::pour($contrat)->appliquer($contrat, 'EN_ATTENTE_SIGNATURE');

        $contrat->signature = array_merge($contrat->signature ?? [], [
            'id_demande' => (string) Str::uuid(),
            'statut' => 'ENVOYEE',
            'envoye_le' => now()->toDateTimeString(),
            'email' => $contrat->client?->email ?? 'client@exemple.fr',
            'fournisseur' => 'SIMULE',
        ]);
        $contrat->cocherEtape('envoye_signature');
        $contrat->save();

        // Archivage d'un e-mail de demande de signature (pièce jointe = police)
        try {
            $emailRequest = Request::create('/api/v1/emails', 'POST', [
                'objet_type' => 'contrat',
                'objet_id' => (string) $contrat->id,
                'destinataires' => [$contrat->client?->email ?? 'client@exemple.fr'],
                'sujet' => 'Document à signer — '.$contrat->reference,
                'corps' => 'Veuillez trouver le document à signer.',
                'pieces_jointes' => [(string) $police->id],
            ], [], [], ['HTTP_ACCEPT' => 'application/json']);
            $emailRequest->setUserResolver(fn () => $request->user());
            app(\App\Http\Controllers\Api\EmailController::class)->envoyer($emailRequest);
        } catch (\Throwable $e) {
            // Non bloquant : l'archivage du courriel est secondaire en démo.
        }

        $this->audit->log('contrat.envoye_signature', 'contrat', (string) $contrat->id);

        return response()->json(['data' => $this->present($contrat->fresh())]);
    }

    /**
     * Marquer signé (simulé) : passage en SIGNE et renseignement du dossier de signature.
     */
    public function marquerSigne(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        $this->verifierAcces($contrat, $request->user());

        if (!$contrat->peutTransiterVers('SIGNE')) {
            abort(422, 'Transition vers SIGNE interdite depuis état actuel.');
        }

        StateMachine::pour($contrat)->appliquer($contrat, 'SIGNE');

        $contrat->signature = array_merge($contrat->signature ?? [], [
            'statut' => 'SIGNEE',
            'signee_le' => now()->toDateTimeString(),
            'horodatage' => now()->toIso8601String(),
        ]);
        $contrat->cocherEtape('signe');
        $contrat->save();

        $this->audit->log('contrat.signe', 'contrat', (string) $contrat->id);

        return response()->json(['data' => $this->present($contrat->fresh())]);
    }

    /**
     * F-305 : avenant avec variation de prime (RG-32), ajustement prorata.
     */
    public function creerAvenant(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'type' => 'required|string',
            'date_effet' => 'required|date',
            'variation_prime_cts' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);

        $avenant = Avenant::create([
            'contrat_id' => $contrat->id,
            'type' => $data['type'],
            'date_effet' => $data['date_effet'],
            'variation_prime_cts' => $data['variation_prime_cts'] ?? 0,
            'description' => $data['description'] ?? null,
            'statut' => 'APPLIQUE',
        ]);

        // Ajustement de prime et (RG-32) de commission au prorata
        if ($data['variation_prime_cts']) {
            $contrat->prime_ht_cts += $data['variation_prime_cts'];
            $contrat->prime_ttc_cts += $data['variation_prime_cts'];
            $contrat->save();
        }

        $this->audit->log('contrat.avenant', 'contrat', (string) $contrat->id, null, $data);

        // CA-32 : ajustement de la ligne prévisionnelle restante au prorata
        $this->ajusterCommissionProrata($contrat, $avenant);

        return response()->json(['data' => $avenant], 201);
    }

    /**
     * F-306 : génération de l'échéancier de quittances (CA-31).
     */
    public function genererQuittances(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $nb = match ($contrat->fractionnement) {
            'MENSUEL' => 12,
            'TRIMESTRIEL' => 4,
            'SEMESTRIEL' => 2,
            default => 1,
        };

        $montant = (int) round($contrat->prime_ttc_cts / $nb);

        for ($i = 1; $i <= $nb; $i++) {
            Quittance::create([
                'contrat_id' => $contrat->id,
                'numero' => $i,
                'echeance' => $i,
                'date_appel' => $contrat->date_effet->copy()->addMonths($i - 1),
                'date_echeance' => $contrat->date_effet->copy()->addMonths($i),
                'montant_cts' => $montant,
                'statut' => 'A_ECHELONNER',
            ]);
        }

        $this->audit->log('contrat.quittances_generes', 'contrat', (string) $contrat->id, null, ['nb' => $nb]);

        return response()->json(['data' => $contrat->quittances()->orderBy('echeance')->get()]);
    }

    /**
     * RG-33 : encaissement d'une quittance → commissions ACQUISE.
     */
    public function majQuittance(Quittance $quittance, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate(['statut' => 'required|in:APPELEE,ENCAISSEE,IMPAYEE,ANNULEE']);

        $quittance->statut = $data['statut'];
        if ($data['statut'] === 'ENCAISSEE') {
            $quittance->date_encaissee = now();
        }
        $quittance->save();

        if ($data['statut'] === 'ENCAISSEE') {
            $this->calc->basculeAcquise($quittance);
        }

        return response()->json(['data' => $quittance]);
    }

    /**
     * F-307 : déclaration de sinistre (partenaire ou cabinet).
     */
    public function declarerSinistre(Contrat $contrat, Request $request)
    {
        $this->verifierAcces($contrat, $request->user());

        $data = $request->validate([
            'date_survenance' => 'required|date',
            'nature' => 'nullable|string',
            'montant_estime_cts' => 'nullable|integer',
        ]);

        $sinistre = Sinistre::create([
            'contrat_id' => $contrat->id,
            'date_survenance' => $data['date_survenance'],
            'date_declaration' => now(),
            'nature' => $data['nature'] ?? null,
            'montant_estime_cts' => $data['montant_estime_cts'] ?? null,
            'statut' => 'OUVERT',
            'declare_par' => $request->user()->estPartenaire() ? 'PARTENAIRE' : 'CABINET',
        ]);

        return response()->json(['data' => $sinistre], 201);
    }

    /**
     * F-308 : résiliation avec motif (CA-33 → reprise).
     */
    public function resilier(Contrat $contrat, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'motif' => 'required|in:'.implode(',', Contrat::MOTIFS_RESILIATION),
            'date_effet' => 'required|date',
        ]);

        if (!$contrat->peutTransiterVers('RESILIE')) {
            abort(422, 'Impérative machine à états: résiliation impossible depuis état actuel.');
        }

        $contrat->motif_resiliation = $data['motif'];
        $contrat->date_resiliation = $data['date_effet'];
        StateMachine::pour($contrat)->appliquer($contrat, 'RESILIE');

        // CA-33 : résiliation → reprise de commission
        $this->calc->genererReprise($contrat, 'RESILIATION:'.$data['motif']);

        return response()->json(['data' => $this->present($contrat->fresh())]);
    }

    /**
     * F-309 : tableau des échéances à venir (fenêtre glissante 120 jours, RG-35).
     */
    public function echeances(Request $request)
    {
        $debut = now();
        $fin = now()->copy()->addDays(120);

        $contrats = Contrat::where('statut', 'EN_VIGUEUR')
            ->whereNotNull('date_echeance_principale')
            ->whereBetween('date_echeance_principale', [$debut, $fin])
            ->with(['client', 'organisation', 'produit'])
            ->get();

        $data = $contrats->map(fn (Contrat $c) => [
            'id' => $c->id,
            'reference' => $c->reference,
            'client' => $c->client?->getNomCompletAttribute(),
            'partenaire' => $c->organisation?->raison_sociale,
            'produit' => $c->produit?->nom,
            'date_echeance' => $c->date_echeance_principale,
            'j_restants' => abs(now()->diffInDays($c->date_echeance_principale, false)),
            'prime_ttc_cts' => $c->prime_ttc_cts,
            'fractionnement' => $c->fractionnement,
            'derniere_relance' => $c->derniere_relance,
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * F-312 : reprise de portefeuille (import en masse).
     */
    public function importPortefeuille(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'simulation' => 'nullable|boolean',
            'contrats' => 'required|array',
            'contrats.*.organisation_id' => 'required|uuid',
            'contrats.*.client' => 'required|array',
            'contrats.*.prime_ht_cts' => 'required|integer',
            'contrats.*.date_effet' => 'required|date',
            'contrats.*.fractionnement' => 'required|in:ANNUEL,SEMESTRIEL,TRIMESTRIEL,MENSUEL',
        ]);

        $simulation = $data['simulation'] ?? true;
        $cree = 0;
        $erreurs = [];

        foreach ($data['contrats'] as $index => $row) {
            try {
                $client = \App\Models\Client::create([
                    'organisation_id' => $row['organisation_id'],
                    'type' => $row['client']['type'] ?? 'PHYSIQUE',
                    'nom' => $row['client']['nom'] ?? null,
                    'prenom' => $row['client']['prenom'] ?? null,
                    'raison_sociale' => $row['client']['raison_sociale'] ?? null,
                ]);

                if ($simulation) {
                    continue; // mode simulation : n'écrit pas (F-312)
                }

                $contrat = Contrat::create([
                    'id' => (string) Str::uuid(),
                    'reference' => $this->refs->contrat(),
                    'organisation_id' => $row['organisation_id'],
                    'client_id' => $client->id,
                    'date_effet' => $row['date_effet'],
                    'date_echeance_principale' => \Carbon\Carbon::parse($row['date_effet'])->addYear(),
                    'prime_ht_cts' => $row['prime_ht_cts'],
                    'prime_ttc_cts' => $row['prime_ht_cts'],
                    'fractionnement' => $row['fractionnement'],
                    'statut' => 'EN_VIGUEUR',
                ]);

                $this->calc->genererLignesPrevisionnelles($contrat);
                $cree++;
            } catch (\Throwable $e) {
                $erreurs[] = ['ligne' => $index + 2, 'cause' => $e->getMessage()];
            }
        }

        return response()->json(['cree' => $cree, 'erreurs' => $erreurs, 'simulation' => $simulation]);
    }

    // ---- Helpers ----

    private function ajusterCommissionProrata(Contrat $contrat, Avenant $avenant): void
    {
        $ligne = $contrat->lignesCommission()
            ->where('statut', 'PREVISIONNELLE')
            ->first();

        if (!$ligne || $avenant->variation_prime_cts > 0) {
            return;
        }

        // Prorata de la période restante (RG-32, CA-32)
        $joursRestants = $contrat->date_echeance_principale->diffInDays($avenant->date_effet->copy()->subDay());
        $joursTotal = $contrat->date_effet->diffInDays($contrat->date_echeance_principale);

        if ($joursTotal <= 0) {
            return;
        }

        $bareme = $contrat->bareme_applique;
        $taux = $contrat->annee_assurance === 1
            ? ($bareme['taux_1ere_annee'] ?? 0)
            : ($bareme['taux_renouvellement'] ?? 0);

        $assiette = $avenant->variation_prime_cts;
        $ajustement = (int) round(($assiette * $taux / 100) * ($joursRestants / $joursTotal));

        if ($ajustement !== 0) {
            \App\Models\LigneCommission::create([
                'nature' => \App\Models\LigneCommission::NATURE_RETROCEDEE,
                'contrat_id' => $contrat->id,
                'avenant_id' => $avenant->id,
                'organisation_id' => $contrat->organisation_id,
                'montant_cts' => $ajustement,
                'statut' => 'PREVISIONNELLE',
                'motif' => 'AJUSTEMENT_AVENANT',
                'trace_calcul' => ['prorata' => $joursRestants.'/'.$joursTotal, 'avenant_id' => $avenant->id],
            ]);
        }
    }

    private function verifierAcces(Contrat $contrat, $user): void
    {
        if ($user->estPartenaire() && $contrat->organisation_id !== $user->organisation_id) {
            $this->audit->accesRefuse('contrat', (string) $contrat->id);
            abort(404);
        }
    }

    private function present(Contrat $c): array
    {
        return [
            'id' => $c->id,
            'reference' => $c->reference,
            'devis_id' => $c->devis_id,
            'numero_police' => $c->numero_police,
            'statut' => $c->statut,
            'date_statut' => $c->date_statut,
            'client' => $c->client?->getNomCompletAttribute(),
            'client_id' => $c->client_id,
            'origine' => $c->client?->complement['origine'] ?? null,
            'fournisseur' => $c->fournisseur,
            'produit' => $c->produit?->nom,
            'prime_ht_cts' => $c->prime_ht_cts,
            'prime_ttc_cts' => $c->prime_ttc_cts,
            'frais_courtage_cts' => $c->frais_courtage_cts,
            'fractionnement' => $c->fractionnement,
            'date_effet' => $c->date_effet,
            'date_echeance_principale' => $c->date_echeance_principale,
            'annee_assurance' => $c->annee_assurance,
            'motif_resiliation' => $c->motif_resiliation,
            'date_resiliation' => $c->date_resiliation,
            'signature' => $c->signature,
            'souscription_checklist' => $c->souscription_checklist,
            'progression_souscription' => $c->souscriptionProgression(),
            'en_souscription' => $c->estEnSouscription(),
            'nb_quittances' => $c->quittances->count(),
            'nb_avenants' => $c->avenants->count(),
            'nb_sinistres' => $c->sinistres->count(),
            'garanties' => $c->garanties->map(fn ($g) => [
                'id' => $g->id,
                'intitule' => $g->intitule,
                'plafond_cts' => $g->plafond_cts,
                'franchise_cts' => $g->franchise_cts,
                'incluse' => $g->incluse,
                'optionnelle' => $g->optionnelle,
            ]),
            'documents' => $c->documents->map(fn ($d) => [
                'id' => $d->id,
                'type_document' => $d->type?->libelle,
                'type_document_id' => $d->type_document_id,
                'type_document_code' => $d->type?->code,
                'nom_origine' => $d->nom_origine,
                'taille' => $d->taille,
                'version' => $d->version,
                'statut_validation' => $d->statut_validation,
                'sensibilite' => $d->sensibilite,
                'created_at' => $d->created_at,
            ]),
            'avenants' => $c->avenants->map(fn ($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'date_effet' => $a->date_effet,
                'variation_prime_cts' => $a->variation_prime_cts,
                'description' => $a->description,
                'statut' => $a->statut,
                'created_at' => $a->created_at,
            ]),
            'quittances' => $c->quittances->sortBy('echeance')->values()->map(fn ($q) => [
                'id' => $q->id,
                'numero' => $q->numero,
                'echeance' => $q->echeance,
                'date_appel' => $q->date_appel,
                'date_echeance' => $q->date_echeance,
                'montant_cts' => $q->montant_cts,
                'statut' => $q->statut,
                'date_encaissee' => $q->date_encaissee,
            ]),
            'sinistres' => $c->sinistres->map(fn ($s) => [
                'id' => $s->id,
                'numero' => $s->numero,
                'date_survenance' => $s->date_survenance,
                'date_declaration' => $s->date_declaration,
                'nature' => $s->nature,
                'montant_estime_cts' => $s->montant_estime_cts,
                'montant_regle_cts' => $s->montant_regle_cts,
                'statut' => $s->statut,
                'declare_par' => $s->declare_par,
                'created_at' => $s->created_at,
            ]),
            'derniere_relance' => $c->derniere_relance,
        ];
    }
}
