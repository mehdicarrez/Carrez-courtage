<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * RG-62 / RG-63 : journal d'audit en ajout seul.
 */
class AuditLogger
{
    public function log(
        string $action,
        ?string $objetType = null,
        ?string $objetId = null,
        ?array $avant = null,
        ?array $apres = null,
        ?string $detail = null,
        ?int $userId = null,
        ?string $organisationId = null,
    ): AuditLog {
        $user = Auth::user();

        return AuditLog::create([
            'horodatage' => now(),
            'user_id' => $userId ?? $user?->id,
            'organisation_id' => $organisationId ?? $user?->organisation_id,
            'ip' => Request::ip(),
            'action' => $action,
            'objet_type' => $objetType,
            'objet_id' => $objetId,
            'avant' => $avant,
            'apres' => $apres,
            'detail' => $detail,
        ]);
    }

    /**
     * Journalise un changement d'état de machine à états (RG-14).
     */
    public function transition(object $model, string $etatAvant, string $etatApres, ?string $motif = null): void
    {
        $this->log(
            'transition_etat',
            class_basename($model),
            $this->idString($model),
            ['statut' => $etatAvant],
            ['statut' => $etatApres, 'motif' => $motif],
        );
    }

    public function accesRefuse(string $objetType, ?string $objetId = null): void
    {
        $this->log('acces_refuse', $objetType, $objetId);
    }

    public function accesDocument(int $documentId, string $mode): void
    {
        $this->log('acces_document', 'document', (string) $documentId, null, null, "mode=$mode");
    }

    public function urlSignee(int $documentId): void
    {
        $this->log('generation_url_signee', 'document', (string) $documentId);
    }

    private function idString(object $model): ?string
    {
        return $model->getKey() !== null ? (string) $model->getKey() : null;
    }
}
