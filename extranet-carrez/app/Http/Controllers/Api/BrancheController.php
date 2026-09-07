<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branche;
use Illuminate\Http\Request;

class BrancheController extends Controller
{
    public function index(Request $request)
    {
        $branches = Branche::with('schemaCourant')
            ->where('actif', true)
            ->orderBy('famille')
            ->orderBy('nom')
            ->get();

        return response()->json([
            'data' => $branches->map(fn (Branche $b) => [
                'id' => $b->id,
                'code' => $b->code,
                'nom' => $b->nom,
                'famille' => $b->famille,
                'schema_version' => $b->schemaCourant?->version,
            ]),
        ]);
    }

    public function show(Branche $branche)
    {
        return response()->json([
            'data' => [
                'id' => $branche->id,
                'code' => $branche->code,
                'nom' => $branche->nom,
                'famille' => $branche->famille,
            ],
        ]);
    }

    /**
     * RG-10 : schéma de formulaire courant, rendu dynamique du formulaire.
     */
    public function schema(Branche $branche)
    {
        $schema = $branche->schemaCourant;

        if (!$schema) {
            abort(404, 'Aucun schéma de formulaire pour cette branche.');
        }

        return response()->json([
            'data' => [
                'branche' => $branche->nom,
                'version' => $schema->version,
                'schema' => $schema->schema,
                'pieces_attendues' => $schema->pieces_attendues,
            ],
        ]);
    }
}
