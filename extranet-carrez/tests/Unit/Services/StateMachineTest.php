<?php

namespace Tests\Unit\Services;

use App\Models\Branche;
use App\Models\Contrat;
use App\Models\Devis;
use App\Models\DemandeTarification;
use App\Services\StateMachine;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;

class StateMachineTest extends TestCase
{
    use RefreshDatabase;

    private function creerBranche(): Branche
    {
        return Branche::create(['code' => 'AUTO', 'nom' => 'Automobile', 'famille' => 'Biens']);
    }

    private function creerDemande(string $statut): DemandeTarification
    {
        $branche = $this->creerBranche();
        $org = \App\Models\Organisation::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'PARTENAIRE',
            'raison_sociale' => 'Test SARL',
            'statut' => 'ACTIVE',
        ]);

        return DemandeTarification::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'reference' => 'DT-2026-000010',
            'organisation_id' => $org->id,
            'branche_id' => $branche->id,
            'schema_formulaire_version' => 1,
            'statut' => $statut,
        ]);
    }

    public function test_demande_transitions_valides(): void
    {
        $demande = $this->creerDemande('BROUILLON');
        $sm = StateMachine::pour($demande);

        $this->assertTrue($sm->peutTransiter('BROUILLON', 'SOUMISE'));
        $this->assertTrue($sm->peutTransiter('SOUMISE', 'EN_ETUDE'));
        $this->assertTrue($sm->peutTransiter('EN_ETUDE', 'DEVIS_EMIS'));
        $this->assertTrue($sm->peutTransiter('EN_ETUDE', 'PIECES_MANQUANTES'));
    }

    public function test_demande_transition_interdite(): void
    {
        $demande = $this->creerDemande('BROUILLON');
        $sm = StateMachine::pour($demande);

        $this->assertFalse($sm->peutTransiter('BROUILLON', 'EN_VIGUEUR'));
        $this->assertFalse($sm->peutTransiter('BROUILLON', 'ACCEPTEE'));
    }

    public function test_devis_transitions_valides(): void
    {
        $devis = new Devis();
        $devis->statut = 'BROUILLON';

        $sm = StateMachine::pour($devis);

        $this->assertTrue($sm->peutTransiter('BROUILLON', 'ENVOYE'));
        $this->assertTrue($sm->peutTransiter('ENVOYE', 'ACCEPTE'));
        $this->assertTrue($sm->peutTransiter('ENVOYE', 'REFUSE'));
        $this->assertTrue($sm->peutTransiter('ACCEPTE', 'TRANSFORME'));
    }

    public function test_contrat_transitions_valides(): void
    {
        $contrat = new Contrat();
        $contrat->statut = 'EN_CONSTITUTION';

        $sm = StateMachine::pour($contrat);

        $this->assertTrue($sm->peutTransiter('EN_CONSTITUTION', 'EN_ATTENTE_SIGNATURE'));
        $this->assertTrue($sm->peutTransiter('EN_ATTENTE_SIGNATURE', 'SIGNE'));
        $this->assertTrue($sm->peutTransiter('SIGNE', 'EN_ATTENTE_EMISSION'));
        $this->assertTrue($sm->peutTransiter('EN_ATTENTE_EMISSION', 'EN_VIGUEUR'));
    }

    public function test_contrat_etats_finaux(): void
    {
        $this->assertTrue(empty(Contrat::TRANSITIONS['RESILIE']));
        $this->assertTrue(empty(Contrat::TRANSITIONS['SANS_EFFET']));
        $this->assertTrue(empty(Contrat::TRANSITIONS['EXPIRE']));
    }

    public function test_appliquer_lance_exception_si_transition_interdite(): void
    {
        $demande = $this->creerDemande('BROUILLON');

        $this->expectException(InvalidArgumentException::class);
        StateMachine::pour($demande)->appliquer($demande, 'EN_VIGUEUR');
    }

    public function test_appliquer_change_statut(): void
    {
        $demande = $this->creerDemande('BROUILLON');

        $etat = StateMachine::pour($demande)->appliquer($demande, 'SOUMISE');

        $this->assertEquals('SOUMISE', $etat);
        $this->assertEquals('SOUMISE', $demande->fresh()->statut);
    }
}
