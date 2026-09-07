<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    public const ACCESS_TOUS = 'TOUS';
    public const ACCESS_CLIENTS_attribues = 'CLIENTS_attribues';

    protected $fillable = [
        'id', 'organisation_id', 'name', 'email', 'password', 'role',
        'access_level', 'actif', 'visible_commissions', 'two_factor_enabled', 'two_factor_secret',
        'two_factor_recovery_codes', 'two_factor_confirmed_at',
        'email_verified_at', 'last_login_at', 'last_login_ip',
    ];

    protected $hidden = ['password', 'remember_token', 'two_factor_secret'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'password' => 'hashed',
            'actif' => 'boolean',
            'visible_commissions' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    // Rôles (RG-03, RG-04)
    public const ROLE_ADMIN = 'ADMIN';
    public const ROLE_GESTIONNAIRE = 'GESTIONNAIRE';
    public const ROLE_CONSEILLER = 'CONSEILLER';
    public const ROLE_COMPTABLE = 'COMPTABLE';
    public const ROLE_DIRIGEANT_PARTENAIRE = 'DIRIGEANT_PARTENAIRE';
    public const ROLE_COLLABORATEUR_PARTENAIRE = 'COLLABORATEUR_PARTENAIRE';
    public const ROLE_LECTEUR_PARTENAIRE = 'LECTEUR_PARTENAIRE';

    public function organisation()
    {
        return $this->belongsTo(Organisation::class);
    }

    public function estCabinet(): bool
    {
        return in_array($this->role, [
            self::ROLE_ADMIN, self::ROLE_GESTIONNAIRE, self::ROLE_CONSEILLER, self::ROLE_COMPTABLE,
        ]);
    }

    public function estPartenaire(): bool
    {
        return in_array($this->role, [
            self::ROLE_DIRIGEANT_PARTENAIRE, self::ROLE_COLLABORATEUR_PARTENAIRE, self::ROLE_LECTEUR_PARTENAIRE,
        ]);
    }

    public function estAdminCabinet(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function clients()
    {
        return $this->belongsToMany(Client::class, 'client_user', 'user_id', 'client_id')
            ->withTimestamps();
    }

    public function aDesAccesLimites(): bool
    {
        return $this->access_level === self::ACCESS_CLIENTS_attribues;
    }

    // RG-03 : une organisation partenaire n'accède jamais à la commission perçue
    public function peutVoirCommissionPerque(): bool
    {
        return $this->estCabinet();
    }

    // RG-04 : visibilité des rétrocessions par utilisateur
    public function peutVoirRetrocession(): bool
    {
        if ($this->estPartenaire() && $this->role === self::ROLE_COLLABORATEUR_PARTENAIRE) {
            return (bool) $this->visible_commissions;
        }

        return true; // admin, gestionnaire, comptable, dirigeant, lecteur (lecteur: non payé mais champ absent)
    }
}
