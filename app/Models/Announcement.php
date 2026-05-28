<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title',
        'content',
        'author_id',
        'type',
        'target_audience',
        'is_active',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
