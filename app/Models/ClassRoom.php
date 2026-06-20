<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassRoom extends Model
{
    protected $fillable = ['name', 'capacity', 'teacher_id', 'center_id'];

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'class_teacher', 'class_room_id', 'teacher_id')
                    ->withPivot('is_primary')
                    ->withTimestamps();
    }

    public function primaryTeacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    protected static function booted()
    {
        static::created(function ($class) {
            \App\Models\ActivityLog::log('Halaqah Baharu Ditambah', $class->name);
        });

        static::updated(function ($class) {
            \App\Models\ActivityLog::log('Maklumat Halaqah Dikemas Kini', $class->name);
        });

        static::deleted(function ($class) {
            \App\Models\ActivityLog::log('Halaqah Dipadam', $class->name);
        });
    }
}
