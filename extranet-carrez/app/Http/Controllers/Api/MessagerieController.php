<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Messagerie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
class MessagerieController extends Controller
{
    /**
     * Messageries non référencées ajoutées par l'utilisateur.
     */
    public function index(Request $request)
    {
        $messageries = Messagerie::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $messageries->map(fn ($m) => $this->present($m)),
            'meta' => ['total' => $messageries->count()],
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
            $path = Storage::disk('local')->putFileAs('logos/messageries', $logo, $cle);
        }

        $messagerie = Messagerie::create([
            'user_id' => $request->user()->id,
            'nom' => $data['nom'],
            'lien' => $data['lien'],
            'descriptif' => $data['descriptif'] ?? null,
            'logo' => $path,
        ]);

        return response()->json(['data' => $this->present($messagerie)], 201);
    }

    /**
     * Affichage du logo via URL signée (route publique).
     */
    public function logo(Messagerie $messagerie)
    {
        if (!$messagerie->logo || !Storage::disk('local')->exists($messagerie->logo)) {
            abort(404);
        }

        return Storage::disk('local')->response($messagerie->logo);
    }

    private function present(Messagerie $m): array
    {
        return [
            'id' => $m->id,
            'nom' => $m->nom,
            'lien' => $m->lien,
            'descriptif' => $m->descriptif,
            'logo' => $m->logo,
            'logo_url' => $m->logo
                ? URL::temporarySignedRoute('messageries.logo', now()->addMinutes(1440), ['messagerie' => $m->id])
                : null,
            'created_at' => $m->created_at?->toDateTimeString(),
        ];
    }
}