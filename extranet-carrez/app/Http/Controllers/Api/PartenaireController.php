<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BaremeCommission;
use App\Models\Branche;
use App\Models\Contrat;
use App\Models\Organisation;
use App\Models\PieceOrganisation;
use App\Models\TypeDocument;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PartenaireController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    public function index(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $query = Organisation::where('type', Organisation::TYPE_PARTENAIRE)
            ->withCount('utilisateurs');

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('raison_sociale', 'like', "%{$q}%")
                    ->orWhere('siren', 'like', "%{$q}%")
                    ->orWhere('numero_orias', 'like', "%{$q}%");
            });
        }

        $partenaires = $query->orderByDesc('created_at')->paginate(25);

        $aggregats = Contrat::whereIn('organisation_id', $partenaires->pluck('id'))
            ->selectRaw('organisation_id, count(*) as nb_contrats, coalesce(sum(prime_ht_cts), 0) as montant_primes_cts, max(created_at) as dernier_contrat')
            ->groupBy('organisation_id')
            ->get()
            ->keyBy('organisation_id');

        return response()->json([
            'data' => $partenaires->map(function ($p) use ($aggregats) {
                $r = $this->present($p, true);
                $a = $aggregats->get($p->id);
                $r['contrats'] = $a->nb_contrats ?? 0;
                $r['montant_primes_cts'] = (int) ($a->montant_primes_cts ?? 0);
                $r['dernier_contrat'] = $a->dernier_contrat ?? null;
                return $r;
            }),
            'meta' => ['total' => $partenaires->total()],
        ]);
    }

    /**
     * F-600 : dépôt de candidature partenaire (saisie réglementée, RG-60).
     */
    public function candidature(Request $request)
    {
        $data = $request->validate([
            'raison_sociale' => 'required|string',
            'forme_juridique' => 'nullable|string',
            'siren' => 'nullable|string|size:9',
            'siret' => 'nullable|string|size:14',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string',
            'code_postal' => 'nullable|string',
            'numero_orias' => 'nullable|string',
            'categories_orias' => 'nullable|array',
            'dirigeant' => 'required|array',
            'dirigeant.nom' => 'required|string',
            'dirigeant.prenom' => 'required|string',
            'dirigeant.email' => 'required|email',
            'dirigeant.telephone' => 'nullable|string',
        ]);

        $partenaire = Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => Organisation::TYPE_PARTENAIRE,
            'raison_sociale' => $data['raison_sociale'],
            'forme_juridique' => $data['forme_juridique'] ?? null,
            'siren' => $data['siren'] ?? null,
            'siret' => $data['siret'] ?? null,
            'adresse' => $data['adresse'] ?? null,
            'ville' => $data['ville'] ?? null,
            'code_postal' => $data['code_postal'] ?? null,
            'numero_orias' => $data['numero_orias'] ?? null,
            'categories_orias' => $data['categories_orias'] ?? [],
            'statut' => 'EN_VALIDATION',
        ]);

        // Compte dirigeant non activé tant que la validation n'est pas faite
        User::create([
            'organisation_id' => $partenaire->id,
            'name' => trim($data['dirigeant']['prenom'].' '.$data['dirigeant']['nom']),
            'email' => $data['dirigeant']['email'],
            'password' => Str::random(32),
            'role' => User::ROLE_DIRIGEANT_PARTENAIRE,
            'actif' => false,
        ]);

        // Création des pièces réglementaires attendues (RG-60)
        $this->initialiserPieces($partenaire);

        $this->audit->log('partenaire.candidature', 'organisation', (string) $partenaire->id);

        return response()->json(['data' => $this->present($partenaire)], 201);
    }

    public function show(Organisation $partenaire, Request $request)
    {
        if ($request->user()->estPartenaire() && $partenaire->id !== $request->user()->organisation_id) {
            abort(404);
        }

        $partenaire->load([
            'convention',
            'baremes' => fn ($q) => $q->orderByDesc('date_debut'),
            'utilisateurs',
            'pieces.typeDocument',
        ]);

        $data = $this->present($partenaire);
        $data['convention'] = $partenaire->convention;
        $data['baremes'] = $partenaire->baremes;
        $data['utilisateurs'] = $partenaire->utilisateurs->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'actif' => $u->actif,
        ]);
        $data['pieces'] = $partenaire->pieces->map(fn ($p) => $this->presentPiece($p));
        $data['branches_autorisees'] = $partenaire->branches_autorisees ?? [];
        $data['checklist_validation'] = $partenaire->checklist_validation ?? $this->checklistVide();
        $data['branches_disponibles'] = Branche::where('actif', true)->orderBy('nom')->get(['id', 'code', 'nom', 'famille']);
        if ($request->user()->estCabinet()) {
            $data['statistiques'] = $this->statistiques($partenaire);
        }

        return response()->json(['data' => $data]);
    }

    /**
     * F-601/602 : validation d'un partenaire + création compte dirigeant activé.
     * RG-60 : la décision d'acceptation s'appuie sur la liste de contrôle réglementaire.
     */
    public function valider(Organisation $partenaire, Request $request)
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'checklist_validation' => 'required|array|min:1', // [{cle, libelle, ok}]
            'branches_autorisees' => 'required|array',
        ]);

        // RG-60 : toutes les cases de contrôle doivent être cochées pour accepter
        $nonConforme = collect($data['checklist_validation'])->contains(fn ($c) => empty($c['ok']));
        if ($nonConforme) {
            abort(422, 'La liste de contrôle réglementaire doit être complète avant validation.');
        }

        $partenaire->statut = 'ACTIVE';
        $partenaire->date_activation = now();
        $partenaire->checklist_validation = $data['checklist_validation'];
        $partenaire->branches_autorisees = $data['branches_autorisees'];
        $partenaire->decision = 'ACCEPTEE';
        $partenaire->motif_decision = null;
        $partenaire->date_decision = now();
        $partenaire->decide_par = $request->user()->id;
        $partenaire->save();

        // Activation du compte dirigeant (créé en candidature)
        $partenaire->utilisateurs()->where('role', User::ROLE_DIRIGEANT_PARTENAIRE)
            ->update(['actif' => true]);

        $this->audit->log('partenaire.valide', 'organisation', (string) $partenaire->id, null, $data);

        return response()->json(['data' => $this->present($partenaire->fresh(), true)]);
    }

    /**
     * F-602 : refus de candidature (compte non activé, statut REFUSEE).
     */
    public function refuser(Organisation $partenaire, Request $request)
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }
        if ($partenaire->statut !== 'EN_VALIDATION') {
            abort(422, 'Seule une candidature en validation peut être refusée.');
        }

        $data = $request->validate(['motif' => 'required|string']);

        $partenaire->statut = 'REFUSEE';
        $partenaire->decision = 'REFUSEE';
        $partenaire->motif_decision = $data['motif'];
        $partenaire->date_decision = now();
        $partenaire->decide_par = $request->user()->id;
        $partenaire->save();

        $this->audit->log('partenaire.refuse', 'organisation', (string) $partenaire->id, null, $data);

        return response()->json(['data' => $this->present($partenaire->fresh(), true)]);
    }

    public function suspendre(Organisation $partenaire, Request $request)
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }

        $data = $request->validate(['motif' => 'required|string']);

        $partenaire->statut = 'SUSPENDUE';
        $partenaire->date_suspension = now();
        $partenaire->motif_suspension = $data['motif'];
        $partenaire->save();

        // RG-60 : suspension du dépôt de nouvelles demandes (actifs désactivés)
        $partenaire->utilisateurs()->update(['actif' => false]);

        $this->audit->log('partenaire.suspendu', 'organisation', (string) $partenaire->id, null, $data);

        return response()->json(['data' => $this->present($partenaire->fresh())]);
    }

    /**
     * Réactivation d'un partenaire suspendu.
     */
    public function reactiver(Organisation $partenaire, Request $request)
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }

        $partenaire->statut = 'ACTIVE';
        $partenaire->date_suspension = null;
        $partenaire->motif_suspension = null;
        $partenaire->save();

        $partenaire->utilisateurs()->update(['actif' => true]);

        $this->audit->log('partenaire.reactiver', 'organisation', (string) $partenaire->id);

        return response()->json(['data' => $this->present($partenaire->fresh())]);
    }

    public function creerBareme(Organisation $partenaire, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'produit_id' => 'nullable|exists:produits,id',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date',
            'assiette' => 'required|in:PERCENT_COMMISSION_CABINET,PERCENT_PRIME_HT,FORFAIT',
            'taux_1ere_annee' => 'nullable|numeric',
            'taux_renouvellement' => 'nullable|numeric',
            'duree_reprise_mois' => 'nullable|integer',
            'modalite_reprise' => 'nullable|in:INTEGRAL,PRORATA',
        ]);

        BaremeCommission::where('organisation_id', $partenaire->id)->update(['courant' => false]);

        $bareme = BaremeCommission::create(array_merge($data, [
            'organisation_id' => $partenaire->id,
            'courant' => true,
        ]));

        $this->audit->log('bareme.cree', 'bareme_commission', (string) $bareme->id);

        return response()->json(['data' => $bareme], 201);
    }

    /**
     * RG-60 : contrôle d'une pièce réglementaire, avec validité et alertes.
     */
    public function controlePiece(Organisation $partenaire, PieceOrganisation $piece, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'statut_controle' => 'required|in:EN_ATTENTE,VALIDE,EXPIREE',
            'date_validite' => 'nullable|date',
            'commentaire' => 'nullable|string',
        ]);

        $piece->statut_controle = $data['statut_controle'];
        $piece->date_validite = $data['date_validite'] ?? null;
        $piece->commentaire_controle = $data['commentaire'] ?? null;
        $piece->controle_par = $request->user()->id;
        $piece->date_controle = now();
        $piece->save();

        $this->audit->log('piece.controlee', 'piece_organisation', (string) $piece->id, null, $data);

        return response()->json(['data' => $piece]);
    }

    private function present(Organisation $o, bool $avecStats = false): array
    {
        $pieces = $o->relationLoaded('pieces') ? $o->pieces : $o->pieces()->get();

        $data = [
            'id' => $o->id,
            'raison_sociale' => $o->raison_sociale,
            'forme_juridique' => $o->forme_juridique,
            'siren' => $o->siren,
            'siret' => $o->siret,
            'adresse' => $o->adresse,
            'ville' => $o->ville,
            'code_postal' => $o->code_postal,
            'numero_orias' => $o->numero_orias,
            'categories_orias' => $o->categories_orias,
            'statut' => $o->statut,
            'decision' => $o->decision,
            'motif_decision' => $o->motif_decision,
            'date_decision' => $o->date_decision,
            'actif' => $o->statut === 'ACTIVE',
            'date_activation' => $o->date_activation,
            'date_suspension' => $o->date_suspension,
            'motif_suspension' => $o->motif_suspension,
            'nb_utilisateurs' => $o->utilisateurs_count ?? $o->utilisateurs()->count(),
            'nb_contrats' => $o->demandes()->count(),
            'nb_pieces' => $pieces->count(),
            'nb_pieces_expirees' => $avecStats ? $pieces->filter(fn ($p) => $p->estExpiree())->count() : null,
        ];

        if ($avecStats) {
            $dirigeant = $o->relationLoaded('utilisateurs')
                ? $o->utilisateurs->firstWhere('role', User::ROLE_DIRIGEANT_PARTENAIRE)
                : $o->utilisateurs()->where('role', User::ROLE_DIRIGEANT_PARTENAIRE)->first();
            $data['email'] = $dirigeant?->email;
            $data['telephone'] = $dirigeant?->telephone ?? null;
            $data['documents'] = $pieces
                ->map(fn ($p) => $p->typeDocument?->libelle)
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        return $data;
    }

    private function presentPiece(PieceOrganisation $p): array
    {
        return [
            'id' => $p->id,
            'type_document_id' => $p->type_document_id,
            'type_code' => $p->typeDocument?->code,
            'type_libelle' => $p->typeDocument?->libelle,
            'document_id' => $p->document_id,
            'date_validite' => $p->date_validite,
            'statut_controle' => $p->statut_controle,
            'commentaire_controle' => $p->commentaire_controle,
            'expiree' => $p->estExpiree(),
        ];
    }

    /**
     * RG-60 : liste de contrôle réglementaire par défaut d'une candidature.
     */
    private function checklistVide(): array
    {
        return [
            ['cle' => 'ORIAS', 'libelle' => 'Inscription ORIAS à jour vérifiée', 'ok' => false],
            ['cle' => 'KBIS', 'libelle' => 'Extrait K-Bis / immatriculation fourni', 'ok' => false],
            ['cle' => 'ASSURANCE_RC', 'libelle' => 'Attestation RC professionnelle valide', 'ok' => false],
            ['cle' => 'CONFORMITE', 'libelle' => 'Conformité LCB-FT / dispositif anti-blanchiment', 'ok' => false],
            ['cle' => 'CONVENTION', 'libelle' => 'Convention de partenariat jurée et signée', 'ok' => false],
            ['cle' => 'SIREN', 'libelle' => 'SIREN / identité légale validés', 'ok' => false],
        ];
    }

    /**
     * Création des pièces réglementaires attendues lors de la candidature.
     */
    private function initialiserPieces(Organisation $partenaire): void
    {
        $exigibles = [
            'K_BIS' => 'Extrait K-Bis',
            'PIECE_IDENTITE' => "Pièce d'identité du dirigeant",
        ];
        foreach ($exigibles as $code => $libelle) {
            $td = TypeDocument::where('code', $code)->first();
            if ($td) {
                PieceOrganisation::create([
                    'organisation_id' => $partenaire->id,
                    'type_document_id' => $td->id,
                    'statut_controle' => 'EN_ATTENTE',
                ]);
            }
        }
    }

    /**
     * Statistiques d'activité d'un partenaire (cabinet).
     */
    private function statistiques(Organisation $partenaire): array
    {
        $demandes = \App\Models\DemandeTarification::where('organisation_id', $partenaire->id)
            ->where('statut', '!=', 'BROUILLON');
        $contrats = \App\Models\Contrat::where('organisation_id', $partenaire->id);
        $commissions = \App\Models\LigneCommission::where('organisation_id', $partenaire->id)
            ->where('nature', \App\Models\LigneCommission::NATURE_RETROCEDEE);

        return [
            'demandes_totales' => (clone $demandes)->count(),
            'demandes_en_cours' => (clone $demandes)->whereIn('statut', ['SOUMISE', 'EN_ETUDE', 'PIECES_MANQUANTES', 'DEVIS_EMIS'])->count(),
            'demandes_transformees' => (clone $demandes)->where('statut', 'TRANSFORMEE')->count(),
            'contrats_actifs' => (clone $contrats)->where('statut', 'EN_VIGUEUR')->count(),
            'contrats_totaux' => (clone $contrats)->count(),
            'primes_annee_cts' => (clone $contrats)->whereYear('created_at', now()->year)->sum('prime_ht_cts'),
            'commissions_annee_cts' => (clone $commissions)->whereYear('created_at', now()->year)->sum('montant_cts'),
        ];
    }
}
