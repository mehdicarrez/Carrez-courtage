<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Fiche conseil</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a202c; }
        .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
        .cabinet { font-size: 20px; font-weight: bold; color: #1e3a8a; }
        h1 { font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #eef2ff; width: 40%; }
        .section { margin-top: 20px; }
        .section-title { font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; }
        .note { color: #64748b; font-size: 10px; margin-top: 20px; }
        .cadre { border: 1px solid #cbd5e1; padding: 12px; margin-top: 20px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="cabinet">{{ $cabinet }}</div>
        <div>Fiche conseil</div>
    </div>

    <h1>Fiche conseil</h1>

    <table>
        <tr><th>Client</th><td>{{ $client }}</td></tr>
    </table>

    <div class="section">
        <div class="section-title">Garanties</div>
        <table>
            <tr><th>Garanties souhaitées par l'assuré</th><td>{{ $data['garanties_souhaitees'] ?? '—' }}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Observations</div>
        <table>
            <tr><th>Observations</th><td>{{ $data['observations'] ?? '—' }}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Informations</div>
        <table>
            <tr><th>Compagnie</th><td>{{ $data['compagnie'] ?? '—' }}</td></tr>
            <tr><th>Numéro de projet</th><td>{{ $data['numero_projet'] ?? '—' }}</td></tr>
            <tr><th>Montant des frais de courtage</th><td>{{ $data['montant_frais_courtage'] ?? '—' }}</td></tr>
        </table>
    </div>

    <div class="cadre">
        <strong>Conseil délivré.</strong> La présente fiche formalise le conseil apporté au client,
        conformément aux obligations d'information précontractuelle.
    </div>

    <p class="note">Établi par {{ $cabinet }}.</p>
</body>
</html>
