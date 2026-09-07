<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grossiste;
use Illuminate\Http\Request;

class GrossisteController extends Controller
{
    /**
     * Fournisseurs plateforme (cocourtage) référencés.
     */
    public function index(Request $request)
    {
        $grossistes = Grossiste::where('actif', true)->orderBy('nom')->get();

        return response()->json([
            'data' => $grossistes->map(fn (Grossiste $g) => [
                'id' => $g->id,
                'nom' => $g->nom,
                'orias' => $g->orias,
            ]),
        ]);
    }
}
