<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bordereau de commissions {{ $bordereau->reference }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1a202c; }
        .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px; }
        h1 { font-size: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; }
        th { background: #eef2ff; }
        .nb { text-align: right; }
        .reprise td { color: #b91c1c; }
        .total td { font-weight: bold; background: #f1f5f9; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $cabinet }}</h1>
        <div>Bordereau de commissions — {{ $bordereau->reference }}</div>
        <div>Période : {{ $bordereau->periode_debut->format('d/m/Y') }} → {{ $bordereau->periode_fin->format('d/m/Y') }}</div>
        <div>Partenaire : {{ $bordereau->organisation?->raison_sociale }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Référence contrat</th>
                <th>Client</th>
                <th>Période</th>
                <th>Assiette (cts)</th>
                <th>Taux</th>
                <th class="nb">Montant (€)</th>
                <th>Nature</th>
            </tr>
        </thead>
        <tbody>
            @foreach($bordereau->lignes as $l)
            <tr class="{{ $l->montant_cts < 0 ? 'reprise' : '' }}">
                <td>{{ $l->contrat?->reference }}</td>
                <td>{{ $l->contrat?->client?->getNomCompletAttribute() }}</td>
                <td>{{ $l->periode_debut?->format('d/m/Y') }} → {{ $l->periode_fin?->format('d/m/Y') ?? '—' }}</td>
                <td>{{ number_format($l->assiette_cts ?? 0, 0, ',', ' ') }}</td>
                <td>{{ $l->taux ? number_format($l->taux, 2, ',', ' ').' %' : '—' }}</td>
                <td class="nb">{{ number_format($l->montant_cts / 100, 2, ',', ' ') }}</td>
                <td>{{ $l->nature }} {{ $l->statut === 'REPRISE' ? '(reprise)' : '' }}</td>
            </tr>
            @endforeach
            <tr class="total">
                <td colspan="5">Total brut</td>
                <td class="nb">{{ number_format($bordereau->total_brut_cts / 100, 2, ',', ' ') }}</td>
                <td></td>
            </tr>
            <tr class="total">
                <td colspan="5">Reprises</td>
                <td class="nb">-{{ number_format($bordereau->total_reprises_cts / 100, 2, ',', ' ') }}</td>
                <td></td>
            </tr>
            <tr class="total">
                <td colspan="5">Report antérieur</td>
                <td class="nb">{{ number_format($bordereau->report_anterieur_cts / 100, 2, ',', ' ') }}</td>
                <td></td>
            </tr>
            <tr class="total">
                <td colspan="5">NET À PAYER</td>
                <td class="nb">{{ number_format($bordereau->net_a_payer_cts / 100, 2, ',', ' ') }}</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <p style="margin-top:20px; color:#64748b; font-size:9px;">
        Document généré sur {{ $cabinet }}. Les montants figurant sur ce bordereau sont données en commission
        rétrocédée au partenaire. Commission non perçue par le cabinet présentée au partenaire.
    </p>
</body>
</html>
