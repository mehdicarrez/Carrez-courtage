<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'horodatage', 'user_id', 'organisation_id', 'ip', 'action',
        'objet_type', 'objet_id', 'avant', 'apres', 'detail',
    ];

    protected $casts = [
        'horodatage' => 'datetime',
        'avant' => 'array',
        'apres' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
