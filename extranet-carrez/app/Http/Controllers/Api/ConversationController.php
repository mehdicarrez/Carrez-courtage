<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Devis;
use App\Models\Message;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ConversationController extends Controller
{
    private const EXTENSIONS = ['pdf', 'jpeg', 'jpg', 'png', 'docx', 'xlsx', 'csv'];

    public function __construct(private AuditLogger $audit)
    {
    }

    /**
     * Fil d'une conversation par objet métier (§9.2).
     * RG-55 : les notes internes sont filtrées côté serveur, jamais à l'affichage.
     * Les pièces jointes exposent une URL signée à durée de vie courte (RG-51).
     */
    public function show(string $type, string $id, Request $request)
    {
        // Cloisonnement par organisation sur les objets porteurs d'un org
        $this->verifierAccesObjet($type, $id, $request->user());

        $conversation = Conversation::firstOrCreate(
            ['objet_type' => $type, 'objet_id' => $id],
            ['organisation_id' => $request->user()->estPartenaire() ? $request->user()->organisation_id : null]
        );

        $query = $conversation->messages()->with('auteur');

        // RG-55 : un partenaire ne voit que les messages EXTERNE
        if ($request->user()->estPartenaire()) {
            $query->where('visibilite', Message::VISIBILITE_EXTERNE);
        }

        $messages = $query->orderBy('created_at')->get();

        return response()->json([
            'conversation_id' => $conversation->id,
            'messages' => $messages->map(fn (Message $m) => [
                'id' => $m->id,
                'auteur_id' => $m->auteur_id,
                'auteur' => $m->auteur?->name,
                'contenu' => $m->contenu,
                'visibilite' => $m->visibilite,
                'pieces_jointes' => array_map(fn (array $p) => [
                    'nom' => $p['nom'] ?? null,
                    'taille' => $p['taille'] ?? null,
                    'mime' => $p['mime'] ?? null,
                    'url' => url()->temporarySignedRoute(
                        'messages.fichier',
                        now()->addMinutes(config('extranet.url_signee_duree_minutes', 15)),
                        ['message' => $m->id, 'cle' => $p['cle']]
                    ),
                ], $m->pieces_jointes ?: []),
                'created_at' => $m->created_at,
            ]),
        ]);
    }

    /**
     * Poster un message, avec pièces jointes éventuelles (multipart).
     * RG-53 : formats et taille contrôlés, clé opaque RG-50, URL signée RG-51.
     */
    public function posterMessage(Conversation $conversation, Request $request)
    {
        $this->verifierAccesObjet($conversation->objet_type, $conversation->objet_id, $request->user());

        $data = $request->validate([
            'contenu' => 'nullable|string|max:4000',
            'visibilite' => 'nullable|in:EXTERNE,INTERNE',
            'pieces_jointes' => 'nullable|array',
            'fichiers' => 'nullable|array|max:5',
            'fichiers.*' => 'file',
        ]);

        // Seul un membre du cabinet peut écrire une note interne (RG-55)
        $visibilite = $data['visibilite'] ?? Message::VISIBILITE_EXTERNE;
        if ($visibilite === Message::VISIBILITE_INTERNE && !$request->user()->estCabinet()) {
            abort(403, 'Les notes internes sont réservées au cabinet.');
        }

        $contenu = trim($data['contenu'] ?? '');
        $pieces = $data['pieces_jointes'] ?? [];

        if ($pieces === []) {
            $pieces = $this->stockerPieces($request);
        }

        if ($contenu === '' && $pieces === []) {
            abort(422, 'Écrivez un message ou joignez au moins un fichier.');
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'auteur_id' => $request->user()->id,
            'contenu' => $contenu ?: '',
            'visibilite' => $visibilite,
            'pieces_jointes' => $pieces,
        ]);

        $this->audit->log('message.poste', 'conversation', (string) $conversation->id);

        return response()->json(['data' => $message], 201);
    }

    /**
     * Téléchargement d'une pièce jointe via URL signée (route publique RG-51).
     */
    public function telechargerPiece(Message $message, string $cle)
    {
        $piece = collect($message->pieces_jointes ?: [])->firstWhere('cle', $cle);
        $path = 'messages/'.$cle;

        if (!$piece || !Storage::disk('local')->exists($path)) {
            abort(404);
        }

        $this->audit->accesDocument((string) $message->id, 'piece_jointe');

        return Storage::disk('local')->download($path, $piece['nom'] ?? 'piece');
    }

    private function stockerPieces(Request $request): array
    {
        if (!$request->hasFile('fichiers')) {
            return [];
        }

        $pieces = [];
        foreach ($request->file('fichiers') as $file) {
            $extensions = self::EXTENSIONS;
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

            // RG-50 : clé opaque servant aussi d'URL signée
            $cle = Str::uuid().'.'.$file->getClientOriginalExtension();
            Storage::disk('local')->putFileAs('messages', $file, $cle);

            $pieces[] = [
                'nom' => $file->getClientOriginalName(),
                'taille' => $file->getSize(),
                'mime' => $mime,
                'cle' => $cle,
            ];
        }

        return $pieces;
    }

    private function verifierAccesObjet(string $type, string $id, $user): void
    {
        if (!$user->estPartenaire()) {
            return; // le cabinet voit tout
        }

        // Cloisonnement partenaire : un devis appartient au partenaire qui l'a proposé
        if ($type === 'devis') {
            $devis = Devis::find($id);
            if (!$devis || (int) $devis->user_id !== (int) $user->id) {
                $this->audit->accesRefuse($type, $id);
                abort(404);
            }
            return;
        }

        $instance = $this->resoudreObjet($type, $id);
        if (!$instance || (property_exists($instance, 'organisation_id')
                && $instance->organisation_id !== $user->organisation_id)) {
            $this->audit->accesRefuse($type, $id);
            abort(404);
        }
    }

    private function resoudreObjet(string $type, string $id): ?object
    {
        $model = match ($type) {
            'demande' => \App\Models\DemandeTarification::class,
            'contrat' => \App\Models\Contrat::class,
            'devis' => \App\Models\Devis::class,
            'ligne_commission' => \App\Models\LigneCommission::class,
            default => null,
        };

        return $model ? $model::find($id) : null;
    }
}