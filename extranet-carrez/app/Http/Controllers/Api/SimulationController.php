<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Simulation;
use App\Services\SimulateurService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SimulationController extends Controller
{
    public function estimer(Request $request, SimulateurService $service)
    {
        $data = $request->validate([
            'produit' => 'required|in:AUTO,Moto,Immobilier,Travaux',
            'marque' => 'nullable|string',
            'puissance' => 'nullable|numeric|min:0',
            'age_vehicule' => 'nullable|numeric|min:0',
            'usage' => 'nullable|string',
            'nb_annees_permis' => 'nullable|integer|min:0',
            'nb_sinistres' => 'nullable|integer|min:0',
            'vol_lnc_rc' => 'nullable|in:Vol,LNC,RC100',
            'cylindree' => 'nullable|string',
            'type_bien' => 'nullable|string',
            'superficie' => 'nullable|numeric|min:0',
            'annee_construction' => 'nullable|integer|min:1900|max:2100',
            'valeur_bien' => 'nullable|numeric|min:0',
            'assurance_pret' => 'nullable|in:Oui,Non',
            'type_travaux' => 'nullable|string',
            'duree_travaux' => 'nullable|integer|min:0',
            'montant_travaux' => 'nullable|numeric|min:0',
            'nb_employes' => 'nullable|integer|min:0',
            'crm' => 'required|numeric|between:0.5,3.5',
            'niveau_garantie' => 'required|in:Basique,Renforcé',
        ]);

        return response()->json(['data' => $service->estimer($data)]);
    }

    /**
     * Simulations enregistrées (cabinet : toutes, sinon les siennes).
     */
    public function index(Request $request)
    {
        $query = Simulation::with('client', 'auteur')->latest();

        if (!$request->user()->estCabinet()) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->query('client_id'));
        }

        if ($request->filled('date_de')) {
            $query->whereDate('created_at', '>=', $request->query('date_de'));
        }

        if ($request->filled('date_a')) {
            $query->whereDate('created_at', '<=', $request->query('date_a'));
        }

        $items = $query->get();

        return response()->json([
            'data' => $items->map(fn (Simulation $s) => $this->present($s)),
            'meta' => ['total' => $items->count()],
        ]);
    }

    /**
     * Enregistre une simulation personnalisée pour un client.
     */
    public function store(Request $request)
    {
        $multipart = $request->hasFile('document');

        $data = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'produit' => 'required|string|max:50',
            'criteres' => $multipart ? 'nullable|string' : 'nullable|array',
            'estimation' => $multipart ? 'nullable|string' : 'nullable|array',
            'client_data' => $multipart ? 'required|string' : 'required|array',
            'document' => 'nullable|file',
        ]);

        $json = fn ($v) => is_string($v) ? (json_decode($v, true) ?? []) : ($v ?? []);

        $documentPath = null;
        $documentNom = null;

        if ($request->hasFile('document')) {
            $file = $request->file('document');

            $extensions = ['pdf', 'jpeg', 'jpg', 'png', 'docx', 'xlsx', 'csv'];
            if (!in_array(strtolower($file->getClientOriginalExtension()), $extensions, true) ||
                $file->getSize() > config('extranet.upload_max_mo', 25) * 1024 * 1024) {
                abort(422, 'Format non accepté ou fichier trop volumineux.');
            }

            $cle = Str::uuid().'.'.$file->getClientOriginalExtension();
            $documentPath = Storage::disk('local')->putFileAs('documents/simulations', $file, $cle);
            $documentNom = $file->getClientOriginalName();
        }

        $simulation = Simulation::create([
            'user_id' => $request->user()->id,
            'client_id' => $data['client_id'],
            'produit' => $data['produit'],
            'criteres' => $json($data['criteres'] ?? []),
            'estimation' => $json($data['estimation'] ?? []),
            'client_data' => $json($data['client_data'] ?? []),
            'document_path' => $documentPath,
            'document_nom' => $documentNom,
        ]);

        return response()->json(['data' => $this->present($simulation)], 201);
    }

    /**
     * Téléchargement du document joint via URL signée.
     */
    public function document(Simulation $simulation)
    {
        if (!$simulation->document_path || !Storage::disk('local')->exists($simulation->document_path)) {
            abort(404);
        }

        return Storage::disk('local')->download($simulation->document_path, $simulation->document_nom);
    }

    private function present(Simulation $s): array
    {
        return [
            'id' => $s->id,
            'reference' => 'SIM-'.str_pad((string) $s->id, 4, '0', STR_PAD_LEFT),
            'produit' => $s->produit,
            'client_id' => $s->client_id,
            'client_nom' => $s->client?->getNomCompletAttribute(),
            'auteur' => $s->auteur?->name,
            'criteres' => $s->criteres ?? [],
            'estimation' => $s->estimation ?? [],
            'client_data' => $s->client_data ?? [],
            'document' => $s->document_path ? [
                'nom' => $s->document_nom,
                'url' => url()->temporarySignedRoute(
                    'simulations.document',
                    now()->addMinutes(config('extranet.url_signee_duree_minutes', 15)),
                    ['simulation' => $s->id]
                ),
            ] : null,
            'created_at' => $s->created_at?->toDateTimeString(),
        ];
    }
}