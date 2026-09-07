<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Produit;
use Illuminate\Http\Request;

class ProduitController extends Controller
{
    /**
     * Liste des produits actifs, regroupés par catégorie commerciale.
     * 'data' => [ ['categorie' => ..., 'produits' => [...]] ]
     */
    public function index(Request $request)
    {
        $produits = Produit::with('branche')
            ->where('actif', true)
            ->whereNotNull('categorie')
            ->orderBy('categorie')
            ->orderBy('nom')
            ->get();

        $groupes = $produits->groupBy('categorie')->map(function ($items, $categorie) {
            return [
                'categorie' => $categorie,
                'produits' => $items->map(fn (Produit $p) => [
                    'id' => $p->id,
                    'code' => $p->code,
                    'nom' => $p->nom,
                    'categorie' => $p->categorie,
                    'branche_id' => $p->branche_id,
                    'branche_nom' => $p->branche?->nom,
                ])->values(),
            ];
        })->values();

        return response()->json(['data' => $groupes]);
    }
}
