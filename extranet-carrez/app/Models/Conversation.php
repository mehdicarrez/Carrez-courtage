<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = ['objet_type', 'objet_id', 'organisation_id'];

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function objet()
    {
        return $this->morphTo();
    }
}
