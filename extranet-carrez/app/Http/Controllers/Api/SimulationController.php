<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Simulation;
use App\Services\SimulateurService;
use Illuminate\Http\Request;

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
        $data = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'produit' => 'required|string|max:50',
            'criteres' => 'nullable|array',
            'estimation' => 'nullable|array',
            'client_data' => 'required|array',
        ]);

        $simulation = Simulation::create([
            'user_id' => $request->user()->id,
            'client_id' => $data['client_id'],
            'produit' => $data['produit'],
            'criteres' => $data['criteres'] ?? [],
            'estimation' => $data['estimation'] ?? [],
            'client_data' => $data['client_data'] ?? [],
        ]);

        return response()->json(['data' => $this->present($simulation)], 201);
    }

    private function present(Simulation $s): array
    {
        return [
            'id' => $s->id,
            'produit' => $s->produit,
            'client_id' => $s->client_id,
            'client_nom' => $s->client?->getNomCompletAttribute(),
            'auteur' => $s->auteur?->name,
            'criteres' => $s->criteres ?? [],
            'estimation' => $s->estimation ?? [],
            'client_data' => $s->client_data ?? [],
            'created_at' => $s->created_at?->toDateTimeString(),
        ];
    }
}