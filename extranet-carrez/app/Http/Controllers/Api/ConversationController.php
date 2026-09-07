<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    /**
     * Fil d'une conversation par objet métier (§9.2).
     * RG-55 : les notes internes sont filtrées côté serveur, jamais à l'affichage.
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
                'auteur' => $m->auteur?->name,
                'contenu' => $m->contenu,
                'visibilite' => $m->visibilite,
                'pieces_jointes' => $m->pieces_jointes,
                'created_at' => $m->created_at,
            ]),
        ]);
    }

    public function posterMessage(Conversation $conversation, Request $request)
    {
        $data = $request->validate([
            'contenu' => 'required|string|max:4000',
            'visibilite' => 'nullable|in:EXTERNE,INTERNE',
            'pieces_jointes' => 'nullable|array',
        ]);

        // Seul un membre du cabinet peut écrire une note interne (RG-55)
        $visibilite = $data['visibilite'] ?? Message::VISIBILITE_EXTERNE;
        if ($visibilite === Message::VISIBILITE_INTERNE && !$request->user()->estCabinet()) {
            abort(403, 'Les notes internes sont réservées au cabinet.');
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'auteur_id' => $request->user()->id,
            'contenu' => $data['contenu'],
            'visibilite' => $visibilite,
            'pieces_jointes' => $data['pieces_jointes'] ?? [],
        ]);

        $this->audit->log('message.poste', 'conversation', (string) $conversation->id);

        return response()->json(['data' => $message], 201);
    }

    private function verifierAccesObjet(string $type, string $id, $user): void
    {
        if (!$user->estPartenaire()) {
            return; // le cabinet voit tout
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
