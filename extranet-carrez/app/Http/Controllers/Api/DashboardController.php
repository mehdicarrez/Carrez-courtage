<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contrat;
use App\Models\DemandeTarification;
use App\Models\LigneCommission;
use App\Models\Message;
use App\Models\Notification;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Tableau de bord selon le rôle.
     */
    public function resume(Request $request)
    {
        $user = $request->user();

        $data = [
            'messages_non_lus' => $this->messagesNonLus($user),
        ];

        if ($user->estPartenaire()) {
            $demandes = DemandeTarification::where('organisation_id', $user->organisation_id)
                ->where('statut', '!=', 'BROUILLON');

            $data += [
                'demandes_en_cours' => (clone $demandes)->whereIn('statut', ['SOUMISE', 'EN_ETUDE', 'PIECES_MANQUANTES', 'DEVIS_EMIS'])->count(),
                'devis_en_attente' => $demandes->where('statut', 'DEVIS_EMIS')->count(),
                'echeances' => Contrat::where('organisation_id', $user->organisation_id)
                    ->where('statut', 'EN_VIGUEUR')
                    ->whereBetween('date_echeance_principale', [now(), now()->addDays(120)])
                    ->count(),
                'commissions_mois' => LigneCommission::where('organisation_id', $user->organisation_id)
                    ->where('nature', LigneCommission::NATURE_RETROCEDEE)
                    ->whereIn('statut', ['ACQUISE', 'BORDEREE', 'PAYEE'])
                    ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                    ->sum('montant_cts'),
                'contrats_actifs' => Contrat::where('organisation_id', $user->organisation_id)
                    ->where('statut', 'EN_VIGUEUR')->count(),
            ];

            // Échéances proches (relances à faire)
            $data['relances'] = $this->relancesPartenaire($user);
        } else {
            $demandeAttente = DemandeTarification::where('statut', 'SOUMISE');
            $demandesRetard = DemandeTarification::whereIn('statut', ['EN_ETUDE', 'DEVIS_EMIS'])
                ->where('date_statut', '<', now()->subDays(5));

            $data += [
                'demandes_en_attente' => (clone $demandeAttente)->count(),
                'dossiers_en_retard' => (clone $demandesRetard)->count(),
                'contrats_en_vigueur' => Contrat::where('statut', 'EN_VIGUEUR')->count(),
                'bordereaux_a_valider' => \App\Models\Bordereau::where('statut', 'A_VERIFIER')->count(),
            ];

            // File d'attribution : demandes soumises non encore attribuées à un gestionnaire
            $data['file_attribution'] = (clone $demandeAttente)
                ->with(['client', 'branche', 'gestionnaire'])
                ->orderBy('date_soumission', 'asc')
                ->limit(8)
                ->get()
                ->map(fn ($d) => $this->ligneDemande($d));

            // Liste détaillée des dossiers en retard
            $data['dossiers_retard_liste'] = (clone $demandesRetard)
                ->with(['client', 'branche', 'gestionnaire'])
                ->orderBy('date_statut', 'asc')
                ->limit(8)
                ->get()
                ->map(fn ($d) => $this->ligneDemande($d, true));

            // Relances à faire (cabinet)
            $data['relances'] = $this->relancesCabinet();
        }

        return response()->json(['data' => $data]);
    }

    /**
     * §10.3 : tableau de bord de pilotage (direction). Cabinet uniquement.
     */
    public function pilotage(Request $request)
    {
        if (!$request->user()->estCabinet()) {
            abort(403);
        }

        $depuis = $request->query('depuis', now()->startOfYear());
        $demandes = DemandeTarification::where('statut', '!=', 'BROUILLON')
            ->where('date_soumission', '>=', $depuis);
        $contrats = Contrat::where('created_at', '>=', $depuis);

        $soumises = (clone $demandes)->count();
        $transformees = (clone $demandes)->where('statut', 'TRANSFORMEE')->count();
        $emis = (clone $contrats)->count();

        // Taux de chute 12 mois : contrats résiliés / actifs sur 12 mois
        $chute = Contrat::where('statut', 'RESILIE')
            ->whereBetween('created_at', [now()->subMonths(12), now()])->count();
        $chuteBase = Contrat::whereBetween('created_at', [now()->subMonths(13), now()->subMonths(1)])->count();

        // Prime moyenne par contrat
        $primeMoyenne = $emis > 0 ? (clone $contrats)->avg('prime_ht_cts') : 0;

        return response()->json([
            'data' => [
                'periode_debut' => $depuis,
                'volume_demandes' => $soumises,
                'taux_transformation' => $soumises > 0 ? round($transformees / $soumises * 100, 1) : 0,
                'primes_placees_ht' => (clone $contrats)->sum('prime_ht_cts'),
                'prime_moyenne_ht' => round($primeMoyenne, 2),
                'commission_retrocedee' => LigneCommission::where('nature', LigneCommission::NATURE_RETROCEDEE)
                    ->where('created_at', '>=', $depuis)->sum('montant_cts'),
                'commission_percue' => LigneCommission::where('nature', LigneCommission::NATURE_PERQUE)
                    ->where('created_at', '>=', $depuis)->sum('montant_cts'),
                'contrats_emis' => $emis,
                'taux_chute_12m' => $chuteBase > 0 ? round($chute / $chuteBase * 100, 1) : 0,
                'repartition_branches' => (clone $contrats)->with('produit.branche')->get()
                    ->groupBy(fn ($c) => $c->produit?->branche?->nom ?? 'Autre')
                    ->map(fn ($g, $branche) => [
                        'branche' => $branche,
                        'contrats' => $g->count(),
                        'primes_ht' => $g->sum('prime_ht_cts'),
                    ])->values(),
                'repartition_partenaires' => (clone $contrats)
                    ->selectRaw('organisation_id, count(*) as n, sum(prime_ht_cts) as primes')
                    ->whereNotNull('organisation_id')->groupBy('organisation_id')->get()
                    ->map(fn ($r) => [
                        'partenaire' => $r->organisation?->raison_sociale ?? 'Cabinet',
                        'contrats' => $r->n,
                        'primes_ht' => $r->primes,
                    ]),
                'top_partenaires' => \App\Models\Bordereau::with('organisation')
                    ->selectRaw('organisation_id, sum(net_a_payer_cts) as total')
                    ->where('statut', 'PAYE')->groupBy('organisation_id')->orderByDesc('total')->limit(5)->get()
                    ->map(fn ($b) => [
                        'partenaire' => $b->organisation?->raison_sociale,
                        'net_paye' => $b->total,
                    ]),
            ],
        ]);
    }

    /**
     * §10.3 — Export CSV des indicateurs de pilotage.
     */
    public function pilotageExport(Request $request)
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }

        $pilote = $this->pilotage($request)->getData(true)['data'];

        $out = fopen('php://temp', 'r+');
        fputcsv($out, ['Indicateur', 'Valeur']);
        fputcsv($out, ['Période début', $pilote['periode_debut']]);
        fputcsv($out, ['Volume demandes', $pilote['volume_demandes']]);
        fputcsv($out, ['Taux transformation (%)', $pilote['taux_transformation']]);
        fputcsv($out, ['Primes placées HT (cts)', $pilote['primes_placees_ht']]);
        fputcsv($out, ['Prime moyenne HT (cts)', $pilote['prime_moyenne_ht']]);
        fputcsv($out, ['Commission rétrocédée (cts)', $pilote['commission_retrocedee']]);
        fputcsv($out, ['Commission perçue (cts)', $pilote['commission_percue']]);
        fputcsv($out, ['Contrats émis', $pilote['contrats_emis']]);
        fputcsv($out, ['Taux de chute 12m (%)', $pilote['taux_chute_12m']]);

        rewind($out);
        $csv = stream_get_contents($out);
        fclose($out);

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="pilotage-'.now()->format('Y-m-d').'.csv"');
    }

    public function notifications(Request $request)
    {
        return response()->json([
            'data' => Notification::where('user_id', $request->user()->id)
                ->orderByDesc('created_at')->limit(50)->get(),
        ]);
    }

    public function marquerLue(Notification $notification, Request $request)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(404);
        }
        $notification->forceFill(['read_at' => now()])->save();

        return response()->json(['ok' => true]);
    }

    private function ligneDemande(DemandeTarification $d, bool $avecRetard = false): array
    {
        return [
            'id' => $d->id,
            'reference' => $d->reference,
            'statut' => $d->statut,
            'branche' => $d->branche?->nom,
            'client' => $d->client?->getNomCompletAttribute(),
            'gestionnaire' => $d->gestionnaire?->name,
            'date_soumission' => $d->date_soumission,
            'jours_en_attente' => $d->date_soumission ? abs(now()->diffInDays($d->date_soumission)) : 0,
            'jours_retard' => $avecRetard && $d->date_statut
                ? abs(now()->diffInDays($d->date_statut))
                : null,
        ];
    }

    private function relancesCabinet(): array
    {
        // Pièces manquantes : demandes bloquées ou en attente de pièces récentes
        $piecesManquantes = DemandeTarification::with(['client', 'branche', 'gestionnaire'])
            ->whereIn('statut', ['PIECES_MANQUANTES', 'EN_ETUDE'])
            ->where('date_statut', '>=', now()->subDays(30))
            ->orderByDesc('date_statut')
            ->limit(8)
            ->get()
            ->map(fn (DemandeTarification $d) => $this->ligneDemande($d));

        // Contrats impayés
        $impayes = Contrat::with('client')
            ->where('statut', 'IMPAYE')
            ->limit(8)
            ->get()
            ->map(fn (Contrat $c) => [
                'id' => $c->id,
                'reference' => $c->reference,
                'client' => $c->client?->getNomCompletAttribute(),
                'type' => 'CONTRAT_IMPAYE',
                'detail' => 'Prime impayée — relance de l\'assuré',
                'lien' => '/contrats/'.$c->id,
            ]);

        // Bordereaux à valider
        $bordereaux = \App\Models\Bordereau::with('organisation')
            ->where('statut', 'A_VERIFIER')
            ->limit(8)
            ->get()
            ->map(fn (\App\Models\Bordereau $b) => [
                'id' => $b->id,
                'reference' => $b->reference,
                'client' => $b->organisation?->raison_sociale,
                'type' => 'BORDEREAU_A_VALIDER',
                'detail' => 'Bordereau '.number_format($b->net_a_payer_cts / 100, 2, ',', ' ').' € à vérifier',
                'lien' => '/commissions',
            ]);

        // Échéances proches (< 30 jours)
        $echeancesProches = Contrat::with('client')
            ->where('statut', 'EN_VIGUEUR')
            ->whereBetween('date_echeance_principale', [now(), now()->addDays(30)])
            ->limit(8)
            ->get()
            ->map(fn (Contrat $c) => [
                'id' => $c->id,
                'reference' => $c->reference,
                'client' => $c->client?->getNomCompletAttribute(),
                'type' => 'ECHEANCE_PROCHAINE',
                'detail' => 'Échéance le '.$c->date_echeance_principale?->format('d/m/Y'),
                'lien' => '/contrats/'.$c->id,
            ]);

        return [
            'pieces_manquantes' => $piecesManquantes,
            'impayes' => $impayes,
            'bordereaux' => $bordereaux,
            'echeances_proches' => $echeancesProches,
        ];
    }

    private function relancesPartenaire($user): array
    {
        $echeancesProches = Contrat::with('client')
            ->where('organisation_id', $user->organisation_id)
            ->where('statut', 'EN_VIGUEUR')
            ->whereBetween('date_echeance_principale', [now(), now()->addDays(30)])
            ->limit(8)
            ->get()
            ->map(fn (Contrat $c) => [
                'id' => $c->id,
                'reference' => $c->reference,
                'client' => $c->client?->getNomCompletAttribute(),
                'type' => 'ECHEANCE_PROCHAINE',
                'detail' => 'Échéance le '.$c->date_echeance_principale?->format('d/m/Y'),
                'lien' => '/contrats/'.$c->id,
            ]);

        $pieces = DemandeTarification::with(['client', 'branche'])
            ->where('organisation_id', $user->organisation_id)
            ->where('statut', 'PIECES_MANQUANTES')
            ->limit(8)
            ->get()
            ->map(fn (DemandeTarification $d) => [
                'id' => $d->id,
                'reference' => $d->reference,
                'client' => $d->client?->getNomCompletAttribute() ?? $d->reference,
                'type' => 'PIECES_DEMANDEES',
                'detail' => 'Pièces complémentaires demandées',
                'lien' => '/demandes/'.$d->id,
            ]);

        return [
            'echeances_proches' => $echeancesProches,
            'pieces_demandees' => $pieces,
        ];
    }

    private function messagesNonLus($user): int
    {
        return Message::where('visibilite', Message::VISIBILITE_EXTERNE)
            ->where('auteur_id', '!=', $user->id)
            ->whereHas('conversation', function ($q) use ($user) {
                $q->whereIn('objet_type', ['demande', 'contrat']);
                if ($user->estPartenaire()) {
                    $q->where('organisation_id', $user->organisation_id);
                }
            })
            ->where('created_at', '>=', now()->subDays(30))
            ->count();
    }
}
