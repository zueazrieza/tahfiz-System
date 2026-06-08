<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'operator_name',
        'description',
        'sub_description',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper to log an activity.
     */
    public static function log(string $description, ?string $subDescription = null)
    {
        $user = auth()->user();
        self::create([
            'user_id' => $user?->id,
            'operator_name' => $user?->name ?? 'Sistem',
            'description' => $description,
            'sub_description' => $subDescription,
        ]);
    }
}
