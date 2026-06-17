<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    protected $fillable = ['user_id', 'title', 'content', 'type', 'is_read'];

    public static function send(int $userId, string $title, string $content, string $type = 'hafazan'): void
    {
        static::create(['user_id' => $userId, 'title' => $title, 'content' => $content, 'type' => $type]);
    }
}
