<?php

namespace App\Services;

use App\Models\TarifSimulation;

/**
 * Estimation de prime pour le simulateur du tableau de bord.
 * Utilise un tarif de base en base (simulation_tarifs) modulé par
 * les critères saisis (CRM, sinistralité, ancienneté, profil...).
 */
class SimulateurService
{
    public function estimer(array $d): array
    {
        $produit = $d['produit'];
        $niveau = $d['niveau_garantie'];

        $tarif = TarifSimulation::where('produit', $produit)
            ->where('niveau_garantie', $niveau)
            ->first();

        if (!$tarif) {
            abort(422, "Aucun tarif de base pour {$produit} ({$niveau}).");
        }

        $base = (float) $tarif->prime_base;
        $modificateurs = [];

        // CRM (coefficient 0.5 à 3.5)
        $crm = (float) ($d['crm'] ?? 1);
        $modificateurs[] = ['libelle' => 'CRM', 'taux' => round($crm - 1, 2)];

        // Sinistralité : +12 % par sinistre, plafonné à +60 %
        $sinistres = (int) ($d['nb_sinistres'] ?? 0);
        $tauxSinistres = min(0.60, $sinistres * 0.12);
        $modificateurs[] = ['libelle' => 'Sinistralité', 'taux' => $tauxSinistres];

        // Ancienneté du permis
        $anneesPermis = (int) ($d['nb_annees_permis'] ?? 5);
        $tauxPermis = $anneesPermis < 2 ? 0.20 : ($anneesPermis <= 5 ? 0.10 : 0.0);
        $modificateurs[] = ['libelle' => 'Ancienneté du permis', 'taux' => $tauxPermis];

        // Âge du véhicule (AUTO / Moto)
        if (in_array($produit, ['AUTO', 'Moto'], true)) {
            $ageVehicule = (float) ($d['age_vehicule'] ?? 0);
            $tauxAge = $ageVehicule > 15 ? 0.25 : ($ageVehicule > 10 ? 0.15 : ($ageVehicule > 5 ? 0.08 : 0.0));
            $modificateurs[] = ['libelle' => 'Âge du véhicule', 'taux' => $tauxAge];
        }

        if ($produit === 'AUTO') {
            $puissance = (float) ($d['puissance'] ?? 6);
            $tauxPuissance = $puissance > 10 ? 0.20 : ($puissance >= 8 ? 0.10 : ($puissance <= 5 ? -0.10 : 0.0));
            $modificateurs[] = ['libelle' => 'Puissance', 'taux' => $tauxPuissance];

            $usage = (string) ($d['usage'] ?? '');
            if ($usage === 'Professionnel') {
                $modificateurs[] = ['libelle' => 'Usage professionnel', 'taux' => 0.10];
            } elseif ($usage === 'Privé') {
                $modificateurs[] = ['libelle' => 'Usage privé', 'taux' => -0.05];
            }

            $couverture = (string) ($d['vol_lnc_rc'] ?? 'RC100');
            $tauxCouv = match ($couverture) {
                'Vol' => 0.05,
                'RC100' => -0.05,
                default => 0.0,
            };
            $modificateurs[] = ['libelle' => 'Couverture', 'taux' => $tauxCouv];
        }

        if ($produit === 'Moto') {
            $cylindree = (string) ($d['cylindree'] ?? '');
            $tauxCyl = match (true) {
                str_contains($cylindree, '50') => -0.10,
                str_contains($cylindree, '125') => -0.05,
                str_contains($cylindree, '500') => 0.10,
                str_contains($cylindree, '600') => 0.20,
                default => 0.0,
            };
            $modificateurs[] = ['libelle' => 'Cylindrée', 'taux' => $tauxCyl];
        }

        if ($produit === 'Immobilier') {
            $typeBien = (string) ($d['type_bien'] ?? '');
            $tauxBien = $typeBien === 'Maison' ? 0.05 : ($typeBien === 'Appartement' ? -0.05 : 0.0);
            $modificateurs[] = ['libelle' => 'Type de bien', 'taux' => $tauxBien];

            $annee = (int) ($d['annee_construction'] ?? 2000);
            $tauxAnnee = $annee >= 2005 ? -0.10 : ($annee < 1980 ? 0.15 : 0.0);
            $modificateurs[] = ['libelle' => 'Année de construction', 'taux' => $tauxAnnee];

            if (($d['assurance_pret'] ?? 'Non') === 'Oui') {
                $modificateurs[] = ['libelle' => 'Assurance prêt', 'taux' => 0.08];
            }
        }

        if ($produit === 'Travaux') {
            $typeTravaux = (string) ($d['type_travaux'] ?? '');
            $tauxTrav = match ($typeTravaux) {
                'Rénovation' => 0.10,
                'Extension' => 0.15,
                'Autre' => 0.05,
                default => 0.0,
            };
            $modificateurs[] = ['libelle' => 'Nature des travaux', 'taux' => $tauxTrav];
        }

        $totalTaux = array_sum(array_column($modificateurs, 'taux'));
        $primeAnnuelle = $base * $crm * (1 + $totalTaux);
        $primeAnnuelle = max(0, round($primeAnnuelle, 2));

        return [
            'produit' => $produit,
            'niveau_garantie' => $niveau,
            'prime_base' => round($base, 2),
            'prime_min' => max(0, round($primeAnnuelle * 0.90, 2)),
            'prime_max' => round($primeAnnuelle * 1.10, 2),
            'prime_mensuelle_min' => max(0, round(($primeAnnuelle * 0.90) / 12, 2)),
            'prime_mensuelle_max' => round(($primeAnnuelle * 1.10) / 12, 2),
            'modificateurs' => $modificateurs,
        ];
    }
}