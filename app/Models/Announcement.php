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

    protected static function booted()
    {
        static::created(function ($announcement) {
            \App\Models\ActivityLog::log('Pengumuman Baharu Dibuat', $announcement->title);
        });

        static::deleted(function ($announcement) {
            \App\Models\ActivityLog::log('Pengumuman Dipadam', $announcement->title);
        });
    }
}
