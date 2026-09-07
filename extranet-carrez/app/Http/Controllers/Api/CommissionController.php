<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BaremeCommission;
use App\Models\Bordereau;
use App\Models\Contestation;
use App\Models\Contrat;
use App\Models\LigneCommission;
use App\Models\Organisation;
use App\Models\PaiementDeclare;
use App\Services\AuditLogger;
use App\Services\ReferenceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommissionController extends Controller
{
    public function __construct(private AuditLogger $audit, private ReferenceService $refs)
    {
    }

    /**
     * Liste des lignes de commission.
     * RG-03 : une organisation partenaire ne voit JAMAIS les lignes PERCUE.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = LigneCommission::with(['contrat', 'quittance']);

        if ($user->estPartenaire()) {
            $query->where('organisation_id', $user->organisation_id)
                ->where('nature', LigneCommission::NATURE_RETROCEDEE);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }
        if ($request->filled('contrat_id')) {
            $query->where('contrat_id', $request->query('contrat_id'));
        }

        $lignes = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 50));

        $data = $lignes->map(fn (LigneCommission $l) => $this->presentLigne($l, $user));

        return response()->json(['data' => $data, 'meta' => ['total' => $lignes->total()]]);
    }

    /**
     * F-404 : liste des commissions perçues (cabinet uniquement).
     */
    public function perques(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $lignes = LigneCommission::where('nature', LigneCommission::NATURE_PERQUE)
            ->with(['contrat.client', 'contrat.produit'])
            ->orderByDesc('created_at')->paginate(50);

        return response()->json(['data' => $lignes->map(fn ($l) => $this->presentLigne($l, $request->user()))]);
    }

    /**
     * F-404 : saisie d'une commission perçue (cabinet uniquement).
     */
    public function saisirPerque(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'contrat_id' => 'required|uuid|exists:contrats,id',
            'montant_cts' => 'required|integer',
            'periode_debut' => 'nullable|date',
            'periode_fin' => 'nullable|date',
            'commentaire' => 'nullable|string|max:500',
        ]);

        $ligne = LigneCommission::create([
            'nature' => LigneCommission::NATURE_PERQUE,
            'contrat_id' => $data['contrat_id'],
            'organisation_id' => $request->user()->organisation_id,
            'montant_cts' => $data['montant_cts'],
            'periode_debut' => $data['periode_debut'] ?? now(),
            'periode_fin' => $data['periode_fin'] ?? null,
            'motif' => $data['commentaire'] ?? null,
            'statut' => 'ACQUISE',
        ]);

        $this->audit->log('commission.percue.saisie', 'ligne_commission', (string) $ligne->id);

        return response()->json(['data' => $this->presentLigne($ligne, $request->user())], 201);
    }

    /**
     * Import CSV de commissions perçues (cabinet uniquement).
     */
    public function importCsv(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        if (!$handle) {
            abort(422, 'Impossible de lire le fichier.');
        }

        // Auto-detect separator: try ';' first, fall back to ','
        $firstLine = fgets($handle);
        $hasBom = $firstLine !== false && str_starts_with($firstLine, "\xEF\xBB\xBF");
        if ($hasBom) {
            $firstLineClean = substr($firstLine, 3);
        } else {
            $firstLineClean = $firstLine;
        }
        $sep = (substr_count($firstLineClean, ';') >= substr_count($firstLineClean, ',')) ? ';' : ',';
        rewind($handle);
        if ($hasBom) {
            fread($handle, 3); // skip BOM bytes
        }

        $header = fgetcsv($handle, 0, $sep);
        if (!$header || count($header) < 2) {
            abort(422, 'Fichier vide ou format invalide.');
        }

        $headerMap = array_map('trim', array_map('strtolower', $header));
        $crees = 0;
        $erreurs = [];
        $ligneNum = 1;

        while (($row = fgetcsv($handle, 0, $sep)) !== false) {
            $ligneNum++;
            $data = array_combine($headerMap, array_map('trim', $row));

            $ref = $data['contrat_reference'] ?? $data['reference'] ?? null;
            $montant = $data['montant_cts'] ?? $data['montant'] ?? null;

            if (!$ref || !$montant) {
                $erreurs[] = ['ligne' => $ligneNum, 'cause' => 'Reference ou montant manquant'];
                continue;
            }

            $contrat = Contrat::where('reference', $ref)->first();
            if (!$contrat) {
                $erreurs[] = ['ligne' => $ligneNum, 'cause' => "Contrat '$ref' introuvable"];
                continue;
            }

            LigneCommission::create([
                'nature' => LigneCommission::NATURE_PERQUE,
                'contrat_id' => $contrat->id,
                'organisation_id' => $request->user()->organisation_id,
                'montant_cts' => (int) $montant,
                'periode_debut' => $data['periode_debut'] ?? now()->toDateString(),
                'periode_fin' => $data['periode_fin'] ?? null,
                'statut' => 'ACQUISE',
            ]);
            $crees++;
        }

        fclose($handle);

        $this->audit->log('commission.percue.import_csv', 'ligne_commission', null, null, ['crees' => $crees, 'erreurs' => count($erreurs)]);

        return response()->json(['crees' => $crees, 'erreurs' => $erreurs]);
    }

    /**
     * Rapprochement : comparaison perçues vs rétrocédées par contrat (cabinet uniquement).
     */
    public function rapprochement(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $query = LigneCommission::select('contrat_id')
            ->selectRaw('SUM(CASE WHEN nature = ? THEN montant_cts ELSE 0 END) as total_percues', [LigneCommission::NATURE_PERQUE])
            ->selectRaw('SUM(CASE WHEN nature = ? THEN montant_cts ELSE 0 END) as total_retrocedees', [LigneCommission::NATURE_RETROCEDEE])
            ->groupBy('contrat_id')
            ->with('contrat.client', 'contrat.produit');

        if ($request->filled('periode_debut')) {
            $query->where('periode_debut', '>=', $request->query('periode_debut'));
        }
        if ($request->filled('periode_fin')) {
            $query->where('periode_fin', '<=', $request->query('periode_fin'));
        }

        $lignes = $query->get()->map(fn ($row) => [
            'contrat_id' => $row->contrat_id,
            'reference' => $row->contrat?->reference,
            'client' => $row->contrat?->client?->getNomCompletAttribute(),
            'produit' => $row->contrat?->produit?->nom,
            'total_percues' => $row->total_percues,
            'total_retrocedees' => $row->total_retrocedees,
            'ecart' => $row->total_percues - abs($row->total_retrocedees),
        ]);

        $totPercues = $lignes->sum('total_percues');
        $totRetro = $lignes->sum('total_retrocedees');

        return response()->json([
            'data' => $lignes,
            'totaux' => [
                'percues' => $totPercues,
                'retrocedees' => $totRetro,
                'ecart' => $totPercues - abs($totRetro),
            ],
        ]);
    }

    /**
     * F-409 : contestation d'une ligne par le partenaire.
     */
    public function contester(LigneCommission $ligne, Request $request)
    {
        if (!$request->user()->estPartenaire()) {
            abort(403);
        }

        $data = $request->validate(['message' => 'required|string|max:1000']);

        $contestation = Contestation::create([
            'ligne_commission_id' => $ligne->id,
            'auteur_id' => $request->user()->id,
            'message' => $data['message'],
            'statut' => 'OUVERTE',
        ]);

        $this->audit->log('commission.contestee', 'ligne_commission', (string) $ligne->id, null, ['contestation' => $contestation->id]);

        return response()->json(['data' => $contestation], 201);
    }

    /**
     * F-406 : génération d'un bordereau pour une période.
     */
    public function genererBordereau(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'organisation_id' => 'required|uuid|exists:organisations,id',
            'periode_debut' => 'required|date',
            'periode_fin' => 'required|date|after_or_equal:periode_debut',
        ]);

        $bordereau = DB::transaction(function () use ($data) {
            $lignes = LigneCommission::where('organisation_id', $data['organisation_id'])
                ->where('nature', LigneCommission::NATURE_RETROCEDEE)
                ->whereBetween('created_at', [$data['periode_debut'], $data['periode_fin']])
                ->whereIn('statut', ['ACQUISE', 'REPRISE', 'BORDEREE'])
                ->orderBy('created_at')
                ->get();

            $brut = $lignes->where('montant_cts', '>=', 0)->sum('montant_cts');
            $reprises = $lignes->where('montant_cts', '<', 0)->sum('montant_cts');

            $bordereau = Bordereau::create([
                'organisation_id' => $data['organisation_id'],
                'reference' => $this->refs->bordereau(),
                'periode_debut' => $data['periode_debut'],
                'periode_fin' => $data['periode_fin'],
                'statut' => 'A_VERIFIER',
                'total_brut_cts' => $brut,
                'total_reprises_cts' => abs($reprises),
                'net_a_payer_cts' => $brut + $reprises,
            ]);

            // RG-43 : au clôture, les lignes deviennent BORDEREE (immuables)
            $lignes->filter(fn ($l) => in_array($l->statut, ['ACQUISE', 'REPRISE'], true))
                ->each(fn ($l) => $l->forceFill(['statut' => 'BORDEREE', 'bordereau_id' => $bordereau->id])->save());

            $this->audit->log('bordereau.generé', 'bordereau', (string) $bordereau->id, null, ['net' => $bordereau->net_a_payer_cts]);

            return $bordereau;
        });

        return response()->json(['data' => $this->presentBordereau($bordereau)], 201);
    }

    public function showBordereau(Bordereau $bordereau, Request $request)
    {
        if ($request->user()->estPartenaire() && $bordereau->organisation_id !== $request->user()->organisation_id) {
            abort(404);
        }

        $bordereau->load(['lignes', 'paiements', 'organisation']);

        return response()->json([
            'data' => $this->presentBordereau($bordereau),
            'lignes' => $bordereau->lignes->map(fn ($l) => $this->presentLigne($l, $request->user())),
            'paiements' => $bordereau->paiements->map(fn ($p) => [
                'id' => $p->id,
                'date_paiement' => $p->date_paiement,
                'montant_cts' => $p->montant_cts,
                'reference' => $p->reference,
                'commentaire' => $p->commentaire,
            ]),
            'partenaire' => $bordereau->organisation?->raison_sociale,
        ]);
    }

    public function validerBordereau(Bordereau $bordereau, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        if (!$bordereau || $bordereau->statut !== 'A_VERIFIER') {
            abort(422, 'Bordereau non généré ou déjà traité.');
        }

        $bordereau->statut = 'VALIDE';
        $bordereau->save();
        $this->audit->log('bordereau.valide', 'bordereau', (string) $bordereau->id);

        return response()->json(['data' => $this->presentBordereau($bordereau)]);
    }

    public function publierBordereau(Bordereau $bordereau, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }
        if ($bordereau->statut !== 'VALIDE') {
            abort(422);
        }

        $bordereau->statut = 'PUBLIE';
        $bordereau->save();
        $this->audit->log('bordereau.publie', 'bordereau', (string) $bordereau->id);

        return response()->json(['data' => $this->presentBordereau($bordereau)]);
    }

    public function pdfBordereau(Bordereau $bordereau, Request $request)
    {
        $bordereau->load('lignes', 'organisation');

        $pdf = Pdf::loadView('pdfs.bordereau', [
            'bordereau' => $bordereau,
            'cabinet' => 'Carrez Conseil Assurances',
        ]);

        return $pdf->download('bordereau-'.$bordereau->reference.'.pdf');
    }

    public function csvBordereau(Bordereau $bordereau, Request $request)
    {
        $bordereau->load('lignes');

        $out = fopen('php://temp', 'r+');
        fputcsv($out, ['Référence', 'Client', 'Produit', 'Date effet', 'Assiette', 'Taux', 'Montant', 'Nature']);

        foreach ($bordereau->lignes as $l) {
            fputcsv($out, [
                $l->contrat?->reference,
                $l->contrat?->client?->getNomCompletAttribute(),
                $l->contrat?->produit?->nom,
                $l->periode_debut?->format('Y-m-d'),
                $l->assiette_cts,
                $l->taux,
                $l->montant_cts,
                $l->nature,
            ]);
        }

        rewind($out);
        $csv = stream_get_contents($out);
        fclose($out);

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="bordereau-'.$bordereau->reference.'.csv"');
    }

    /**
     * F-408 : tableau de bord partenaire des commissions.
     */
    public function bordereaux(Request $request)
    {
        $user = $request->user();
        $query = Bordereau::with('organisation');

        if ($user->estPartenaire()) {
            $query->where('organisation_id', $user->organisation_id);
        }

        $bordereaux = $query->orderByDesc('created_at')->paginate(25);

        return response()->json(['data' => $bordereaux->map(fn ($b) => $this->presentBordereau($b))]);
    }

    public function declarerPaiement(Bordereau $bordereau, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'date_paiement' => 'required|date',
            'montant_cts' => 'required|integer',
            'reference' => 'nullable|string',
            'commentaire' => 'nullable|string',
        ]);

        PaiementDeclare::create([
            'bordereau_id' => $bordereau->id,
            'date_paiement' => $data['date_paiement'],
            'montant_cts' => $data['montant_cts'],
            'reference' => $data['reference'] ?? null,
            'commentaire' => $data['commentaire'] ?? null,
        ]);

        $bordereau->statut = 'PAYE';
        $bordereau->save();
        $bordereau->lignes()->where('statut', 'BORDEREE')->update(['statut' => 'PAYEE']);

        $this->audit->log('bordereau.paye', 'bordereau', (string) $bordereau->id);

        return response()->json(['data' => $this->presentBordereau($bordereau)]);
    }

    /**
     * F-400 : création d'un barème (partenaire × produit × période).
     */
    public function createBareme(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'organisation_id' => 'required|uuid|exists:organisations,id',
            'produit_id' => 'nullable|exists:produits,id',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date',
            'assiette' => 'required|in:PERCENT_COMMISSION_CABINET,PERCENT_PRIME_HT,FORFAIT',
            'taux_1ere_annee' => 'nullable|numeric',
            'taux_renouvellement' => 'nullable|numeric',
            'part_frais_courtage' => 'nullable|numeric',
            'plancher_cts' => 'nullable|integer',
            'plafond_cts' => 'nullable|integer',
            'duree_reprise_mois' => 'nullable|integer',
            'modalite_reprise' => 'nullable|in:INTEGRAL,PRORATA',
        ]);

        // RG-40 : un barème n'est jamais modifié, il est clôturé et remplacé
        BaremeCommission::where('organisation_id', $data['organisation_id'])
            ->update(['courant' => false]);

        $bareme = BaremeCommission::create(array_merge($data, ['courant' => true]));

        $this->audit->log('bareme.cree', 'bareme_commission', (string) $bareme->id);

        return response()->json(['data' => $bareme], 201);
    }

    private function presentLigne(LigneCommission $l, $user): array
    {
        // RG-03 : supprimer toute donnée PERCUE d'une réponse destinée à un partenaire
        $data = [
            'id' => $l->id,
            'nature' => $l->nature,
            'contrat_reference' => $l->contrat?->reference,
            'client' => $l->contrat?->client?->getNomCompletAttribute(),
            'produit' => $l->contrat?->produit?->nom,
            'periode_debut' => $l->periode_debut,
            'periode_fin' => $l->periode_fin,
            'annee_assurance' => $l->annee_assurance,
            'assiette_cts' => $l->assiette_cts,
            'mode_calcul' => $l->mode_calcul,
            'taux' => $l->taux,
            'montant_cts' => $l->montant_cts,
            'statut' => $l->statut,
            'motif' => $l->motif,
            'ligne_reprise_de' => $l->ligne_reprise_de,
        ];

        // RG-41 : le partenaire peut reconstituer son calcul ; la trace interne
        // (assiette commission cabinet) n'est malgré tout pas exposée au partenaire.
        if ($user->estCabinet()) {
            $data['trace_calcul'] = $l->trace_calcul;
        }

        return $data;
    }

    private function presentBordereau(Bordereau $b): array
    {
        return [
            'id' => $b->id,
            'reference' => $b->reference,
            'organisation_id' => $b->organisation_id,
            'partenaire' => $b->organisation?->raison_sociale,
            'periode_debut' => $b->periode_debut,
            'periode_fin' => $b->periode_fin,
            'statut' => $b->statut,
            'report_anterieur_cts' => $b->report_anterieur_cts,
            'total_brut_cts' => $b->total_brut_cts,
            'total_reprises_cts' => $b->total_reprises_cts,
            'net_a_payer_cts' => $b->net_a_payer_cts,
            'commentaire_comptable' => $b->commentaire_comptable,
            'est_immuable' => $b->estImmuable(),
        ];
    }
}
