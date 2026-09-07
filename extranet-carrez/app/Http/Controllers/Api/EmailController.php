<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Email;
use App\Models\Conversation;
use App\Models\Contrat;
use App\Models\DemandeTarification;
use App\Models\Message;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    public function index(Request $request)
    {
        $query = Email::query();

        if ($request->user()->estPartenaire()) {
            $query->where('organisation_id', $request->user()->organisation_id)
                  ->where('visible_partenaire', true); // RG-56
        }

        if ($request->filled('statut_rattachement')) {
            $query->where('statut_rattachement', $request->query('statut_rattachement'));
        }

        return response()->json(['data' => $query->orderByDesc('created_at')->paginate(25)]);
    }

    /**
     * F-543 : liste des dossiers (demandes / contrats) rattachables.
     */
    public function attachementsPossibles(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $demandes = DemandeTarification::where('statut', '!=', 'BROUILLON')
            ->limit(200)->get(['id', 'reference']);
        $contrats = Contrat::limit(200)->get(['id', 'reference']);

        return response()->json([
            'data' => [
                'demande' => $demandes->map(fn ($d) => ['id' => $d->getKey(), 'label' => 'Demande '.$d->reference]),
                'contrat' => $contrats->map(fn ($c) => ['id' => $c->getKey(), 'label' => 'Contrat '.$c->reference]),
            ],
        ]);
    }

    /**
     * F-540 : envoi d'e-mail depuis un dossier. Archivage dans le fil (F-541).
     */
    public function envoyer(Request $request)
    {
        $data = $request->validate([
            'objet_type' => 'required|string',
            'objet_id' => 'required|string',
            'destinataires' => 'required|array',
            'destinataires.*' => 'required|email',
            'sujet' => 'required|string',
            'corps' => 'required|string',
            'pieces_jointes' => 'nullable|array',
        ]);

        $email = Email::create([
            'sens' => 'SORTANT',
            'organisation_id' => $request->user()->organisation_id,
            'objet_type' => $data['objet_type'],
            'objet_id' => $data['objet_id'],
            'destinataires' => $data['destinataires'],
            'sujet' => $data['sujet'],
            'corps' => $data['corps'],
            'pieces_jointes_ids' => $data['pieces_jointes'] ?? [],
            'statut_rattachement' => 'RATTACHE',
            'statut_delivrabilite' => 'ENVOYE',
            'visible_partenaire' => true,
        ]);

        // Envoi via le driver de mail (log en dev)
        $this->envoyerReel($email);

        // Archivage dans le fil du dossier
        $conversation = Conversation::firstOrCreate(
            ['objet_type' => $data['objet_type'], 'objet_id' => $data['objet_id']],
            ['organisation_id' => $request->user()->organisation_id]
        );

        Message::create([
            'conversation_id' => $conversation->id,
            'auteur_id' => $request->user()->id,
            'contenu' => 'E-mail envoyé : '.$data['sujet']."\n\n".$data['corps'],
            'visibilite' => Message::VISIBILITE_EXTERNE,
            'pieces_jointes' => $data['pieces_jointes'] ?? [],
        ]);

        $this->audit->log('email.envoye', $data['objet_type'], $data['objet_id']);

        return response()->json(['data' => $email], 201);
    }

    /**
     * F-543 : rattachement manuel d'un e-mail non rattaché.
     */
    public function rattacher(Email $email, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'objet_type' => 'required|string',
            'objet_id' => 'required|string',
            'visible_partenaire' => 'nullable|boolean',
        ]);

        $email->objet_type = $data['objet_type'];
        $email->objet_id = $data['objet_id'];
        $email->statut_rattachement = 'RATTACHE';
        // RG-56 : par défaut un e-mail entrant rattaché est interne
        $email->visible_partenaire = $data['visible_partenaire'] ?? false;
        $email->save();

        return response()->json(['data' => $email]);
    }

    private function envoyerReel(Email $email): void
    {
        try {
            Mail::raw($email->corps, function ($message) use ($email) {
                $message->to($email->destinataires)
                    ->subject($email->sujet);
            });
        } catch (\Throwable $e) {
            $email->forceFill(['statut_delivrabilite' => 'REJETE'])->save();
        }
    }
}
