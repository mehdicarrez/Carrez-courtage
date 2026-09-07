<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'user_id', 'type', 'data', 'objet_type', 'objet_id', 'read_at'];

    protected $casts = ['data' => 'array', 'read_at' => 'datetime'];
}
