<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Police d'assurance — {{ $contrat->numero_police }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a202c; }
        .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
        .cabinet { font-size: 20px; font-weight: bold; color: #1e3a8a; }
        h1 { font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #eef2ff; }
        .montant { text-align: right; }
        .note { color: #64748b; font-size: 10px; margin-top: 20px; }
        .cadre { border: 1px solid #cbd5e1; padding: 12px; margin-top: 20px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="cabinet">{{ $cabinet }}</div>
        <div>Police d'assurance</div>
    </div>

    <h1>Police {{ $contrat->numero_police ?? $contrat->reference }}</h1>

    <p>
        <strong>Client :</strong> {{ $contrat->client?->getNomCompletAttribute() }}<br>
        <strong>Produit :</strong> {{ $contrat->produit?->nom ?? '—' }}<br>
        <strong>Date d'effet :</strong> {{ $contrat->date_effet?->format('d/m/Y') }}<br>
        <strong>Échéance principale :</strong> {{ $contrat->date_echeance_principale?->format('d/m/Y') }}<br>
        <strong>Fractionnement :</strong> {{ $contrat->fractionnement }}
    </p>

    <h2>Tarif</h2>
    <table>
        <tr><th>Prime annuelle HT</th><td class="montant">{{ number_format($contrat->prime_ht_cts / 100, 2, ',', ' ') }} €</td></tr>
        <tr><th>Taxes</th><td class="montant">{{ number_format($contrat->taxes_cts / 100, 2, ',', ' ') }} €</td></tr>
        <tr><th>Prime annuelle TTC</th><td class="montant">{{ number_format($contrat->prime_ttc_cts / 100, 2, ',', ' ') }} €</td></tr>
    </table>

    @if($contrat->garanties && $contrat->garanties->count())
    <h2>Garanties</h2>
    <table>
        <tr><th>Garantie</th><th>Plafond</th><th>Franchise</th><th>Incluse</th></tr>
        @foreach($contrat->garanties as $g)
        <tr>
            <td>{{ $g->intitule }}</td>
            <td>{{ $g->plafond_cts ? number_format($g->plafond_cts / 100, 2, ',', ' ').' €' : '—' }}</td>
            <td>{{ $g->franchise_cts ? number_format($g->franchise_cts / 100, 2, ',', ' ').' €' : '—' }}</td>
            <td>{{ $g->incluse ? 'Oui' : 'Option' }}</td>
        </tr>
        @endforeach
    </table>
    @endif

    @if($contrat->bareme_applique && !empty($contrat->bareme_applique['conditions_particulieres']))
    <h2>Conditions particulières</h2>
    <p>{{ $contrat->bareme_applique['conditions_particulieres'] }}</p>
    @endif

    <div class="cadre">
        <strong>Document à conserver.</strong> La présente police formalise les garanties souscrites
        telles que validées lors de la souscription.
    </div>

    <p class="note">
        Établi par {{ $cabinet }}. Le présent document ne mentionne ni le taux ni le montant
        des commissions perçues par le courtier (CA-22).
    </p>
</body>
</html>
