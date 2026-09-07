<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = ['conversation_id', 'auteur_id', 'contenu', 'visibilite', 'pieces_jointes'];

    protected $casts = ['pieces_jointes' => 'array'];

    public const VISIBILITE_EXTERNE = 'EXTERNE';
    public const VISIBILITE_INTERNE = 'INTERNE'; // note interne, RG-55

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function auteur()
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }
}
