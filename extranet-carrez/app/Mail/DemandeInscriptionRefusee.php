<?php

namespace App\Mail;

use App\Models\DemandeInscriptionPartenaire;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DemandeInscriptionRefusee extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(private DemandeInscriptionPartenaire $demande)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new \Illuminate\Mail\Mailables\Address(config('extranet.email_cabinet'), config('extranet.nom_cabinet')),
            subject: 'Votre demande de compte partenaire a été refusée',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.partenaires.inscription-statut',
            with: [
                'nom' => $this->demande->nom,
                'statut' => $this->demande->statut,
                'motif' => $this->demande->motif_refus,
            ],
        );
    }
}