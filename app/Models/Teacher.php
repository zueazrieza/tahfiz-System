<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = [
        'user_id', 'name', 'email', 'phone', 'ic_no', 'specialization', 
        'status', 'joined_date', 'qualification', 'experience',
        'medical_history', 'emergency_contact_name', 'emergency_contact_phone',
        'dependents_count', 'residence', 'service_start_date'
    ];

    /**
     * Get the classes assigned to the teacher.
     */
    public function classes()
    {
        return $this->belongsToMany(ClassRoom::class, 'class_teacher', 'teacher_id', 'class_room_id')
                    ->withPivot('is_primary')
                    ->withTimestamps();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted()
    {
        static::created(function ($teacher) {
            \App\Models\ActivityLog::log('Murabbi Baharu Didafatar', $teacher->name);
        });

        static::updated(function ($teacher) {
            \App\Models\ActivityLog::log('Profil Murabbi Dikemas Kini', $teacher->name);
        });

        static::deleted(function ($teacher) {
            \App\Models\ActivityLog::log('Murabbi Dipadam', $teacher->name);
        });
    }
}
