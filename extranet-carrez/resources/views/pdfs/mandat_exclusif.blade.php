<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Mandat exclusif de placement</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a202c; }
        .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
        .cabinet { font-size: 20px; font-weight: bold; color: #1e3a8a; }
        h1 { font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #eef2ff; width: 40%; }
        .note { color: #64748b; font-size: 10px; margin-top: 20px; }
        .cadre { border: 1px solid #cbd5e1; padding: 12px; margin-top: 20px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="cabinet">{{ $cabinet }}</div>
        <div>Mandat exclusif de placement</div>
    </div>

    <h1>Mandat exclusif de placement</h1>

    <p>
        <strong>Mandant :</strong> {{ $client }}<br>
        <strong>Mandataire :</strong> {{ $cabinet }}<br>
        <strong>Référence :</strong> {{ $data['reference'] ?? '—' }}<br>
        <strong>Date :</strong> {{ $data['date'] ?? '—' }}
    </p>

    <table>
        <tr><th>Durée</th><td>{{ $data['duree'] ?? '—' }}</td></tr>
        <tr><th>Objet du mandat</th><td>{{ $data['objet'] ?? '—' }}</td></tr>
        <tr><th>Contrepartie / Commissions</th><td>{{ $data['commissions'] ?? '—' }}</td></tr>
    </table>

    <div class="cadre">
        <strong>Mandat exclusif.</strong> Le client confie au courtier le placement exclusif de
        ses contrats d'assurance, selon les conditions définies au présent mandat.
    </div>

    <p class="note">Établi par {{ $cabinet }}.</p>
</body>
</html>
