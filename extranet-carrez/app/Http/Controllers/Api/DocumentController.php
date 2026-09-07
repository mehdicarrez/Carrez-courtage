<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\TypeDocument;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    public function index(Request $request)
    {
        $query = Document::with('type')->where('supprime_logiquement', false);

        if ($request->filled('objet_type')) {
            $query->where('objet_type', $request->query('objet_type'))
                  ->where('objet_id', $request->query('objet_id'));
        }
        if ($request->filled('type_document_id')) {
            $query->where('type_document_id', $request->query('type_document_id'));
        }
        if ($request->user()->estPartenaire()) {
            $query->where('organisation_id', $request->user()->organisation_id);
        }

        $docs = $query->orderByDesc('created_at')->paginate(25);

        return response()->json(['data' => $docs->map(fn ($d) => $this->present($d, $request->user()))]);
    }

    /**
     * F-500 / RG-52 / RG-53 : upload multi-fichiers, typage, vérifications.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'type_document_id' => 'required|exists:types_documents,id',
            'objet_type' => 'required|string',
            'objet_id' => 'required|string',
            'file' => 'required|file',
        ]);

        $file = $request->file('file');
        $type = TypeDocument::findOrFail($data['type_document_id']);

        // RG-53 : formats acceptés, taille maxi, type réel par signature binaire
        $extensions = ['pdf', 'jpeg', 'jpg', 'png', 'docx', 'xlsx', 'csv'];
        if (!in_array(strtolower($file->getClientOriginalExtension()), $extensions, true)) {
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

        if (!in_array($mime, $autorises, true) &&
            !str_starts_with($mime, 'image/') &&
            !str_contains($mime, 'officedocument')) {
            abort(422, 'Type de fichier non autorisé (CA-53).');
        }

        // RG-50 : clé opaque, non devinable, indépendante du nom d'origine
        $cle = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = Storage::disk('local')->putFileAs('documents', $file, $cle);

        // Versionnement (RG-54 / CA-54) : un même type sur un même objet crée une version
        $dernier = Document::where('objet_type', $data['objet_type'])
            ->where('objet_id', $data['objet_id'])
            ->where('type_document_id', $data['type_document_id'])
            ->where('supprime_logiquement', false)
            ->orderByDesc('version')
            ->first();

        $document = Document::create([
            'type_document_id' => $data['type_document_id'],
            'nom_origine' => $file->getClientOriginalName(),
            'taille' => $file->getSize(),
            'mime_reel' => $mime,
            'mime_declare' => $file->getClientMimeType(),
            'objet_type' => $data['objet_type'],
            'objet_id' => $data['objet_id'],
            'organisation_id' => $request->user()->organisation_id,
            'cle_stockage' => $path,
            'version' => $dernier ? $dernier->version + 1 : 1,
            'document_parent_id' => $dernier?->id,
            'sensibilite' => $type->sensible ? Document::SENSIBILITE_SENSIBLE : 'NORMALE',
            'statut_antivirus' => 'SAIN', // analyse asynchrone simulée en dev
            'hash_sha256' => hash_file('sha256', $file->getPathname()),
        ]);

        $this->audit->log('document.depose', 'document', (string) $document->id);

        return response()->json(['data' => $this->present($document, $request->user())], 201);
    }

    public function show(Document $document, Request $request)
    {
        $this->verifierAcces($document, $request->user());

        return response()->json(['data' => $this->present($document, $request->user())]);
    }

    /**
     * RG-51 : URL signée à durée de vie courte (15 min), génération journalisée.
     * CA-51 : rejouée 20 minutes plus tard → refusée.
     */
    public function urlSignee(Document $document, Request $request)
    {
        $this->verifierAcces($document, $request->user());

        // Un fichier en attente d'analyse est visible mais non téléchargeable (RG-52)
        if ($document->statut_antivirus === 'EN_ATTENTE') {
            abort(423, 'Fichier en cours d\'analyse.');
        }

        // RG-13 : les pièces sensibles ne sont pas exposées à un partenaire tiers
        if ($document->estSensible() && $request->user()->estPartenaire()) {
            $this->audit->accesRefuse('document_sensible', (string) $document->id);
            abort(404);
        }

        $url = url()->temporarySignedRoute(
            'documents.telechargement',
            now()->addMinutes(config('extranet.url_signee_duree_minutes', 15)),
            ['document' => $document->id]
        );

        $this->audit->urlSignee($document->id);

        return response()->json(['url' => $url, 'expire_dans' => config('extranet.url_signee_duree_minutes', 15)]);
    }

    public function valider(Document $document, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $document->statut_validation = 'VALIDE';
        $document->valide_par = $request->user()->id;
        $document->date_validation = now();
        $document->save();

        $this->audit->log('document.valide', 'document', (string) $document->id);

        return response()->json(['data' => $this->present($document, $request->user())]);
    }

    public function refuser(Document $document, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate(['motif' => 'required|string']);
        $document->statut_validation = 'REFUSE';
        $document->motif_refus = $data['motif'];
        $document->valide_par = $request->user()->id;
        $document->save();

        $this->audit->log('document.refuse', 'document', (string) $document->id);

        return response()->json(['data' => $this->present($document, $request->user())]);
    }

    /**
     * RG-55 : suppression logique d'un document (retention + audit conservés).
     */
    public function destroy(Document $document, Request $request)
    {
        $this->verifierAcces($document, $request->user());

        $document->supprime_logiquement = true;
        $document->date_purge_prevue = now()->addDays(config('extranet.retention_jours', 30));
        $document->save();

        $this->audit->log('document.supprime', 'document', (string) $document->id);

        return response()->json(['message' => 'Document supprimé.']);
    }

    /**
     * Téléchargement via URL signée (route publique).
     */
    public function telechargement(Document $document)
    {
        if (!$document->cle_stockage || !Storage::disk('local')->exists($document->cle_stockage)) {
            abort(404);
        }

        $this->audit->accesDocument($document->id, 'telechargement');

        return Storage::disk('local')->download($document->cle_stockage, $document->nom_origine);
    }

    private function verifierAcces(Document $document, $user): void
    {
        if ($user->estPartenaire() && $document->organisation_id !== $user->organisation_id) {
            $this->audit->accesRefuse('document', (string) $document->id);
            abort(404);
        }
    }

    private function present(Document $d, $user): array
    {
        return [
            'id' => $d->id,
            'type_document' => $d->type?->libelle,
            'type_document_id' => $d->type_document_id,
            'nom_origine' => $d->nom_origine,
            'taille' => $d->taille,
            'objet_type' => $d->objet_type,
            'objet_id' => $d->objet_id,
            'version' => $d->version,
            'statut_validation' => $d->statut_validation,
            'sensibilite' => $d->sensibilite,
            'statut_antivirus' => $d->statut_antivirus,
        ];
    }
}
