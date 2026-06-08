<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Achievement extends Model
{
    protected $fillable = ['student_id', 'name', 'type', 'earned_at', 'meta'];

    protected $casts = [
        'meta' => 'json',
        'earned_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    protected static function booted()
    {
        static::created(function ($achievement) {
            $studentName = $achievement->student?->name ?? 'Pelajar';
            \App\Models\ActivityLog::log('Pencapaian Dianugerahkan', "{$studentName} — {$achievement->name}");
        });

        static::deleted(function ($achievement) {
            $studentName = $achievement->student?->name ?? 'Pelajar';
            \App\Models\ActivityLog::log('Pencapaian Dipadam', "{$studentName} — {$achievement->name}");
        });
    }
}
