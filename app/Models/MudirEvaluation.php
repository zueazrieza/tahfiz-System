<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MudirEvaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'evaluator_id',
        'surah',
        'juzuk',
        'tajwid_score',
        'kelancaran_score',
        'hafazan_score',
        'lagu_score',
        'total_score',
        'passed',
        'awarded_badge',
        'remarks',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    protected static function booted()
    {
        static::created(function ($eval) {
            $studentName = $eval->student?->name ?? 'Pelajar';
            \App\Models\ActivityLog::log('Penilaian Mudir Selesai', "{$studentName} (Juzuk {$eval->juzuk} - {$eval->surah})");
        });
    }
}
