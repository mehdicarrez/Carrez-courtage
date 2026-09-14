<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Devis;
use App\Models\LigneGarantie;
use App\Services\AuditLogger;
use App\Services\PremiumCalculator;
use App\Services\ReferenceService;
use App\Services\StateMachine;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

class DevisController extends Controller
{
    public function __construct(private AuditLogger $audit, private PremiumCalculator $calc)
    {
    }

    public function index($demandeId, Request $request)
    {
        $demande = \App\Models\DemandeTarification::withoutGlobalScope('organisation')->findOrFail($demandeId);

        // Un partenaire ne voit que les devis qu'il a proposés sur cette demande
        $devis = $demande->devis()->with(['garanties', 'user.organisation', 'proposant.organisation']);
        if ($request->user()->estPartenaire()) {
            $devis->where('user_id', $request->user()->id);
        }

        $devis = $devis->get()->map(fn (Devis $d) => $this->present($d));

        return response()->json(['data' => $devis]);
    }

    /**
     * Liste des devis visibles par l'utilisateur courant.
     * Le cloisonnement est hérité de la demande (scope global RG-01) :
     * un partenaire ne voit que les devis des demandes de son organisation.
     */
    public function liste(Request $request)
    {
        $query = Devis::with(['demande.client', 'demande.branche', 'garanties', 'user.organisation', 'proposant.organisation'])
            ->whereHas('demande', fn ($q) => $q->withoutGlobalScope('organisation'));

        // Un partenaire ne voit que les devis qu'il a proposés (RG-01 bis)
        if ($request->user()->estPartenaire()) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('reference_amont', 'like', "%{$q}%")
                    ->orWhereHas('demande', fn ($d) => $d->where('reference', 'like', "%{$q}%")
                        ->orWhereHas('client', fn ($c) => $c->where('nom', 'like', "%{$q}%")
                            ->orWhere('prenom', 'like', "%{$q}%")
                            ->orWhere('raison_sociale', 'like', "%{$q}%")));
            });
        }

        $devis = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => $devis->map(fn (Devis $d) => $this->presentListe($d)),
            'meta' => ['total' => $devis->total(), 'per_page' => $devis->perPage()],
        ]);
    }

    /**
     * F-200 : saisie d'un devis rattaché à une demande.
     */
    public function store(Request $request, $demandeId)
    {
        // Seuls les partenaires peuvent créer des devis
        if (!$request->user()->estPartenaire()) {
            abort(403, 'Seuls les partenaires peuvent créer un devis.');
        }

        $demande = \App\Models\DemandeTarification::withoutGlobalScope('organisation')->findOrFail($demandeId);

        $data = $request->validate([
            'porteur_risque_id' => 'nullable|exists:porteurs_risque,id',
            'grossiste_id' => 'nullable|exists:grossistes,id',
            'produit_id' => 'nullable|exists:produits,id',
            'reference_amont' => 'nullable|string',
            'prime_ht_cts' => 'required|integer',
            'taxes_cts' => 'nullable|integer',
            'frais_courtage_cts' => 'nullable|integer',
            'fractionnement' => 'nullable|string',
            'premiere_echeance_cts' => 'nullable|integer',
            'date_effet_possible' => 'nullable|date',
            'date_validite' => 'required|date',
            'conditions_particulieres' => 'nullable|string',
            'reserves' => 'nullable|string',
            'taux_commission_percue' => 'nullable|numeric',
            'garanties' => 'nullable|array',
        ]);

        // RG-22 : masquage des commissions perçues côté partenaire (RG-03)
        $prime_ttc = ($data['prime_ht_cts'] ?? 0) + ($data['taxes_cts'] ?? 0);

        $data['prime_ttc_cts'] = $prime_ttc;
        $data['montant_retrocession_cts'] = $this->calc->estimerRetrocession($demande, $data['prime_ht_cts']);

        $devis = DB::transaction(function () use ($demande, $data, $request) {
            $d = $demande->devis()->create($data + ['user_id' => $request->user()->id]);
            $this->enregistrerGaranties($d, $data['garanties'] ?? []);

            // À la première saisie, la demande passe en DEVIS_EMIS
            if ($demande->statut === 'EN_ETUDE') {
                StateMachine::pour($demande)->appliquer($demande, 'DEVIS_EMIS');
                if (!$demande->date_premier_devis) {
                    $demande->date_premier_devis = now();
                    $demande->save();
                }
            }

            return $d;
        });

        $this->audit->log('devis.cree', 'devis', (string) $devis->id);

        return response()->json(['data' => $this->present($devis->fresh('garanties'))], 201);
    }

    public function show(Devis $devis, Request $request)
    {
        $this->verifierAcces($devis, $request->user());
        $devis->load('garanties', 'demande');

        return response()->json(['data' => $this->present($devis)]);
    }

    /**
     * F-201 : modification créant une nouvelle version (un devis ENVOYE reste
     * modifiable, chaque modification = nouvelle version + notification).
     */
    public function update(Devis $devis, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        // Une nouvelle version basée sur la précédente
        $nouveau = $devis->replicate();
        $nouveau->version = $devis->version + 1;
        $nouveau->devis_parent_id = $devis->id;
        $nouveau->statut = 'BROUILLON';

        // Masquer le fait générateur : on garde la précédente expirable

        $nouveau->save();

        foreach ($devis->garanties as $g) {
            $nouveau->garanties()->create($g->only(['intitule', 'plafond_cts', 'franchise_cts', 'incluse', 'optionnelle', 'prix_option_cts']));
        }

        $this->audit->log('devis.versionnee', 'devis', (string) $devis->id, null, ['version' => $nouveau->version]);

        return response()->json(['data' => $this->present($nouveau->fresh('garanties'))], 201);
    }

    /**
     * F-202/F-204/RG-20/RG-21 : transitions envoyer|accepter|refuser|prolonger.
     */
    public function transition(Devis $devis, Request $request)
    {
        $this->verifierAcces($devis, $request->user());

        $data = $request->validate(['action' => 'required|string', 'motif' => 'nullable|string']);

        $nouvelEtat = match ($data['action']) {
            'envoyer' => 'ENVOYE',
            'accepter' => 'ACCEPTE',
            'refuser' => 'REFUSE',
            'prolonger' => 'ENVOYE',
            default => null,
        };

        if (!$nouvelEtat) {
            abort(422, 'Action inconnue.');
        }
        if (!$devis->peutTransiterVers($nouvelEtat)) {
            abort(422, 'Transition interdite pour ce devis.');
        }

        // RG-22 : l'acceptation est un acte engageant
        if ($data['action'] === 'accepter') {
            // RG-23 : un devis expiré ne peut être accepté
            if ($devis->estExpire()) {
                abort(422, 'Ce devis a expiré.');
            }
            if (!$request->user()->estCabinet()) {
                abort(403, 'Seul le cabinet peut accepter un devis.');
            }

            DB::transaction(function () use ($devis) {
                // RG-20 : les autres devis passent en REFUSE, la demande en ACCEPTEE
                $devis->demande->devis()
                    ->where('id', '!=', $devis->id)
                    ->where('statut', 'ENVOYE')
                    ->update(['statut' => 'REFUSE', 'motif' => 'autre offre retenue']);

                if ($devis->demande->peutTransiterVers('ACCEPTEE')) {
                    StateMachine::pour($devis->demande)->appliquer($devis->demande, 'ACCEPTEE');
                }
            });
        }

        if ($nouvelEtat === 'REFUSE' && empty($data['motif'])) {
            throw ValidationException::withMessages(['motif' => ['Le motif est obligatoire au refus.']]);
        }

        // RG-21 : seul le cabinet peut refuser un devis
        if ($data['action'] === 'refuser' && !$request->user()->estCabinet()) {
            abort(403, 'Seul le cabinet peut refuser un devis.');
        }

        $devis->motif = $data['motif'] ?? null;
        StateMachine::pour($devis)->appliquer($devis, $nouvelEtat);
        $devis->save();

        $this->audit->log('devis.'.$data['action'], 'devis', (string) $devis->id);

        return response()->json(['data' => $this->present($devis->fresh('garanties'))]);
    }

    /**
     * F-205 : PDF de proposition à l'en-tête du cabinet.
     * CA-22 : jamais de taux ni montant de commission perçue dans le PDF.
     */
    public function pdf(Devis $devis, Request $request)
    {
        $this->verifierAcces($devis, $request->user());
        $devis->load(['garanties', 'demande.client', 'produit']);

        $pdf = Pdf::loadView('pdfs.proposition', [
            'devis' => $devis,
            'cabinet' => $devis->demande->organisation->raison_sociale,
        ]);

        return $pdf->download('proposition-'.$devis->id.'.pdf');
    }

    private function enregistrerGaranties(Devis $devis, array $garanties): void
    {
        foreach ($garanties as $g) {
            LigneGarantie::create([
                'garantissable_type' => Devis::class,
                'garantissable_id' => $devis->id,
                'intitule' => $g['intitule'],
                'plafond_cts' => $g['plafond_cts'] ?? null,
                'franchise_cts' => $g['franchise_cts'] ?? null,
                'incluse' => $g['incluse'] ?? true,
                'optionnelle' => $g['optionnelle'] ?? false,
                'prix_option_cts' => $g['prix_option_cts'] ?? null,
            ]);
        }
    }

    private function verifierAcces(Devis $devis, $user): void
    {
        // Cabinet a accès à tous les devis
        // Partenaires n'ont accès qu'aux devis qu'ils ont proposés
        if ($user->estPartenaire() && (int) $devis->user_id !== (int) $user->id) {
            abort(403, 'Accès non autorisé à ce devis.');
        }
    }

    private function presentListe(Devis $d): array
    {
        return $this->present($d) + [
            'demande' => [
                'id' => $d->demande_id,
                'reference' => $d->demande?->reference,
                'branche' => $d->demande?->branche?->nom,
                'client' => $d->demande?->client?->getNomCompletAttribute(),
            ],
        ];
    }

    private function present(Devis $d): array
    {
        return [
            'id' => $d->id,
            'demande_id' => $d->demande_id,
            'reference_amont' => $d->reference_amont,
            'prime_ht_cts' => $d->prime_ht_cts,
            'taxes_cts' => $d->taxes_cts,
            'prime_ttc_cts' => $d->prime_ttc_cts,
            'frais_courtage_cts' => $d->frais_courtage_cts,
            'fractionnement' => $d->fractionnement,
            'premiere_echeance_cts' => $d->premiere_echeance_cts,
            'date_effet_possible' => $d->date_effet_possible,
            'date_validite' => $d->date_validite,
            'statut' => $d->statut,
            'motif' => $d->motif,
            'version' => $d->version,
            'est_expire' => $d->estExpire(),
            'conditions_particulieres' => $d->conditions_particulieres,
            'reserves' => $d->reserves,
            'garanties' => $d->garanties?->map(fn ($g) => [
                'intitule' => $g->intitule,
                'plafond_cts' => $g->plafond_cts,
                'franchise_cts' => $g->franchise_cts,
                'incluse' => $g->incluse,
                'optionnelle' => $g->optionnelle,
                'prix_option_cts' => $g->prix_option_cts,
            ]),
            'propose_par' => $this->proposer($d),
        ];
    }

    private function proposer(?Devis $d): ?array
    {
        $org = $d?->user?->organisation;

        if (!$org) {
            return null;
        }

        return [
            'organisation_id' => $org->id,
        'nom' => $org->raison_sociale,
        'logo' => $org->logo,
        'logo_url' => $org->logo
            ? URL::temporarySignedRoute('organisations.logo', now()->addMinutes(1440), ['organisation' => $org->id])
            : null,
        'pays' => $org->pays,
        'siren' => $org->siren,
        'forme_juridique' => $org->forme_juridique,
        'type'=>$org->type
        ];
    }
}
