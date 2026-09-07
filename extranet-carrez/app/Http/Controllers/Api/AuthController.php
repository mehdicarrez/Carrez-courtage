<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    public function __construct(private Google2FA $google2fa, private AuditLogger $audit)
    {
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'code_2fa' => 'nullable|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            $this->audit->accesRefuse('login');
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        if (!$user->actif) {
            throw ValidationException::withMessages([
                'email' => ['Compte désactivé.'],
            ]);
        }

        // Étape 1 : mot de passe valide mais 2FA requise et non fournie
        if ($user->two_factor_enabled && empty($data['code_2fa'])) {
            return response()->json([
                'two_factor_required' => true,
                'user' => $this->presentUpon2fa($user),
            ]);
        }

        // Étape 2 : vérification du code 2FA
        if ($user->two_factor_enabled) {
            $valide = $this->ValiderCode2FA($user, $data['code_2fa']);

            if (!$valide) {
                $this->audit->accesRefuse('login_2fa');
                throw ValidationException::withMessages([
                    'code_2fa' => ['Code à deux facteurs invalide.'],
                ]);
            }
        }

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();

        // RG-62 : connexion journalisée
        $this->audit->log('connexion', 'user', (string) $user->id, null, null, 'connexion réussie');

        $token = $user->createToken('extranet', ['*'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->present($user),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $this->present($request->user())]);
    }

    public function logout(Request $request)
    {
        $this->audit->log('deconnexion', 'user', (string) $request->user()->id);
        $request->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }

    // ---- 2FA ----

    public function activer(Request $request)
    {
        $user = $request->user();
        $secret = $this->google2fa->generateSecretKey();

        $user->forceFill([
            'two_factor_secret' => encrypt($secret),
            'two_factor_enabled' => true,
        ])->save();

        return response()->json([
            'qr_url' => $this->google2fa->getQRCodeUrl(
                config('app.name'),
                $user->email,
                $secret
            ),
            'secret' => $secret,
            'recovery_codes' => $this->genererRecoveryCodes($user),
        ]);
    }

    public function validerActivation(Request $request)
    {
        $data = $request->validate(['code' => 'required|string']);
        $user = $request->user();

        if (!$user->two_factor_secret) {
            abort(422, '2FA non initialisée.');
        }

        if (!$this->google2fa->verifyKey(decrypt($user->two_factor_secret), $data['code'])) {
            throw ValidationException::withMessages(['code' => ['Code invalide.']]);
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();

        return response()->json(['ok' => true]);
    }

    private function ValiderCode2FA(User $user, string $code): bool
    {
        if (!$user->two_factor_secret) {
            return false;
        }

        return $this->google2fa->verifyKey(decrypt($user->two_factor_secret), $code);
    }

    private function genererRecoveryCodes(User $user): array
    {
        $codes = collect(range(1, 8))->map(fn () => strtoupper(bin2hex(random_bytes(3))))->toArray();
        $user->forceFill(['two_factor_recovery_codes' => $codes])->save();

        return $codes;
    }

    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'organisation_id' => $user->organisation_id,
            'organisation_type' => $user->organisation?->type,
            'visible_commissions' => $user->visible_commissions,
            'two_factor_enabled' => $user->two_factor_enabled,
        ];
    }

    private function presentUpon2fa(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }
}
