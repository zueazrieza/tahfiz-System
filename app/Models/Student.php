<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'user_id', 'name', 'phone', 'ic_no', 'matric_no', 'intake', 'gender', 'dob', 'age', 'address',
        'marital_status', 'blood_type', 'pob', 'citizenship', 'race', 'religion',
        'education_background', 'emergency_contact_name', 'emergency_contact_phone',
        'family_income', 'class_id', 'teacher_id', 'parent_id', 'parent_name', 
        'parent_phone', 'parent_ic', 'enrolled_date', 'juzuk_completed', 'intake_juzuk', 
        'status', 'status_khatam', 'medical_history', 'admission_type', 'ranking',
        'juzuk_semasa', 'purata_sabaq_sehari', 'jenis_bacaan', 'target_bil_juzuk', 'target_ranking',
        'tarikh_tamat', 'batch',
        'interview_date', 'interview_type', 'interview_time', 'interview_location', 'hafazan_mark', 'tajwid_mark', 'akhlaq_mark', 'notes'
    ];

    /**
     * Get the class that the student belongs to.
     */
    public function classRoom()
    {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    /**
     * Get the teacher assigned to the student.
     */
    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function parents()
    {
        return $this->belongsToMany(ParentProfile::class, 'student_parent', 'student_id', 'parent_id');
    }

    public function parentProfile()
    {
        return $this->belongsTo(ParentProfile::class, 'parent_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function aiPrediction()
    {
        return $this->hasOne(\App\Models\AIPrediction::class, 'student_id');
    }

    public function hafazanRecords()
    {
        return $this->hasMany(\App\Models\HafazanRecord::class, 'student_id');
    }

    public function attendanceRecords()
    {
        return $this->hasMany(\App\Models\Attendance::class, 'student_id');
    }
}
