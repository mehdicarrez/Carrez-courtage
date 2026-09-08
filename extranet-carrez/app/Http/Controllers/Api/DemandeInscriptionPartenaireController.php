<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\DemandeInscriptionApprouvee;
use App\Mail\DemandeInscriptionRefusee;
use App\Models\DemandeInscriptionPartenaire;
use App\Models\Fournisseur;
use App\Models\Organisation;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class DemandeInscriptionPartenaireController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    /**
     * Liste des demandes d'inscription (réservé au cabinet).
     * Les demandes en attente sont remontées en premier.
     */
    public function index(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $query = DemandeInscriptionPartenaire::with('traitePar');

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }

        $demandes = $query
            ->orderByRaw("FIELD(statut, 'EN_ATTENTE') DESC")
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $demandes->map(fn ($d) => $this->present($d)),
            'meta' => [
                'total' => $demandes->count(),
                'en_attente' => $demandes->where('statut', DemandeInscriptionPartenaire::STATUT_EN_ATTENTE)->count(),
            ],
        ]);
    }

    /**
     * Confirmation d'une demande : création du fournisseur partenaire,
     * de son organisation et du compte de connexion (le mot de passe choisi
     * à l'inscription est conservé, le partenaire peut se connecter aussitôt).
     */
    public function approuver(DemandeInscriptionPartenaire $demande, Request $request)
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }

        if ($demande->statut !== DemandeInscriptionPartenaire::STATUT_EN_ATTENTE) {
            abort(422, 'Seule une demande en attente peut être confirmée.');
        }

        if (User::where('email', $demande->email)->exists()) {
            abort(422, 'Un compte existe déjà avec cet e-mail.');
        }

        $fournisseur = Fournisseur::create([
            'id' => (string) Str::uuid(),
            'nom' => $demande->nom,
            'email' => $demande->email,
            'telephone' => $demande->telephone,
            'actif' => true,
            'devenir_partenaire' => true,
        ]);

        $organisation = $this->organismePartenaire($fournisseur);

        $user = User::create([
            'fournisseur_id' => $fournisseur->id,
            'organisation_id' => $organisation->id,
            'name' => $demande->nom,
            'email' => $demande->email,
            'password' => $demande->mot_de_passe,
            'role' => User::ROLE_PARTENAIRE,
            'actif' => true,
        ]);

        $demande->update([
            'statut' => DemandeInscriptionPartenaire::STATUT_VALIDEE,
            'traite_par' => $request->user()->id,
            'traite_le' => now(),
        ]);

        $this->audit->log(
            'partenaire.demande_validee',
            'demande_inscription_partenaire',
            (string) $demande->id,
            null,
            ['fournisseur' => $fournisseur->id, 'user' => (string) $user->id]
        );

        $this->notifierApprobation($demande);

        return response()->json([
            'data' => $this->present($demande->fresh(['traitePar'])),
            'compte' => [
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Refus d'une demande d'inscription (motif obligatoire).
     */
    public function refuser(DemandeInscriptionPartenaire $demande, Request $request)
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }

        if ($demande->statut !== DemandeInscriptionPartenaire::STATUT_EN_ATTENTE) {
            abort(422, 'Seule une demande en attente peut être refusée.');
        }

        $data = $request->validate([
            'motif' => 'required|string|max:1000',
        ]);

        $demande->update([
            'statut' => DemandeInscriptionPartenaire::STATUT_REFUSEE,
            'motif_refus' => $data['motif'],
            'traite_par' => $request->user()->id,
            'traite_le' => now(),
        ]);

        $this->audit->log(
            'partenaire.demande_refusee',
            'demande_inscription_partenaire',
            (string) $demande->id,
            null,
            ['motif' => $data['motif']]
        );

        $this->notifierRefus($demande);

        return response()->json(['data' => $this->present($demande->fresh(['traitePar']))]);
    }

    /**
     * Envoie un e-mail au partenaire (adresse saisie à l'inscription)
     * pour l'informer que sa demande a été acceptée.
     * L'échec d'envoi ne fait jamais échouer la validation.
     */
    private function notifierApprobation(DemandeInscriptionPartenaire $demande): void
    {
        try {
            Mail::to($demande->email)->send(new DemandeInscriptionApprouvee($demande));
        } catch (\Throwable $e) {
            $this->audit->log('partenaire.email_echec', 'demande_inscription_partenaire', (string) $demande->id, null, [
                'type' => 'approuvee',
                'erreur' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Envoie un e-mail au partenaire pour l'informer du refus (avec motif).
     */
    private function notifierRefus(DemandeInscriptionPartenaire $demande): void
    {
        try {
            Mail::to($demande->email)->send(new DemandeInscriptionRefusee($demande));
        } catch (\Throwable $e) {
            $this->audit->log('partenaire.email_echec', 'demande_inscription_partenaire', (string) $demande->id, null, [
                'type' => 'refusee',
                'erreur' => $e->getMessage(),
            ]);
        }
    }

    private function organismePartenaire(Fournisseur $fournisseur): Organisation
    {
        $existant = Organisation::where('type', Organisation::TYPE_PARTENAIRE)
            ->where('raison_sociale', $fournisseur->nom)
            ->first();

        if ($existant) {
            if ($existant->statut !== 'ACTIVE') {
                $existant->statut = 'ACTIVE';
                $existant->date_activation = now();
                $existant->save();
            }

            return $existant;
        }

        return Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => Organisation::TYPE_PARTENAIRE,
            'raison_sociale' => $fournisseur->nom,
            'statut' => 'ACTIVE',
            'date_activation' => now(),
        ]);
    }

    private function present(DemandeInscriptionPartenaire $d): array
    {
        return [
            'id' => $d->id,
            'nom' => $d->nom,
            'email' => $d->email,
            'telephone' => $d->telephone,
            'statut' => $d->statut,
            'motif_refus' => $d->motif_refus,
            'date_demande' => $d->created_at,
            'traite_le' => $d->traite_le,
            'traite_par' => $d->traitePar?->name,
        ];
    }
}