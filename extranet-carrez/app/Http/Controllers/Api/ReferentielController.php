<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branche;
use App\Models\Grossiste;
use App\Models\ModeleDocument;
use App\Models\Motif;
use App\Models\PorteurRisque;
use App\Models\Produit;
use App\Models\SchemaFormulaire;
use App\Models\TypeDocument;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

/**
 * Référentiels administrables (§10.2) : branches, schémas, produits,
 * porteurs, grossistes, motifs, types de documents et gabarits PDF.
 */
class ReferentielController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }
    /**
     * Config des référentiels → modèle, règles de création.
     */
    private function config(): array
    {
        return [
            'branches' => [
                'model' => Branche::class,
                'label' => 'Branches',
                'rules' => [
                    'code' => 'required|string|max:50',
                    'nom' => 'required|string|max:255',
                    'famille' => 'nullable|string|max:150',
                    'actif' => 'nullable|boolean',
                ],
            ],
            'schemas' => [
                'model' => SchemaFormulaire::class,
                'label' => 'Schémas de formulaires',
                'rules' => [
                    'branche_id' => 'required|exists:branches,id',
                    'version' => 'nullable|integer',
                    'schema' => 'nullable|array',
                    'pieces_attendues' => 'nullable|array',
                    'courant' => 'nullable|boolean',
                ],
            ],
            'produits' => [
                'model' => Produit::class,
                'label' => 'Produits',
                'rules' => [
                    'code' => 'required|string|max:50',
                    'nom' => 'required|string|max:255',
                    'branche_id' => 'nullable|exists:branches,id',
                    'porteur_risque_id' => 'nullable|exists:porteurs_risque,id',
                    'grossiste_id' => 'nullable|exists:grossistes,id',
                    'actif' => 'nullable|boolean',
                ],
            ],
            'porteurs' => [
                'model' => PorteurRisque::class,
                'label' => 'Porteurs de risque',
                'rules' => [
                    'nom' => 'required|string|max:255',
                    'orias' => 'nullable|string|max:50',
                    'actif' => 'nullable|boolean',
                ],
            ],
            'grossistes' => [
                'model' => Grossiste::class,
                'label' => 'Grossistes / MGA',
                'rules' => [
                    'nom' => 'required|string|max:255',
                    'orias' => 'nullable|string|max:50',
                    'contact' => 'nullable|array',
                    'actif' => 'nullable|boolean',
                ],
            ],
            'motifs' => [
                'model' => Motif::class,
                'label' => 'Motifs',
                'rules' => [
                    'categorie' => 'required|string|max:100',
                    'code' => 'required|string|max:50',
                    'libelle' => 'required|string|max:255',
                ],
            ],
            'types_documents' => [
                'model' => TypeDocument::class,
                'label' => 'Types de documents',
                'rules' => [
                    'code' => 'required|string|max:50',
                    'libelle' => 'required|string|max:255',
                    'sensible' => 'nullable|boolean',
                    'retenue_mois' => 'nullable|integer|min:0',
                ],
            ],
            'modeles' => [
                'model' => ModeleDocument::class,
                'label' => 'Gabarits de documents',
                'rules' => [
                    'nom' => 'required|string|max:255',
                    'type' => 'required|in:'.implode(',', ModeleDocument::TYPES),
                    'version' => 'nullable|string|max:20',
                    'moteur' => 'nullable|string|max:30',
                    'chemin_vue' => 'nullable|string|max:255',
                    'variables' => 'nullable|array',
                    'statut' => 'nullable|in:ACTIF,DESACTIVE',
                    'par_defaut' => 'nullable|boolean',
                ],
            ],
        ];
    }

    /**
     * Liste complète des référentiels (actifs + inactifs) pour administration.
     */
    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $c = $this->config();
        $data = [];
        foreach ($c as $key => $conf) {
            $model = $conf['model'];
            $data[$key] = $this->liste($model);
        }
        return response()->json($data);
    }

    private function liste(string $model)
    {
        return match ($model) {
            Produit::class => Produit::with(['branche', 'porteurRisque', 'grossiste'])->orderBy('nom')->get(),
            Branche::class => Branche::with('schemaCourant')->orderBy('nom')->get(),
            SchemaFormulaire::class => SchemaFormulaire::with('branche')->orderBy('branche_id')->orderByDesc('version')->get(),
            default => $model::orderBy($this->defaultOrderFor($model))->get(),
        };
    }

    private function defaultOrderFor(string $model): string
    {
        return match ($model) {
            TypeDocument::class => 'libelle',
            SchemaFormulaire::class => 'version',
            Motif::class => 'categorie',
            default => 'nom',
        };
    }

    /**
     * Endpoint public (formulaires) — référentiels actifs regroupés.
     */
    public function actifs()
    {
        return response()->json([
            'porteurs_risque' => PorteurRisque::where('actif', true)->orderBy('nom')->get(),
            'grossistes' => Grossiste::where('actif', true)->orderBy('nom')->get(),
            'produits' => Produit::with('branche')->where('actif', true)->orderBy('nom')->get(),
            'types_documents' => TypeDocument::orderBy('libelle')->get(),
            'motifs' => Motif::all()->groupBy('categorie'),
            'branches' => Branche::where('actif', true)->with('schemaCourant')->orderBy('nom')->get(),
        ]);
    }

    public function store(Request $request, string $cle)
    {
        $this->ensureAdmin($request);

        $conf = $this->config()[$cle] ?? abort(404, 'Référentiel inconnu');
        $data = $request->validate($conf['rules']);
        $model = $conf['model'];

        // Auto-incrément version pour les schémas
        if ($model === SchemaFormulaire::class) {
            $data['version'] = $data['version'] ?? (SchemaFormulaire::where('branche_id', $data['branche_id'])->max('version') + 1);
        }

        $record = $model::create($data);

        // Un seul schéma courant par branche
        if ($model === SchemaFormulaire::class && !empty($data['courant'])) {
            SchemaFormulaire::where('branche_id', $data['branche_id'])->where('id', '!=', $record->id)->update(['courant' => false]);
        }

        $this->audit->log('referentiel.create', 'referentiel', $this->idRecord($record), null, ['cle' => $cle]);

        return response()->json($record->load($this->loadsFor($model)), 201);
    }

    public function update(Request $request, string $cle, $id)
    {
        $this->ensureAdmin($request);

        $conf = $this->config()[$cle] ?? abort(404, 'Référentiel inconnu');
        $data = $request->validate($conf['rules']);
        $model = $conf['model'];
        $record = $model::findOrFail($id);
        $record->update($data);

        if ($model === SchemaFormulaire::class && !empty($data['courant'])) {
            SchemaFormulaire::where('branche_id', $data['branche_id'] ?? $record->branche_id)->where('id', '!=', $record->id)->update(['courant' => false]);
        }

        $this->audit->log('referentiel.update', 'referentiel', $this->idRecord($record), ['avant' => $record->getOriginal()], ['cle' => $cle, 'apres' => $data]);

        return response()->json($record->load($this->loadsFor($model)));
    }

    public function destroy(Request $request, string $cle, $id)
    {
        $this->ensureAdmin($request);

        $conf = $this->config()[$cle] ?? abort(404, 'Référentiel inconnu');
        $model = $conf['model'];
        $record = $model::findOrFail($id);
        $record->delete();

        $this->audit->log('referentiel.delete', 'referentiel', $this->idRecord($record), ['apres' => ['deleted' => true]], ['cle' => $cle]);

        return response()->json(['message' => 'Supprimé.']);
    }

    /**
     * Basculer actif/inactif (pour les modèles avec SoftDeletes + actif).
     */
    public function toggle(Request $request, string $cle, $id)
    {
        $this->ensureAdmin($request);

        $conf = $this->config()[$cle] ?? abort(404, 'Référentiel inconnu');
        $model = $conf['model'];
        $record = $model::findOrFail($id);
        $record->actif = !($record->actif ?? false);
        $record->save();

        $this->audit->log('referentiel.toggle', 'referentiel', $this->idRecord($record), null, ['cle' => $cle, 'actif' => $record->actif]);

        return response()->json($record->load($this->loadsFor($model)));
    }

    private function idRecord($record): ?string
    {
        return $record?->getKey() !== null ? (string) $record->getKey() : null;
    }

    private function ensureAdmin(Request $request): void
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }
    }

    private function loadsFor(string $model): array
    {
        return match ($model) {
            Produit::class => ['branche', 'porteurRisque', 'grossiste'],
            Branche::class => ['schemaCourant'],
            SchemaFormulaire::class => ['branche'],
            default => [],
        };
    }
}
