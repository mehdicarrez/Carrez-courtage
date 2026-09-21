<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fournisseur;
use App\Models\Organisation;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class FournisseurController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    /**
     * Catalogue des fournisseurs (réservé au cabinet).
     * Chaque fournisseur porte ses champs partenaire dans la même table.
     */
    public function index(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $query = Fournisseur::where('actif', true);

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('nom', 'like', "%{$q}%")
                    ->orWhere('information', 'like', "%{$q}%")
                    ->orWhere('partenaire', 'like', "%{$q}%");
            });
        }

        $fournisseurs = $query->orderByDesc('created_at')->get();

        return response()->json([
            'data' => $fournisseurs->map(fn ($f) => $this->present($f)),
            'meta' => ['total' => $fournisseurs->count()],
        ]);
    }

    /**
     * Étape 1 : création d'un nouveau fournisseur (service*, nom*, descriptif, logo).
     */
    public function store(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'service' => 'required|string',
            'nom' => 'required|string',
            'information' => 'nullable|string',
            'type_assurance' => 'nullable|string',
            'url_assurance' => 'nullable|string',
            'logo' => 'nullable|file|image|max:2048',
        ]);

        $path = null;
        if ($request->hasFile('logo')) {
            $logo = $request->file('logo');
            $cle = Str::uuid().'.'.$logo->getClientOriginalExtension();
            $path = Storage::disk('local')->putFileAs('logos', $logo, $cle);
        }

        $fournisseur = Fournisseur::create([
            'id' => (string) Str::uuid(),
            'nom' => $data['nom'],
            'service' => $data['service'],
            'information' => $data['information'] ?? null,
            'type_assurance' => $data['type_assurance'] ?? null,
            'url_assurance' => $data['url_assurance'] ?? null,
            'logo' => $path,
            'actif' => true,
        ]);

        $this->audit->log('fournisseur.cree', 'fournisseur', (string) $fournisseur->id);

        return response()->json(['data' => $this->present($fournisseur)], 201);
    }

    /**
     * Étape 2 : saisie des infos partenaire du fournisseur (même table).
     */
    public function updateInformations(Fournisseur $fournisseur, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'partenaire' => 'nullable|string',
            'telephone' => 'nullable|string',
            'email' => 'nullable|email',
            'contrats' => 'nullable|integer|min:0',
            'montant_primes' => 'nullable|numeric|min:0',
            'dernier_contrat' => 'nullable|date',
            'nom_document' => 'nullable|string',
            'document' => 'nullable|file',
        ]);

        $documents = $fournisseur->documents ?: [];

        if ($request->hasFile('document')) {
            $fichier = $request->file('document');
            if ($fichier->getSize() > config('extranet.upload_max_mo', 25) * 1024 * 1024) {
                abort(422, 'Fichier trop volumineux.');
            }
            $cle = Str::uuid().'.'.$fichier->getClientOriginalExtension();
            $chemin = Storage::disk('local')->putFileAs('documents', $fichier, $cle);
            $documents[] = [
                'nom' => $data['nom_document'] ?? $fichier->getClientOriginalName(),
                'fichier' => $fichier->getClientOriginalName(),
                'cle' => $chemin,
                'date' => now()->toDateTimeString(),
            ];
        }

        $fournisseur->update([
            'partenaire' => $data['partenaire'] ?? $fournisseur->partenaire,
            'telephone' => $data['telephone'] ?? $fournisseur->telephone,
            'email' => $data['email'] ?? $fournisseur->email,
            'contrats' => $data['contrats'] ?? $fournisseur->contrats,
            'montant_primes' => $data['montant_primes'] ?? $fournisseur->montant_primes,
            'dernier_contrat' => $data['dernier_contrat'] ?? $fournisseur->dernier_contrat,
            'documents' => $documents,
        ]);

        $this->audit->log('fournisseur.informations', 'fournisseur', (string) $fournisseur->id);

        return response()->json(['data' => $this->present($fournisseur->fresh())]);
    }

    /**
     * Liste légère des fournisseurs devenus partenaires (avec logo),
     * accessible au cabinet ET aux partenaires (création de demandes ciblées).
     */
    public function partenairesActifs()
    {
        $partenaires = Fournisseur::where('actif', true)
            ->where('devenir_partenaire', true)
            ->orderBy('nom')
            ->get();

        return response()->json([
            'data' => $partenaires->map(fn (Fournisseur $f) => [
                'id' => $f->id,
                'nom' => $f->nom,
                'partenaire' => $f->partenaire,
                'devenir_partenaire' => $f->devenir_partenaire,
                'logo_url' => $f->logo
                    ? URL::temporarySignedRoute('fournisseurs.logo', now()->addMinutes(1440), ['fournisseur' => $f->id])
                    : null,
            ]),
        ]);
    }

    /**
     * Toggle : active / désactive l'affichage du fournisseur
     * dans le tableau des partenaires.
     *
     * À l'activation, un e-mail et un mot de passe doivent être fournis :
     * le compte utilisateur PARTENAIRE lié au fournisseur est créé (ou réactivé)
     * avec ce mot de passe pour permettre la connexion à l'espace partenaire.
     */
    public function togglePartenaire(Fournisseur $fournisseur, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $nouvelEtat = !$fournisseur->devenir_partenaire;

        if ($nouvelEtat) {
            $data = $request->validate([
                'email' => 'required|email',
                'mot_de_passe' => 'required|string|min:8',
            ]);

            $fournisseur->update([
                'devenir_partenaire' => true,
                'email' => $data['email'],
            ]);

            $partenaire = $this->organismePartenaire($fournisseur);
            $this->reprendreLogo($fournisseur, $partenaire);

            $this->creerOuActiverCompte($fournisseur, $data['email'], $data['mot_de_passe']);
        } else {
            $fournisseur->update(['devenir_partenaire' => false]);
            $this->desactiverCompte($fournisseur);
        }

        $this->audit->log(
            $nouvelEtat ? 'fournisseur.devenir_partenaire' : 'fournisseur.retrait_partenaire',
            'fournisseur',
            (string) $fournisseur->id
        );

        return response()->json([
            'data' => $this->present($fournisseur->fresh()),
        ]);
    }

    /**
     * Active directement le partenaire dans organisations s'il n'existe pas déjà.
     * L'e-mail et le mot de passe du compte de connexion sont obligatoires.
     */
    public function activer(Fournisseur $fournisseur, Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $data = $request->validate([
            'email' => 'required|email',
            'mot_de_passe' => 'required|string|min:8',
        ]);

        $fournisseur->update([
            'devenir_partenaire' => true,
            'email' => $data['email'],
        ]);

        $partenaire = $this->organismePartenaire($fournisseur);
        $this->reprendreLogo($fournisseur, $partenaire);
        $this->audit->log('fournisseur.active', 'organisation', (string) $partenaire->id);

        $this->creerOuActiverCompte($fournisseur, $data['email'], $data['mot_de_passe']);

        return response()->json([
            'data' => $this->presentOrganisation($partenaire),
        ], 201);
    }

    /**
     * Reprise du logo du fournisseur sur l'organisation partenaire
     * uniquement si celle-ci n'en a pas déjà un.
     */
    private function reprendreLogo(Fournisseur $fournisseur, Organisation $partenaire): void
    {
        if ($fournisseur->logo && !$partenaire->logo) {
            $partenaire->update(['logo' => $fournisseur->logo]);
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

        $partenaire = Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => Organisation::TYPE_PARTENAIRE,
            'raison_sociale' => $fournisseur->nom,
            'statut' => 'ACTIVE',
            'date_activation' => now(),
        ]);

        return $partenaire;
    }

    /**
     * Crée ou réactive le compte PARTENAIRE lié au fournisseur
     * avec l'e-mail et le mot de passe choisis par le cabinet.
     */
    private function creerOuActiverCompte(Fournisseur $fournisseur, string $email, string $motDePasse): void
    {
        if (User::where('email', $email)->where('fournisseur_id', '!=', $fournisseur->id)->exists()) {
            abort(422, 'Cet e-mail est déjà utilisé par un autre compte.');
        }

        $user = User::where('fournisseur_id', $fournisseur->id)->first();

        if ($user) {
            $user->update([
                'email' => $email,
                'password' => Hash::make($motDePasse),
                'actif' => true,
            ]);

            $this->audit->log('partenaire.compte_reactive', 'user', (string) $user->id);

            return;
        }

        $user = User::create([
            'fournisseur_id' => $fournisseur->id,
            'organisation_id' => $this->organismePartenaire($fournisseur)->id,
            'name' => $fournisseur->partenaire ?: $fournisseur->nom,
            'email' => $email,
            'password' => Hash::make($motDePasse),
            'role' => User::ROLE_PARTENAIRE,
            'actif' => true,
        ]);

        $this->audit->log('partenaire.compte_cree', 'user', (string) $user->id);
    }

    private function desactiverCompte(Fournisseur $fournisseur): void
    {
        $user = User::where('fournisseur_id', $fournisseur->id)->first();

        if ($user) {
            $user->tokens()->delete();
            $user->update(['actif' => false]);
            $this->audit->log('partenaire.compte_desactive', 'user', (string) $user->id);
        }
    }
    /**
     * Affichage du logo via URL signée (route publique).
     */
    public function logo(Fournisseur $fournisseur)
    {
        if (!$fournisseur->logo || !Storage::disk('local')->exists($fournisseur->logo)) {
            abort(404);
        }

        return Storage::disk('local')->response($fournisseur->logo);
    }

    /**
     * Visualisation d'un document joint au fournisseur via URL signée.
     */
    public function document(Fournisseur $fournisseur, string $cle)
    {
        $document = collect($fournisseur->documents ?: [])
            ->first(fn ($d) => basename((string) ($d['cle'] ?? '')) === $cle);

        if (!$document || empty($document['cle'])) {
            abort(404);
        }

        $stocke = $document['cle'];
        if (!str_starts_with($stocke, 'documents/')) {
            $stocke = 'documents/'.$stocke;
        }

        if (!Storage::disk('local')->exists($stocke)) {
            abort(404);
        }

        return Storage::disk('local')->response($stocke, $document['fichier'] ?? null);
    }

    private function present(Fournisseur $f): array
    {
        $duree = now()->addMinutes(1440);

        return [
            'id' => $f->id,
            'nom' => $f->nom,
            'service' => $f->service,
            'logo' => $f->logo,
            'logo_url' => $f->logo
                ? URL::temporarySignedRoute('fournisseurs.logo', $duree, ['fournisseur' => $f->id])
                : null,
            'information' => $f->information,
            'type_assurance' => $f->type_assurance,
            'url_assurance' => $f->url_assurance,
            'actif' => $f->actif,
            'devenir_partenaire' => $f->devenir_partenaire,
            'partenaire' => $f->partenaire,
            'telephone' => $f->telephone,
            'email' => $f->email,
            'contrats' => $f->contrats,
            'montant_primes' => $f->montant_primes,
            'dernier_contrat' => $f->dernier_contrat,
            'documents' => collect($f->documents ?: [])->map(fn ($d) => [
                'nom' => $d['nom'] ?? null,
                'fichier' => $d['fichier'] ?? null,
                'date' => $d['date'] ?? null,
                'url' => URL::temporarySignedRoute('fournisseurs.document', $duree, [
                    'fournisseur' => $f->id,
                    'cle' => basename((string) ($d['cle'] ?? '')),
                ]),
            ])->values()->all(),
        ];
    }

    private function presentOrganisation(Organisation $o): array
    {
        return [
            'id' => $o->id,
            'raison_sociale' => $o->raison_sociale,
            'statut' => $o->statut,
        ];
    }
}