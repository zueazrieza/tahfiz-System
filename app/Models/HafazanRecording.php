<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HafazanRecording extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id', 'surah', 'ayat_from', 'ayat_to',
        'file_path', 'mime_type', 'duration_seconds',
        'notes', 'recorded_by', 'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->file_path);
    }
}
