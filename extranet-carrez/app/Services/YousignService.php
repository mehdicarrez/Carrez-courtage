<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Intégration Yousign (API v3, mode sandbox) pour la signature électronique.
 *
 * Flux : création d'une demande de signature → dépôt des PDF → ajout du
 * signataire → activation (envoi). La clé API reste côté serveur (config).
 */
class YousignService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.yousign.url', 'https://api-sandbox.yousign.app/v3'), '/');
        $this->apiKey = (string) config('services.yousign.key');
    }

    /**
     * Orchestre l'envoi d'une demande de signature.
     *
     * @param  array<int, \App\Models\Document>  $documents  documents (PDF) à faire signer
     * @param  array{email:string, mobile:string, message:string}|array  $signataire
     * @return array statut / id / url du suivi Yousign
     */
    public function envoyerSignature(array $documents, array $signataire): array
    {
        if (empty($this->apiKey)) {
            throw new \RuntimeException("La clé API Yousign n'est pas configurée (YOUSIGN_API_KEY).");
        }

        // 1) Création de la demande de signature
        $signatureRequest = $this->creerSignatureRequest();

        try {
            // 2) Dépôt des documents PDF
            $documentIds = [];
            foreach ($documents as $document) {
                $yousignDoc = $this->deposerDocument($signatureRequest['id'], $document);
                $documentIds[] = $yousignDoc['id'];
            }

            if (empty($documentIds)) {
                throw new \RuntimeException('Aucun document valide à envoyer pour signature.');
            }

            // 3) Ajout du signataire
            $signataire = $this->ajouterSignataire($signatureRequest['id'], $signataire);

            // 4) Ajout d'un champ de signature sur chaque document (lie document <-> signataire et
            //    satisfait l'exigence « au moins un field par signataire »)
            foreach ($documentIds as $documentId) {
                $this->ajouterChampSignature($signatureRequest['id'], $documentId, $signataire['id']);
            }

            // 5) Activation / envoi
            $this->activer($signatureRequest['id']);

            return [
                'statut' => 'ENVOYEE',
                'id' => $signatureRequest['id'],
                'url' => $this->signatureUrl($signatureRequest['id']),
            ];
        } catch (\Throwable $e) {
            // Nettoyage de la demande de signature partiellement créée
            $this->annuler($signatureRequest['id']);
            throw $e;
        }
    }

    private function creerSignatureRequest(): array
    {
        $response = Http::withToken($this->apiKey)
            ->acceptJson()
            ->post($this->baseUrl.'/signature_requests', [
                'name' => 'Demande de signature extranet',
                'delivery_mode' => 'email',
                'timezone' => 'Europe/Paris',
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Yousign - création signature : '.$response->body());
        }

        return $response->json();
    }

    private function deposerDocument(string $signatureRequestId, Document $document): array
    {
        if (!$document->cle_stockage || !Storage::disk('local')->exists($document->cle_stockage)) {
            throw new \RuntimeException('Fichier introuvable pour le document « '.($document->nom_origine ?: 'sans nom').' ».');
        }

        // Yousign n'accepte que des PDF
        $nom = $document->nom_origine ?: 'document.pdf';
        if (strtolower(pathinfo($nom, PATHINFO_EXTENSION)) !== 'pdf') {
            throw new \RuntimeException('Yousign n\'accepte que des PDF. Le document « '.$nom.' » doit être converti au préalable.');
        }

        $chemin = Storage::disk('local')->path($document->cle_stockage);

        $response = Http::withToken($this->apiKey)
            ->acceptJson()
            ->attach('file', fopen($chemin, 'r'), $nom)
            ->post($this->baseUrl.'/signature_requests/'.$signatureRequestId.'/documents', [
                'nature' => 'signable_document',
                'parse_anchors' => 'false',
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Yousign - dépôt document : '.$response->body());
        }

        return $response->json();
    }

    private function ajouterSignataire(string $signatureRequestId, array $signataire): array
    {
        $response = Http::withToken($this->apiKey)
            ->acceptJson()
            ->post($this->baseUrl.'/signature_requests/'.$signatureRequestId.'/signers', [
                'info' => [
                    'first_name' => $signataire['first_name'] ?? 'Signataire',
                    'last_name' => $signataire['last_name'] ?? '',
                    'email' => $signataire['email'],
                    'locale' => 'fr',
                ],
                'delivery_mode' => 'email',
                'signature_level' => 'electronic_signature',
                'signature_authentication_mode' => 'no_otp',
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Yousign - ajout signataire : '.$response->body());
        }

        return $response->json();
    }

    /**
     * Ajoute un champ de signature sur le document pour le signataire.
     * Yousign exige au moins un field par signataire ; le champ référence
     * aussi le signataire et relie ainsi le document au signataire.
     */
    private function ajouterChampSignature(string $signatureRequestId, string $documentId, string $signerId): array
    {
        $response = Http::withToken($this->apiKey)
            ->acceptJson()
            ->post($this->baseUrl.'/signature_requests/'.$signatureRequestId.'/documents/'.$documentId.'/fields', [
                'signer_id' => $signerId,
                'type' => 'signature',
                'page' => 1,
                'x' => 100,
                'y' => 100,
                'width' => 180,
                'height' => 60,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Yousign - ajout champ de signature : '.$response->body());
        }

        return $response->json();
    }

    private function activer(string $signatureRequestId): array
    {
        $response = Http::withToken($this->apiKey)
            ->acceptJson()
            ->post($this->baseUrl.'/signature_requests/'.$signatureRequestId.'/activate', []);

        if ($response->failed()) {
            throw new \RuntimeException('Yousign - activation : '.$response->body());
        }

        return $response->json();
    }

    private function annuler(string $signatureRequestId): void
    {
        try {
            Http::withToken($this->apiKey)
                ->acceptJson()
                ->post($this->baseUrl.'/signature_requests/'.$signatureRequestId.'/cancel', ['reason' => 'client_error']);
        } catch (\Throwable $e) {
            // ignore : nettoyage best effort
        }
    }

    private function signatureUrl(string $signatureRequestId): string
    {
        return 'https://app.yousign.io/signature_requests/'.$signatureRequestId;
    }
}
