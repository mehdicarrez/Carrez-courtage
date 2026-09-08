<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\DemandeTarification;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Répertoire de clients (CABINET et partenaires) + rattachement aux demandes.
 */
class ClientController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    public function index(Request $request)
    {
        $query = Client::with('organisation', 'utilisateurs');

        // RG-01 : cloisonnement par le trait global scope (admin voit tout)

        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('nom', 'like', "%{$q}%")
                    ->orWhere('prenom', 'like', "%{$q}%")
                    ->orWhere('raison_sociale', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('siren', 'like', "%{$q}%")
                    ->orWhere('ville', 'like', "%{$q}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $sort = $request->query('sort', 'recent');
        if ($sort === 'nom') {
            $query->orderBy('nom')->orderBy('prenom');
        } else {
            $query->orderByDesc('created_at');
        }

        $clients = $query->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => $clients->map(fn (Client $c) => $this->present($c)),
            'meta' => ['total' => $clients->total(), 'per_page' => $clients->perPage()],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->valider($request);

        $complement = array_filter([
            'personne_a_contacter' => $data['personne_a_contacter'] ?? null,
            'forme_juridique' => $data['forme_juridique'] ?? null,
            'tel2' => $data['tel2'] ?? null,
            'preference_contact' => $data['preference_contact'] ?? null,
            'email2' => $data['email2'] ?? null,
            'origine' => $data['origine'] ?? null,
            'rgpd_consentement' => $data['rgpd_consentement'] ?? false,
            'exclure_marketing' => $data['exclure_marketing'] ?? false,
        ], fn ($v) => $v !== null && $v !== false && $v !== '');

        $client = Client::create([
            'organisation_id' => $request->user()->organisation_id,
            'type' => $data['type'],
            'civilite' => $data['civilite'] ?? null,
            'nom' => $data['nom'] ?? null,
            'prenom' => $data['prenom'] ?? null,
            'date_naissance' => $data['date_naissance'] ?? null,
            'raison_sociale' => $data['raison_sociale'] ?? null,
            'siren' => $data['siren'] ?? null,
            'siret' => $data['siret'] ?? null,
            'email' => $data['email'] ?? null,
            'telephone' => $data['telephone'] ?? null,
            'adresse' => $data['adresse'] ?? null,
            'code_postal' => $data['code_postal'] ?? null,
            'ville' => $data['ville'] ?? null,
            'complement' => $complement ?: null,
        ]);

        $this->audit->log('client.cree', 'client', (string) $client->id);

        return response()->json(['data' => $this->present($client)], 201);
    }

    public function show(Client $client, Request $request)
    {
        $client->load('organisation', 'utilisateurs');
        return response()->json(['data' => $this->present($client)]);
    }

    public function update(Client $client, Request $request)
    {
        $data = $this->valider($request);
        $client->fill(array_intersect_key(
            $data,
            array_flip(['type', 'civilite', 'nom', 'prenom', 'date_naissance', 'raison_sociale', 'siren', 'siret', 'email', 'telephone', 'adresse', 'code_postal', 'ville', 'notes'])
        ))->save();

        $complementKeys = ['personne_a_contacter', 'forme_juridique', 'tel2', 'preference_contact', 'email2', 'origine', 'rgpd_consentement', 'exclure_marketing'];
        $complement = $client->complement ?? [];
        foreach ($complementKeys as $key) {
            if (array_key_exists($key, $data) || array_key_exists($key, $request->all())) {
                $complement[$key] = $data[$key] ?? null;
            }
        }
        $client->complement = array_filter($complement, fn ($v) => $v !== null && $v !== false && $v !== '');
        $client->saveQuietly();

        $this->audit->log('client.modifie', 'client', (string) $client->id, null, null, null, null, (string) $client->organisation_id);

        return response()->json(['data' => $this->present($client)]);
    }

    public function destroy(Client $client, Request $request)
    {
        if ($client->demandes()->where('statut', '!=', 'BROUILLON')->exists()) {
            throw ValidationException::withMessages(['client' => ['Ce client est rattaché à une demande active et ne peut être supprimé.']]);
        }

        $client->delete();
        $this->audit->log('client.supprime', 'client', (string) $client->id);

        return response()->json(['ok' => true]);
    }

    /**
     * Import CSV de clients (séparateur auto-détecté, BOM tolérée).
     * Colonnes acceptées : type, civilite, nom, prenom, date_naissance, raison_sociale,
     * siren, siret, email, telephone, adresse, code_postal, ville.
     */
    public function importCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        if (!$handle) {
            abort(422, 'Impossible de lire le fichier.');
        }

        $firstLine = fgets($handle);
        $hasBom = $firstLine !== false && str_starts_with($firstLine, "\xEF\xBB\xBF");
        $firstLineClean = $hasBom ? substr($firstLine, 3) : $firstLine;
        $sep = (substr_count((string) $firstLineClean, ';') >= substr_count((string) $firstLineClean, ',')) ? ';' : ',';
        rewind($handle);
        if ($hasBom) {
            fread($handle, 3);
        }

        $header = fgetcsv($handle, 0, $sep);
        if (!$header || count($header) < 2) {
            fclose($handle);
            abort(422, 'Fichier vide ou format invalide.');
        }

        $headerMap = array_map('trim', array_map('strtolower', $header));
        $crees = 0;
        $erreurs = [];
        $ligneNum = 1;

        while (($row = fgetcsv($handle, 0, $sep)) !== false) {
            $ligneNum++;
            $data = array_combine($headerMap, array_map('trim', $row));

            $type = strtoupper($data['type'] ?? 'PHYSIQUE') === 'MORALE' ? 'MORALE' : 'PHYSIQUE';
            $nom = $data['nom'] ?? null;
            $prenom = $data['prenom'] ?? null;
            $rs = $data['raison_sociale'] ?? null;

            if ($type === 'MORALE' && !$rs) {
                $erreurs[] = ['ligne' => $ligneNum, 'cause' => 'Raison sociale manquante'];
                continue;
            }
            if ($type === 'PHYSIQUE' && (!$nom || !$prenom)) {
                $erreurs[] = ['ligne' => $ligneNum, 'cause' => 'Nom ou prénom manquant'];
                continue;
            }

            $email = $data['email'] ?? null;
            if ($email) {
                $doublon = Client::where('email', $email)->whereNotNull('email')->first();
                if ($doublon) {
                    $erreurs[] = ['ligne' => $ligneNum, 'cause' => "E-mail déjà existant ($email)"];
                    continue;
                }
            }

            Client::create([
                'organisation_id' => $request->user()->organisation_id,
                'type' => $type,
                'civilite' => $data['civilite'] ?? null,
                'nom' => $nom,
                'prenom' => $prenom,
                'date_naissance' => $data['date_naissance'] ?? null,
                'raison_sociale' => $rs,
                'siren' => $data['siren'] ?? null,
                'siret' => $data['siret'] ?? null,
                'email' => $email,
                'telephone' => $data['telephone'] ?? null,
                'adresse' => $data['adresse'] ?? null,
                'code_postal' => $data['code_postal'] ?? null,
                'ville' => $data['ville'] ?? null,
            ]);
            $crees++;
        }

        fclose($handle);

        $this->audit->log('client.import_csv', 'client', null, null, ['crees' => $crees, 'erreurs' => count($erreurs)]);

        return response()->json(['crees' => $crees, 'erreurs' => $erreurs]);
    }

    /**
     * Rattache un client du répertoire à une demande.
     */
    public function affecterADemande(DemandeTarification $demande, Request $request)
    {
        $data = $request->validate([
            'client_id' => 'required|exists:clients,id',
        ]);

        $client = Client::findOrFail($data['client_id']);

        $demandeAvant = $demande->client_id;
        $demande->client_id = $client->id;
        $demande->save();

        $this->audit->log(
            'demande.client_affecte',
            'demande_tarification',
            (string) $demande->id,
            ['client_id' => $demandeAvant],
            ['client_id' => $client->id]
        );

        return response()->json(['data' => $this->present($client)]);
    }

    /**
     * Rattache en masse un client à plusieurs demandes sélectionnées.
     */
    public function affectationMassive(Request $request)
    {
        $data = $request->validate([
            'demande_ids' => 'required|array|min:1',
            'demande_ids.*' => 'exists:demandes_tarification,id',
            'client_id' => 'required|exists:clients,id',
        ]);

        $client = Client::findOrFail($data['client_id']);
        $misAJour = 0;

        foreach ($data['demande_ids'] as $demandeId) {
            $demande = DemandeTarification::find($demandeId);
            if (!$demande) {
                continue;
            }
            $demande->client_id = $client->id;
            $demande->save();
            $this->audit->log('demande.client_affecte', 'demande_tarification', (string) $demande->id, null, ['client_id' => $client->id]);
            $misAJour++;
        }

        return response()->json(['mis_a_jour' => $misAJour]);
    }

    /**
     * Liste des utilisateurs éligibles à l'affectation de clients :
     * ceux dont l'accès est défini sur « Limités aux clients attribués ».
     */
    public function utilisateursAffectables(Request $request)
    {
        $users = User::where('role', User::ROLE_CONSEILLER)
            ->where('actif', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $users->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
            ]),
        ]);
    }

    /**
     * Affectation des clients attribués à un utilisateur (accès limité).
     * Lève une erreur si l'utilisateur n'est pas en accès limité.
     */
    public function enregistrerAffectation(Request $request, User $user)
    {
        if ($user->access_level !== User::ACCESS_CLIENTS_attribues) {
            throw ValidationException::withMessages([
                'user' => ["L'accès de cet utilisateur n'est pas « Limité aux clients attribués »."],
            ]);
        }

        $data = $request->validate([
            'client_ids' => 'nullable|array',
            'client_ids.*' => 'exists:clients,id',
        ]);

        $user->clients()->sync($data['client_ids'] ?? []);

        $this->audit->log(
            'client.affectation',
            'user',
            (string) $user->id,
            null,
            ['client_ids' => $data['client_ids'] ?? []],
            $user->organisation_id
        );

        return response()->json(['ok' => true]);
    }

    private function valider(Request $request): array    {
        return $request->validate([
            'type' => 'required|in:PHYSIQUE,MORALE',
            'civilite' => 'nullable|string|max:10',
            'nom' => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
            'date_naissance' => 'nullable|date',
            'raison_sociale' => 'nullable|string|max:255',
            'siren' => 'nullable|string|max:14',
            'siret' => 'nullable|string|max:14',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:30',
            'adresse' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:10',
            'ville' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:5000',
            'personne_a_contacter' => 'nullable|string|max:120',
            'forme_juridique' => 'nullable|string|max:120',
            'tel2' => 'nullable|string|max:30',
            'preference_contact' => 'nullable|string|max:100',
            'email2' => 'nullable|email|max:255',
            'origine' => 'nullable|string|max:100',
            'rgpd_consentement' => 'nullable|boolean',
            'exclure_marketing' => 'nullable|boolean',
        ]);
    }

    private function present(Client $c): array
    {
        return [
            'id' => $c->id,
            'type' => $c->type,
            'civilite' => $c->civilite,
            'nom' => $c->nom,
            'prenom' => $c->prenom,
            'nom_complet' => $c->getNomCompletAttribute(),
            'date_naissance' => $c->date_naissance?->toDateString(),
            'raison_sociale' => $c->raison_sociale,
            'siren' => $c->siren,
            'siret' => $c->siret,
            'email' => $c->email,
            'telephone' => $c->telephone,
            'adresse' => $c->adresse,
            'code_postal' => $c->code_postal,
            'ville' => $c->ville,
            'complement' => $c->complement ?? [],
            'personne_a_contacter' => $c->complement['personne_a_contacter'] ?? null,
            'tel2' => $c->complement['tel2'] ?? null,
            'email2' => $c->complement['email2'] ?? null,
            'preference_contact' => $c->complement['preference_contact'] ?? null,
            'forme_juridique' => $c->complement['forme_juridique'] ?? null,
            'origine' => $c->complement['origine'] ?? null,
            'rgpd_consentement' => $c->complement['rgpd_consentement'] ?? false,
            'exclure_marketing' => $c->complement['exclure_marketing'] ?? false,
            'notes' => $c->notes,
            'organisation_id' => $c->organisation_id,
            'utilisateurs' => $c->relationLoaded('utilisateurs')
                ? $c->utilisateurs->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                ])->values()
                : [],
            'contrats_actifs' => $c->contratsActifsCount(),
            'primes_total' => $c->primesTotales(),
        ];
    }

    public function demandes(Client $client)
    {
        $demandes = $client->demandes()
            ->with('branche', 'gestionnaire')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $demandes->map(fn (DemandeTarification $d) => $this->presentDemande($d)),
            'meta' => ['total' => $demandes->count()],
        ]);
    }

    public function contrats(Client $client)
    {
        $contrats = $client->contrats()
            ->with('produit')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $contrats->map(fn (\App\Models\Contrat $c) => $this->presentContrat($c)),
            'meta' => ['total' => $contrats->count()],
        ]);
    }

    private function presentContrat(\App\Models\Contrat $c): array
    {
        return [
            'id' => $c->id,
            'reference' => $c->reference,
            'numero_police' => $c->numero_police,
            'statut' => $c->statut,
            'produit' => $c->produit?->nom,
            'date_effet' => $c->date_effet?->toDateString(),
            'date_echeance_principale' => $c->date_echeance_principale?->toDateString(),
            'prime_ht_cts' => $c->prime_ht_cts,
            'taxes_cts' => $c->taxes_cts,
            'prime_ttc_cts' => $c->prime_ttc_cts,
            'fractionnement' => $c->fractionnement,
            'created_at' => $c->created_at,
        ];
    }

    private function presentDemande(DemandeTarification $d): array
    {
        return [
            'id' => $d->id,
            'reference' => $d->reference,
            'statut' => $d->statut,
            'branche' => $d->branche?->nom,
            'gestionnaire' => $d->gestionnaire?->name,
            'origine' => $d->origine,
            'date_soumission' => $d->date_soumission,
            'date_statut' => $d->date_statut,
            'created_at' => $d->created_at,
        ];
    }

    public function factures(Client $client)
    {
        $factures = $client->factures()
            ->with('lignes')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $factures->map(fn (\App\Models\Facture $f) => $this->presentFacture($f)),
            'meta' => ['total' => $factures->count()],
        ]);
    }

    private function presentFacture(\App\Models\Facture $f): array
    {
        return [
            'id' => $f->id,
            'reference' => $f->reference,
            'souscripteur' => $f->souscripteur,
            'adresse' => $f->adresse,
            'code_postal' => $f->code_postal,
            'ville' => $f->ville,
            'contact_commercial' => $f->contact_commercial,
            'date_facture' => $f->date_facture?->toDateString(),
            'date_echeance' => $f->date_echeance?->toDateString(),
            'moyens_reglement' => $f->moyens_reglement ?? [],
            'montant_ht_cts' => $f->montant_ht_cts,
            'montant_taxes_cts' => $f->montant_taxes_cts,
            'montant_ttc_cts' => $f->montant_ttc_cts,
            'statut' => $f->statut,
            'date_encaissee' => $f->date_encaissee?->toDateString(),
            'created_at' => $f->created_at,
            'lignes' => $f->lignes->map(fn (\App\Models\FactureLigne $l) => [
                'id' => $l->id,
                'type' => $l->type,
                'designation' => $l->designation,
                'quantite' => $l->quantite,
                'prix_unitaire_ht_cts' => $l->prix_unitaire_ht_cts,
                'taxe' => $l->taxe,
                'total_ht_cts' => $l->total_ht_cts,
                'total_taxes_cts' => $l->total_taxes_cts,
                'total_ttc_cts' => $l->total_ttc_cts,
            ]),
        ];
    }

    public function sinistres(Client $client)
    {
        $sinistres = $client->sinistres()
            ->with('contrat.produit', 'suiviPar')
            ->orderByDesc('date_survenance')
            ->get();

        return response()->json([
            'data' => $sinistres->map(fn (\App\Models\Sinistre $s) => $this->presentSinistre($s)),
            'meta' => ['total' => $sinistres->count()],
        ]);
    }

    private function presentSinistre(\App\Models\Sinistre $s): array
    {
        return [
            'id' => $s->id,
            'numero' => $s->numero,
            'ref_compagnie' => $s->ref_compagnie,
            'type_contrat' => $s->type_contrat ?? $s->contrat?->produit?->nom,
            'contrat_reference' => $s->contrat_reference ?? $s->contrat?->reference,
            'contrat_numero_police' => $s->contrat?->numero_police,
            'compagnie' => $s->compagnie ?? $s->contrat?->produit?->compagnie,
            'garantie' => $s->garantie ?? $s->nature,
            'statut' => $s->statut,
            'etat' => $s->etat,
            'nature' => $s->nature,
            'suivi_par_id' => $s->suivi_par_id,
            'suivi_par_name' => $s->suiviPar?->name,
            'franchise' => $s->franchise,
            'circonstance' => $s->circonstance,
            'description_dommages' => $s->description_dommages,
            'responsabilite' => $s->responsabilite,
            'beneficiaire' => $s->beneficiaire,
            'expertise' => $s->expertise,
            'recours' => $s->recours,
            'cloture_le' => $s->cloture_le?->toDateString(),
            'date_survenance' => $s->date_survenance?->toDateString(),
            'date_declaration' => $s->date_declaration?->toDateString(),
            'montant_estime_cts' => $s->montant_estime_cts,
            'montant_regle_cts' => $s->montant_regle_cts,
            'gestionnaire_porteur' => $s->gestionnaire_porteur,
            'declare_par' => $s->declare_par,
        ];
    }

    public function creerFacture(Client $client, Request $request)
    {
        $data = $request->validate([
            'souscripteur' => 'nullable|string|max:255',
            'adresse' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:10',
            'ville' => 'nullable|string|max:100',
            'contact_commercial' => 'nullable|string|max:255',
            'date_facture' => 'required|date',
            'date_echeance' => 'required|date',
            'moyens_reglement' => 'nullable|array',
            'moyens_reglement.*' => 'string|max:50',
        ]);

        $refs = app(\App\Services\ReferenceService::class);

        $facture = \App\Models\Facture::create([
            'organisation_id' => $request->user()->organisation_id,
            'client_id' => $client->id,
            'reference' => $refs->facture(),
            'souscripteur' => $data['souscripteur'] ?? $client->nom_complet,
            'adresse' => $data['adresse'] ?? $client->adresse,
            'code_postal' => $data['code_postal'] ?? $client->code_postal,
            'ville' => $data['ville'] ?? $client->ville,
            'contact_commercial' => $data['contact_commercial'] ?? null,
            'date_facture' => $data['date_facture'],
            'date_echeance' => $data['date_echeance'],
            'moyens_reglement' => $data['moyens_reglement'] ?? [],
            'statut' => 'BROUILLON',
        ]);

        $this->audit->log('facture.creee', 'facture', (string) $facture->id);

        return response()->json(['data' => $this->presentFacture($facture)], 201);
    }

    public function ajouterLignes(\App\Models\Facture $facture, Request $request)
    {
        $data = $request->validate([
            'lignes' => 'required|array|min:1',
            'lignes.*.type' => 'nullable|string|max:100',
            'lignes.*.designation' => 'required|string|max:255',
            'lignes.*.quantite' => 'required|numeric|min:0',
            'lignes.*.prix_unitaire_ht_cts' => 'required|integer|min:0',
            'lignes.*.taxe' => 'required|numeric|min:0|max:100',
        ]);

        $facture->lignes()->delete();

        foreach ($data['lignes'] as $l) {
            $qte = (float) $l['quantite'];
            $pu = (int) $l['prix_unitaire_ht_cts'];
            $taxePct = (float) $l['taxe'];

            $totalHt = (int) round($qte * $pu);
            $totalTaxes = (int) round($totalHt * $taxePct / 100);
            $totalTtc = $totalHt + $totalTaxes;

            \App\Models\FactureLigne::create([
                'facture_id' => $facture->id,
                'type' => $l['type'] ?? null,
                'designation' => $l['designation'],
                'quantite' => $qte,
                'prix_unitaire_ht_cts' => $pu,
                'taxe' => $taxePct,
                'total_ht_cts' => $totalHt,
                'total_taxes_cts' => $totalTaxes,
                'total_ttc_cts' => $totalTtc,
            ]);
        }

        $facture->recalculeTotaux();
        $facture->statut = 'EMISE';
        $facture->save();

        $this->audit->log('facture.lignes', 'facture', (string) $facture->id);

        return response()->json(['data' => $this->presentFacture($facture->load('lignes'))]);
    }

    public function creerSinistre(Client $client, Request $request)
    {
        $data = $request->validate([
            'contrat_id' => 'required|exists:contrats,id',
            'date_survenance' => 'nullable|date',
            'ref_compagnie' => 'nullable|string|max:100',
            'suivi_par_id' => 'nullable|exists:users,id',
            'statut' => 'required|in:NON_OUVERT,OUVERT,EN_COURS,REGLE,REJETE,CLASURE',
            'garantie' => 'nullable|string|max:255',
            'franchise' => 'nullable|string|max:255',
            'circonstance' => 'nullable|string|max:2000',
            'description_dommages' => 'nullable|string|max:5000',
            'responsabilite' => 'nullable|string|max:255',
            'montant_estime_cts' => 'nullable|integer|min:0',
            'beneficiaire' => 'nullable|string|max:255',
            'expertise' => 'nullable|string|max:255',
            'recours' => 'nullable|string|max:255',
            'etat' => 'required|in:OUVERT,EN_COURS_EXPERTISE,CLOS,SANS_SUITE',
            'cloture_le' => 'nullable|date',
        ]);

        $contrat = \App\Models\Contrat::where('client_id', $client->id)->findOrFail($data['contrat_id']);
        $refs = app(\App\Services\ReferenceService::class);

        $sinistre = \App\Models\Sinistre::create([
            'contrat_id' => $contrat->id,
            'numero' => $refs->sinistre(),
            'ref_compagnie' => $data['ref_compagnie'] ?? null,
            'type_contrat' => $contrat->produit?->nom,
            'compagnie' => $contrat->produit?->compagnie,
            'garantie' => $data['garantie'] ?? $contrat->produit?->nom,
            'date_survenance' => $data['date_survenance'] ?? now(),
            'date_declaration' => now(),
            'nature' => $data['garantie'] ?? null,
            'statut' => $data['statut'],
            'etat' => $data['etat'],
            'suivi_par_id' => $data['suivi_par_id'] ?? null,
            'franchise' => $data['franchise'] ?? null,
            'circonstance' => $data['circonstance'] ?? null,
            'description_dommages' => $data['description_dommages'] ?? null,
            'responsabilite' => $data['responsabilite'] ?? null,
            'montant_estime_cts' => $data['montant_estime_cts'] ?? null,
            'beneficiaire' => $data['beneficiaire'] ?? null,
            'expertise' => $data['expertise'] ?? null,
            'recours' => $data['recours'] ?? null,
            'cloture_le' => $data['cloture_le'] ?? null,
            'declare_par' => 'CABINET',
        ]);

        $this->audit->log('sinistre.cree', 'sinistre', (string) $sinistre->id);

        return response()->json(['data' => $this->presentSinistre($sinistre->load('contrat.produit', 'suiviPar'))], 201);
    }

    public function taches(Client $client)
    {
        $taches = $client->taches()
            ->with('assignee', 'creePar')
            ->orderByRaw("CASE statut WHEN 'TERMINEE' THEN 1 ELSE 0 END")
            ->orderBy('date_echeance')
            ->get();

        return response()->json([
            'data' => $taches->map(fn (\App\Models\Tache $t) => $this->presentTache($t)),
            'meta' => ['total' => $taches->count()],
        ]);
    }

    /**
     * Liste des tâches de tous les clients (filtrée par statut/priorité).
     */
    public function toutesTaches(Request $request)
    {
        $query = \App\Models\Tache::with('client', 'assignee', 'creePar');

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }
        if ($request->filled('priorite')) {
            $query->where('priorite', $request->query('priorite'));
        }
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('objet', 'like', "%{$q}%")
                    ->orWhere('titre', 'like', "%{$q}%")
                    ->orWhere('reference', 'like', "%{$q}%");
            });
        }

        $taches = $query->orderByRaw("CASE statut WHEN 'TERMINEE' THEN 1 ELSE 0 END")
            ->orderBy('date_echeance')
            ->get();

        return response()->json([
            'data' => $taches->map(fn (\App\Models\Tache $t) => $this->presentTache($t)),
            'meta' => ['total' => $taches->count()],
        ]);
    }

    public function creerTache(Client $client, Request $request)
    {
        $data = $request->validate([
            'titre' => 'required|string|max:255',
            'type' => 'required|in:' . implode(',', \App\Models\Tache::TYPES),
            'objet' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'priorite' => 'required|in:FAIBLE,BASSE,MOYENNE,HAUTE,URGENTE',
            'statut' => 'required|in:A_FAIRE,EN_COURS,TERMINEE',
            'date_echeance' => 'nullable|date',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'montant' => 'nullable|numeric|min:0',
            'avancement' => 'nullable|integer|between:0,100',
            'temps_passe_h' => 'nullable|numeric|min:0',
            'assignee_id' => 'nullable|exists:users,id',
        ]);

        $tache = \App\Models\Tache::create([
            'client_id' => $client->id,
            'reference' => app(\App\Services\ReferenceService::class)->tache(),
            'titre' => $data['titre'],
            'type' => $data['type'] ?? 'SINISTRE',
            'objet' => $data['objet'],
            'description' => $data['description'] ?? null,
            'priorite' => $data['priorite'],
            'statut' => $data['statut'],
            'date_echeance' => $data['date_echeance'] ?? null,
            'date_debut' => $data['date_debut'] ?? null,
            'date_fin' => $data['date_fin'] ?? null,
            'montant' => $data['montant'] ?? null,
            'avancement' => $data['avancement'] ?? 0,
            'temps_passe_h' => $data['temps_passe_h'] ?? null,
            'assignee_id' => $data['assignee_id'] ?? null,
            'cree_par_id' => $request->user()->id,
            'terminee_le' => $data['statut'] === 'TERMINEE' ? now() : null,
        ]);

        $this->audit->log('tache.creee', 'tache', (string) $tache->id);

        return response()->json(['data' => $this->presentTache($tache)], 201);
    }

    public function majTache(\App\Models\Tache $tache, Request $request)
    {
        $data = $request->validate([
            'titre' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
            'priorite' => 'nullable|in:FAIBLE,BASSE,MOYENNE,HAUTE,URGENTE',
            'statut' => 'nullable|in:A_FAIRE,EN_COURS,TERMINEE',
            'date_echeance' => 'nullable|date',
            'assignee_id' => 'nullable|exists:users,id',
        ]);

        if (array_key_exists('statut', $data)) {
            $tache->statut = $data['statut'];
            $tache->terminee_le = $data['statut'] === 'TERMINEE' ? now() : null;
        }
        $tache->fill(array_intersect_key($data, array_flip(['titre', 'type', 'objet', 'description', 'priorite', 'date_echeance', 'date_debut', 'date_fin', 'montant', 'avancement', 'temps_passe_h', 'assignee_id'])));
        $tache->save();

        return response()->json(['data' => $this->presentTache($tache->refresh())]);
    }

    public function supprimerTache(\App\Models\Tache $tache)
    {
        $tache->delete();
        return response()->json(['ok' => true]);
    }

    private function presentTache(\App\Models\Tache $t): array
    {
        return [
            'id' => $t->id,
            'reference' => $t->reference,
            'titre' => $t->titre,
            'type' => $t->type,
            'objet' => $t->objet,
            'description' => $t->description,
            'priorite' => $t->priorite,
            'statut' => $t->statut,
            'date_echeance' => $t->date_echeance?->toDateString(),
            'date_debut' => $t->date_debut?->toDateString(),
            'date_fin' => $t->date_fin?->toDateString(),
            'montant' => $t->montant,
            'avancement' => $t->avancement,
            'temps_passe_h' => $t->temps_passe_h,
            'terminee_le' => $t->terminee_le?->toDateTimeString(),
            'assignee_id' => $t->assignee_id,
            'assignee_name' => $t->assignee?->name,
            'cree_par_name' => $t->creePar?->name,
            'client_id' => $t->client_id,
            'client_nom' => $t->client?->getNomCompletAttribute(),
        ];
    }
}
