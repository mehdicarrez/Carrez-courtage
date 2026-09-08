<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReseauSocial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ReseauSocialController extends Controller
{
    /**
     * Réseaux sociaux non référencés ajoutés par l'utilisateur.
     */
    public function index(Request $request)
    {
        $reseaux = ReseauSocial::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $reseaux->map(fn ($r) => $this->present($r)),
            'meta' => ['total' => $reseaux->count()],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lien' => 'required|string|max:255',
            'nom' => 'required|string|max:255',
            'descriptif' => 'nullable|string|max:255',
            'logo' => 'nullable|file|image|max:2048',
        ]);

        $path = null;
        if ($request->hasFile('logo')) {
            $logo = $request->file('logo');
            $cle = Str::uuid().'.'.$logo->getClientOriginalExtension();
            $path = Storage::disk('local')->putFileAs('logos/reseaux_sociaux', $logo, $cle);
        }

        $reseau = ReseauSocial::create([
            'user_id' => $request->user()->id,
            'nom' => $data['nom'],
            'lien' => $data['lien'],
            'descriptif' => $data['descriptif'] ?? null,
            'logo' => $path,
        ]);

        return response()->json(['data' => $this->present($reseau)], 201);
    }

    /**
     * Affichage du logo via URL signée (route publique).
     */
    public function logo(ReseauSocial $reseau)
    {
        if (!$reseau->logo || !Storage::disk('local')->exists($reseau->logo)) {
            abort(404);
        }

        return Storage::disk('local')->response($reseau->logo);
    }

    private function present(ReseauSocial $r): array
    {
        return [
            'id' => $r->id,
            'nom' => $r->nom,
            'lien' => $r->lien,
            'descriptif' => $r->descriptif,
            'logo' => $r->logo,
            'logo_url' => $r->logo
                ? URL::temporarySignedRoute('reseaux_sociaux.logo', now()->addMinutes(1440), ['reseau' => $r->id])
                : null,
            'created_at' => $r->created_at?->toDateTimeString(),
        ];
    }
}