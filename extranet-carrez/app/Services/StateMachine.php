<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

/**
 * RG-14 / RG-20 / RG-32 : application des machines à états côté serveur.
 * Toute transition non prévue est rejetée.
 */
class StateMachine
{
    /**
     * @param array<string, array<int,string>> $transitions
     */
    public function __construct(private array $transitions)
    {
    }

    public function peutTransiter(string $etatCourant, string $nouvelEtat): bool
    {
        return in_array($nouvelEtat, $this->transitions[$etatCourant] ?? [], true);
    }

    /**
     * Applique la transition et retourne l'état nouveau.
     *
     * @throws InvalidArgumentException si la transition est interdite.
     */
    public function appliquer(Model $model, string $nouvelEtat, string $champ = 'statut'): string
    {
        $etatCourant = $model->getAttribute($champ);

        if (!$this->peutTransiter($etatCourant, $nouvelEtat)) {
            throw new InvalidArgumentException(
                "Transition interdite de '{$etatCourant}' vers '{$nouvelEtat}'"
            );
        }

        $data = [$champ => $nouvelEtat];

        if ($model->getConnection()->getSchemaBuilder()->hasColumn($model->getTable(), 'date_statut')) {
            $data['date_statut'] = now();
        }

        $model->forceFill($data)->save();

        app(AuditLogger::class)->transition($model, $etatCourant, $nouvelEtat, $model->getAttribute('motif'));

        return $nouvelEtat;
    }

    public static function pour(Model $model): self
    {
        $transitions = match (class_basename($model)) {
            'DemandeTarification' => $model::TRANSITIONS,
            'Devis' => $model::TRANSITIONS,
            'Contrat' => $model::TRANSITIONS,
            'LigneCommission' => $model::TRANSITIONS,
            default => [],
        };

        return new self($transitions);
    }
}
