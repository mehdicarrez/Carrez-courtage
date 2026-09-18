<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BibliothequeDocument;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Bibliothèque de modèles/documents partagée à l'échelle de l'organisation.
 */
class BibliothequeController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    public function index(Request $request)
    {
        $query = BibliothequeDocument::query();

        if ($request->filled('categorie')) {
            $query->where('categorie', $request->query('categorie'));
        }

        $documents = $query->orderBy('categorie')->orderByDesc('created_at')->get();

        return response()->json([
            'data' => $documents->map(fn (BibliothequeDocument $d) => $this->present($d)),
            'meta' => ['total' => $documents->count(), 'categories' => BibliothequeDocument::CATEGORIES],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'categorie' => 'required|string|in:'.implode(',', BibliothequeDocument::CATEGORIES),
            'titre' => 'required|string|max:255',
            'file' => 'required|file',
        ]);

        $file = $request->file('file');

        $extensions = ['pdf', 'jpeg', 'jpg', 'png', 'docx', 'xlsx', 'csv'];
        if (! in_array(strtolower($file->getClientOriginalExtension()), $extensions, true)) {
            abort(422, 'Format non accepté.');
        }
        if ($file->getSize() > config('extranet.upload_max_mo', 25) * 1024 * 1024) {
            abort(422, 'Fichier trop volumineux.');
        }

        $mime = $file->getMimeType();
        $autorises = ['application/pdf', 'image/jpeg', 'image/png',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv', 'text/plain'];

        if (! in_array($mime, $autorises, true) &&
            ! str_starts_with($mime, 'image/') &&
            ! str_contains($mime, 'officedocument')) {
            abort(422, 'Type de fichier non autorisé.');
        }

        $cle = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = Storage::disk('local')->putFileAs('bibliotheque', $file, $cle);

        $document = BibliothequeDocument::create([
            'organisation_id' => $request->user()->organisation_id,
            'categorie' => $data['categorie'],
            'titre' => $data['titre'],
            'nom_origine' => $file->getClientOriginalName(),
            'taille' => $file->getSize(),
            'mime' => $mime,
            'cle_stockage' => $path,
        ]);

        $this->audit->log('bibliotheque.depose', 'bibliotheque_document', (string) $document->id);

        return response()->json(['data' => $this->present($document)], 201);
    }

    public function urlSignee(BibliothequeDocument $document)
    {
        $url = url()->temporarySignedRoute(
            'bibliotheque.telechargement',
            now()->addMinutes(config('extranet.url_signee_duree_minutes', 15)),
            ['document' => $document->id]
        );

        $this->audit->urlSignee($document->id);

        return response()->json(['url' => $url]);
    }

    public function telechargement(BibliothequeDocument $document)
    {
        if (! $document->cle_stockage || ! Storage::disk('local')->exists($document->cle_stockage)) {
            abort(404);
        }

        return Storage::disk('local')->download($document->cle_stockage, $document->nom_origine);
    }

    public function destroy(BibliothequeDocument $document)
    {
        if ($document->cle_stockage && Storage::disk('local')->exists($document->cle_stockage)) {
            Storage::disk('local')->delete($document->cle_stockage);
        }

        $this->audit->log('bibliotheque.supprime', 'bibliotheque_document', (string) $document->id);
        $document->delete();

        return response()->json(['data' => ['id' => $document->id]]);
    }

    private function present(BibliothequeDocument $d): array
    {
        return [
            'id' => $d->id,
            'categorie' => $d->categorie,
            'titre' => $d->titre,
            'nom_origine' => $d->nom_origine,
            'taille' => $d->taille,
            'mime' => $d->mime,
            'created_at' => $d->created_at,
        ];
    }
}
