<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeeklyReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'content',
        'weekly_score',
        'date',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    protected static function booted()
    {
        static::created(function ($report) {
            $teacherName = $report->teacher?->name ?? 'Murabbi';
            \App\Models\ActivityLog::log('Laporan Mingguan Dihantar', "Oleh: {$teacherName}");
        });
    }
}
