<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AIPrediction extends Model
{
    protected $table = 'ai_predictions';

    protected $fillable = [
        'student_id',
        'current_progress',
        'estimated_completion',
        'performance_trend',
        'confidence',
        'recommendation',
        'attendance_rate',
        'avg_ayah_per_day',
        'pages_per_day',
        'days_to_complete',
        'milestone_3_months',
        'progress_percent',
        'sabaq_score',
        'sabki_score',
        'manzil_score',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
