<?php

return [
    // Étage 1 : taux de commission que le cabinet reçoit du grossiste,
    // valeur par défaut utilisée par l'estimation (RG-03 : jamais visible partenaire).
    'taux_commission_cabinet' => env('TAUX_COMMISSION_CABINET', 20),

    // Délais par défaut
    'expiration_demande_jours' => env('EXPIRATION_DEMANDE_JOURS', 60),
    'relance_devis_j3' => env('RELANCE_DEVIS_J3', true),
    'relance_devis_j7' => env('RELANCE_DEVIS_J7', true),
    'impaye_reprise_jours' => env('IMPAYE_REPRISE_JOURS', 30),

    // Documents
    'upload_max_mo' => env('UPLOAD_MAX_MO', 25),
    'url_signee_duree_minutes' => env('URL_SIGNEE_DUREE_MINUTES', 15),
];
