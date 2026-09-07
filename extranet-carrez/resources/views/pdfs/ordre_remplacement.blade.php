<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ordre de remplacement</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a202c; }
        .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
        .cabinet { font-size: 20px; font-weight: bold; color: #1e3a8a; }
        h1 { font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #eef2ff; width: 40%; }
        .note { color: #64748b; font-size: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="cabinet">{{ $cabinet }}</div>
        <div>Ordre de remplacement</div>
    </div>

    <h1>Ordre de remplacement</h1>

    <table>
        <tr><th>Client</th><td>{{ $client }}</td></tr>
        <tr><th>Numéro de l'ancien contrat</th><td>{{ $data['ancien_police'] ?? '—' }}</td></tr>
    </table>

    <p class="note">Établi par {{ $cabinet }}.</p>
</body>
</html>
