<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Demande de compte partenaire</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                    <!-- En-tête -->
                    <tr>
                        <td style="background-color:#1d4ed8; padding:24px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="color:#ffffff; font-size:18px; font-weight:bold;">Carrez Co Courtage</td>
                                    <td align="right" style="color:#bfdbfe; font-size:12px;">Extranet partenaires</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Corps -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#334155;">
                                Bonjour {{ $nom }},
                            </p>

                            @if($statut === 'VALIDEE')
                                <h1 style="margin:0 0 16px 0; font-size:20px; color:#166534;">Demande acceptée</h1>
                                <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#334155;">
                                    Nous avons le plaisir de vous annoncer que votre demande de compte partenaire
                                    a été <strong style="color:#166534;">acceptée</strong> par notre cabinet.
                                </p>
                                <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#334155;">
                                    Vous pouvez dès à présent vous connecter à votre espace partenaire avec
                                    l'adresse e-mail et le mot de passe que vous avez choisis lors de votre inscription.
                                </p>

                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="{{ url('/login') }}" style="display:inline-block; background-color:#16a34a; color:#ffffff; text-decoration:none; font-weight:bold; padding:12px 32px; border-radius:8px; font-size:14px;">
                                                Accéder à mon espace
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            @else
                                <h1 style="margin:0 0 16px 0; font-size:20px; color:#b91c1c;">Demande refusée</h1>
                                <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#334155;">
                                    Nous vous informons que votre demande de compte partenaire a été
                                    <strong style="color:#b91c1c;">refusée</strong> par notre cabinet.
                                </p>

                                @if($motif)
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2; border-left:4px solid #dc2626; border-radius:6px; margin:16px 0 24px 0;">
                                    <tr>
                                        <td style="padding:16px;">
                                            <p style="margin:0 0 4px 0; font-size:12px; font-weight:bold; color:#b91c1c; text-transform:uppercase;">Motif du refus</p>
                                            <p style="margin:0; font-size:14px; color:#7f1d1d; line-height:1.6;">{{ $motif }}</p>
                                        </td>
                                    </tr>
                                </table>
                                @endif

                                <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#334155;">
                                    Si vous pensez qu'il s'agit d'une erreur ou pour obtenir plus de précisions,
                                    vous pouvez contacter notre cabinet.
                                </p>
                            @endif

                            <p style="margin:24px 0 0 0; font-size:13px; color:#64748b; line-height:1.6;">
                                @if($statut === 'VALIDEE')
                                    Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
                                    Pour toute question, contactez-nous à tout moment.
                                @else
                                    Cet e-mail a été envoyé automatiquement par notre extranet
                                    en réponse à votre demande d'inscription.
                                @endif
                            </p>
                        </td>
                    </tr>

                    <!-- Pied de page -->
                    <tr>
                        <td style="background-color:#f8fafc; padding:16px 32px; border-top:1px solid #e2e8f0;">
                            <p style="margin:0; font-size:12px; color:#94a3b8; text-align:center;">
                                © {{ date('Y') }} Carrez Co Courtage — Tous droits réservés
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>