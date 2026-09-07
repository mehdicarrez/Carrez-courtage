<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->estAdminCabinet() && !$user->estPartenaire()) {
            abort(403);
        }

        $query = User::query();

        if ($user->estPartenaire()) {
            // Un dirigeant gère les utilisateurs de sa propre organisation (F-604)
            if ($user->role !== User::ROLE_DIRIGEANT_PARTENAIRE) {
                abort(403);
            }
            $query->where('organisation_id', $user->organisation_id);
        }

        $users = $query->orderBy('name')->get();

        return response()->json(['data' => $users->map(fn ($u) => $this->present($u))]);
    }

    public function store(Request $request)
    {
        $this->autoriserGestion($request->user());

        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:12',
            'role' => 'required|in:ADMIN,GESTIONNAIRE,CONSEILLER,COMPTABLE,DIRIGEANT_PARTENAIRE,COLLABORATEUR_PARTENAIRE,LECTEUR_PARTENAIRE',
            'access_level' => 'nullable|in:TOUS,CLIENTS_attribues',
            'visible_commissions' => 'nullable|boolean',
        ]);

        $user = User::create([
            'organisation_id' => $this->organisationPour($request->user(), $data['role']),
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'access_level' => $data['access_level'] ?? 'TOUS',
            'actif' => true,
            'visible_commissions' => $data['visible_commissions'] ?? true,
        ]);

        $this->audit->log('utilisateur.cree', 'user', (string) $user->id);

        return response()->json(['data' => $this->present($user)], 201);
    }

    public function update(User $user, Request $request)
    {
        $this->autoriserGestion($request->user());

        $data = $request->validate([
            'name' => 'nullable|string',
            'role' => 'nullable|in:ADMIN,GESTIONNAIRE,CONSEILLER,COMPTABLE,DIRIGEANT_PARTENAIRE,COLLABORATEUR_PARTENAIRE,LECTEUR_PARTENAIRE',
            'access_level' => 'nullable|in:TOUS,CLIENTS_attribues',
            'actif' => 'nullable|boolean',
            'visible_commissions' => 'nullable|boolean',
            'password' => 'nullable|string|min:12',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->fill($data)->save();

        $this->audit->log('utilisateur.modifie', 'user', (string) $user->id, null, array_keys($data));

        return response()->json(['data' => $this->present($user)]);
    }

    public function destroy(User $user, Request $request)
    {
        $this->autoriserGestion($request->user());
        $user->delete(); // soft delete (RG-72) + désactivation immédiate
        $this->audit->log('utilisateur.desactive', 'user', (string) $user->id);

        return response()->json(['ok' => true]);
    }

    /**
     * F-608 : export RGPD des données d'une personne.
     */
    public function exportRgpd(Request $request)
    {
        $user = $request->user();

        $data = [
            'identite' => $user->only(['name', 'email']),
            'organisation' => $user->organisation?->only(['raison_sociale', 'siren']),
            'projets_soumis' => $user->organisation?->demandes()->count() ?? 0,
        ];

        $this->audit->log('rgpd.export', 'user', (string) $user->id);

        return response()->json(['data' => $data]);
    }

    private function autoriserGestion($user): void
    {
        $ok = $user->estAdminCabinet()
            || $user->role === User::ROLE_DIRIGEANT_PARTENAIRE;

        if (!$ok) {
            abort(403);
        }
    }

    private function organisationPour($user, string $role): ?string
    {
        if ($user->role === User::ROLE_DIRIGEANT_PARTENAIRE) {
            return $user->organisation_id; // un dirigeant ne crée que dans son cabinet
        }

        return $user->organisation_id;
    }

    private function present(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'organisation_id' => $u->organisation_id,
            'access_level' => $u->access_level,
            'actif' => $u->actif,
            'visible_commissions' => $u->visible_commissions,
            'two_factor_enabled' => $u->two_factor_enabled,
            'last_login_at' => $u->last_login_at,
        ];
    }
}
