<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proposition d'assurance</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a202c; }
        .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
        .cabinet { font-size: 20px; font-weight: bold; color: #1e3a8a; }
        h1 { font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #eef2ff; }
        .montant { text-align: right; }
        .total td { font-weight: bold; background: #f1f5f9; }
        .note { color: #64748b; font-size: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="cabinet">{{ $cabinet }}</div>
        <div>Proposition d'assurance</div>
    </div>

    <h1>Proposition n° {{ $devis->id }}</h1>

    <p>
        <strong>Client :</strong> {{ $devis->demande->client?->getNomCompletAttribute() }}<br>
        <strong>Branche :</strong> {{ $devis->demande->branche?->nom }}<br>
        <strong>Produit :</strong> {{ $devis->produit?->nom ?? '—' }}<br>
        <strong>Date de validité :</strong> {{ $devis->date_validite?->format('d/m/Y') }}
    </p>

    <h2>Tarif</h2>
    <table>
        <tr><th>Prime annuelle HT</th><td class="montant">{{ number_format($devis->prime_ht_cts / 100, 2, ',', ' ') }} €</td></tr>
        <tr><th>Taxes</th><td class="montant">{{ number_format($devis->taxes_cts / 100, 2, ',', ' ') }} €</td></tr>
        <tr><th>Prime annuelle TTC</th><td class="montant">{{ number_format($devis->prime_ttc_cts / 100, 2, ',', ' ') }} €</td></tr>
        <tr><th>Frais de courtage</th><td class="montant">{{ number_format($devis->frais_courtage_cts / 100, 2, ',', ' ') }} €</td></tr>
        <tr><th>Fractionnement</th><td>{{ $devis->fractionnement }}</td></tr>
    </table>

    @if($devis->garanties && $devis->garanties->count())
    <h2>Garanties</h2>
    <table>
        <tr><th>Garantie</th><th>Plafond</th><th>Franchise</th><th>Incluse</th></tr>
        @foreach($devis->garanties as $g)
        <tr>
            <td>{{ $g->intitule }}</td>
            <td>{{ $g->plafond_cts ? number_format($g->plafond_cts / 100, 2, ',', ' ').' €' : '—' }}</td>
            <td>{{ $g->franchise_cts ? number_format($g->franchise_cts / 100, 2, ',', ' ').' €' : '—' }}</td>
            <td>{{ $g->incluse ? 'Oui' : 'Option' }}</td>
        </tr>
        @endforeach
    </table>
    @endif

    @if($devis->conditions_particulieres)
    <h2>Conditions particulières et réserves</h2>
    <p>{{ $devis->conditions_particulieres }}</p>
    @endif
    @if($devis->reserves)
    <p><strong>Réserves :</strong> {{ $devis->reserves }}</p>
    @endif

    <p class="note">
        Document d'information précontractuelle. Ce document ne constitue pas un contrat d'assurance.
        <!-- CA-22 : ce PDF ne contient JAMAIS le taux ni le montant de commission perçue par le cabinet -->
    </p>
</body>
</html>
