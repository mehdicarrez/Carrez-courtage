<?php

namespace Tests\Feature;

use App\Models\BaremeCommission;
use App\Models\Branche;
use App\Models\DemandeTarification;
use App\Models\Organisation;
use App\Models\SchemaFormulaire;
use App\Models\TypeDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class DevisDocumentFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $partenaire;
    private User $admin;
    private Organisation $orgPartenaire;
    private DemandeTarification $demande;

    protected function setUp(): void
    {
        parent::setUp();

        $this->orgPartenaire = Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Partenaire SA',
            'statut' => 'ACTIVE',
        ]);

        $orgCabinet = Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => 'CABINET',
            'raison_sociale' => 'Carrez Cabinet',
            'statut' => 'ACTIVE',
        ]);

        $this->partenaire = User::create([
            'name' => 'Partenaire Test',
            'email' => 'partenaire@test.local',
            'password' => 'password',
            'role' => User::ROLE_DIRIGEANT_PARTENAIRE,
            'organisation_id' => $this->orgPartenaire->id,
            'actif' => true,
        ]);

        $this->admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@test.local',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
            'organisation_id' => $orgCabinet->id,
            'actif' => true,
        ]);

        $branche = Branche::create(['code' => 'AUTO', 'nom' => 'Automobile', 'famille' => 'Biens']);

        SchemaFormulaire::create([
            'branche_id' => $branche->id,
            'version' => 1,
            'schema' => ['fields' => []],
            'courant' => true,
        ]);

        BaremeCommission::create([
            'organisation_id' => $this->orgPartenaire->id,
            'date_debut' => now()->startOfYear(),
            'assiette' => 'PERCENT_PRIME_HT',
            'taux_1ere_annee' => 50.0,
            'taux_renouvellement' => 45.0,
            'courant' => true,
        ]);

        $this->demande = DemandeTarification::create([
            'id' => (string) Str::uuid(),
            'reference' => 'DT-2026-000200',
            'organisation_id' => $this->orgPartenaire->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => 'EN_ETUDE',
            'origine' => 'PARTENAIRE',
        ]);

        Storage::fake('local');
    }

    public function test_partenaire_cree_devis_puis_attache_un_document(): void
    {
        $typeDoc = TypeDocument::create(['code' => 'CIN', 'libelle' => 'Pièce d\'identité']);

        // 1. Création du devis par le partenaire
        $response = $this->actingAs($this->partenaire)
            ->postJson("/api/v1/demandes/{$this->demande->id}/devis", [
                'prime_ht_cts' => 100000,
                'taxes_cts' => 20000,
                'date_validite' => now()->addDays(30)->toDateString(),
                'garanties' => [
                    ['intitule' => 'RC', 'incluse' => true],
                ],
            ]);

        $response->assertStatus(201);
        $devisId = $response->json('data.id');
        $this->assertEquals('BROUILLON', $response->json('data.statut'));
        $this->assertNotNull($devisId);

        // 2. Upload d'un document rattaché au devis (objet_type='devis')
        $file = UploadedFile::fake()->create('cin.pdf', 100, 'application/pdf');

        $docResponse = $this->actingAs($this->partenaire)
            ->postJson('/api/v1/documents', [
                'type_document_id' => $typeDoc->id,
                'objet_type' => 'devis',
                'objet_id' => (string) $devisId,
                'file' => $file,
            ]);

        $docResponse->assertStatus(201);
        $docId = $docResponse->json('data.id');
        $this->assertNotNull($docId);

        // 3. Le document est bien stocké en base avec le bon rattachement
        $this->assertDatabaseHas('documents', [
            'id' => $docId,
            'objet_type' => 'devis',
            'objet_id' => $devisId,
            'type_document_id' => $typeDoc->id,
            'organisation_id' => $this->orgPartenaire->id,
            'nom_origine' => 'cin.pdf',
        ]);

        // 4. La liste des devis de la demande expose le document attaché
        $listResponse = $this->actingAs($this->admin)
            ->getJson("/api/v1/demandes/{$this->demande->id}/devis");

        $listResponse->assertOk();
        $devisData = collect($listResponse->json('data'))->firstWhere('id', $devisId);
        $this->assertNotNull($devisData, 'Le devis doit apparaître dans la liste.');
        $this->assertCount(1, $devisData['documents']);
        $this->assertEquals('cin.pdf', $devisData['documents'][0]['nom_origine']);
        $this->assertEquals('Pièce d\'identité', $devisData['documents'][0]['type_document']);

        // 5. URL signée de téléchargement accessible (fichier marqué SAIN au dépôt)
        $urlResponse = $this->actingAs($this->admin)
            ->getJson("/api/v1/documents/{$docId}/url");

        $urlResponse->assertOk();
        $this->assertArrayHasKey('url', $urlResponse->json());

        // 6. Le fichier est bien présent sur le disque de stockage
        $document = \App\Models\Document::find($docId);
        Storage::disk('local')->assertExists($document->cle_stockage);
    }

    public function test_partenaire_peut_attacher_plusieurs_documents_de_types_differents(): void
    {
        $typeCin = TypeDocument::create(['code' => 'CIN', 'libelle' => 'Pièce d\'identité']);
        $typeDevis = TypeDocument::create(['code' => 'DEVIS', 'libelle' => 'Devis']);

        $devis = \App\Models\Devis::create([
            'demande_id' => $this->demande->id,
            'user_id' => $this->partenaire->id,
            'version' => 1,
            'prime_ht_cts' => 100000,
            'prime_ttc_cts' => 120000,
            'date_validite' => now()->addDays(30),
            'statut' => 'ENVOYE',
        ]);

        foreach ([$typeCin, $typeDevis] as $i => $type) {
            $file = UploadedFile::fake()->create("doc{$i}.pdf", 50, 'application/pdf');
            $this->actingAs($this->partenaire)
                ->postJson('/api/v1/documents', [
                    'type_document_id' => $type->id,
                    'objet_type' => 'devis',
                    'objet_id' => (string) $devis->id,
                    'file' => $file,
                ])
                ->assertStatus(201);
        }

        $this->assertDatabaseCount('documents', 2);

        $listResponse = $this->actingAs($this->admin)
            ->getJson("/api/v1/demandes/{$this->demande->id}/devis");

        $listResponse->assertOk();
        $devisData = collect($listResponse->json('data'))->firstWhere('id', $devis->id);
        $this->assertCount(2, $devisData['documents']);
        $types = array_column($devisData['documents'], 'type_document');
        sort($types);
        $this->assertEquals(['Devis', 'Pièce d\'identité'], $types);
    }

    public function test_partenaire_dune_autre_organisation_ne_peut_pas_acceder_au_document(): void
    {
        $typeDoc = TypeDocument::create(['code' => 'CIN', 'libelle' => 'Pièce d\'identité']);

        $devis = \App\Models\Devis::create([
            'demande_id' => $this->demande->id,
            'user_id' => $this->partenaire->id,
            'version' => 1,
            'prime_ht_cts' => 100000,
            'prime_ttc_cts' => 120000,
            'date_validite' => now()->addDays(30),
            'statut' => 'ENVOYE',
        ]);

        $file = UploadedFile::fake()->create('cin.pdf', 100, 'application/pdf');
        $docResponse = $this->actingAs($this->partenaire)
            ->post('/api/v1/documents', [
                'type_document_id' => $typeDoc->id,
                'objet_type' => 'devis',
                'objet_id' => $devis->id,
                'file' => $file,
            ]);
        $docResponse->assertStatus(201);
        $docId = $docResponse->json('data.id');

        // Un partenaire d'une AUTRE organisation n'a pas accès à ce document (RG-74 / RG-51)
        $autreOrga = Organisation::create([
            'id' => (string) Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Autre Partenaire',
            'statut' => 'ACTIVE',
        ]);

        $autrePartenaire = User::create([
            'name' => 'Autre Partenaire',
            'email' => 'autre@test.local',
            'password' => 'password',
            'role' => User::ROLE_DIRIGEANT_PARTENAIRE,
            'organisation_id' => $autreOrga->id,
            'actif' => true,
        ]);

        $this->actingAs($autrePartenaire)
            ->getJson("/api/v1/documents/{$docId}/url")
            ->assertStatus(404);
    }
}