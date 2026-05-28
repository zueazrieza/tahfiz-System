<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // ── Force HTTPS in production (prevents mixed-content on reverse proxy) ──
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // ── Role-based Gates ────────────────────────────────────────────────────
        // Used via middleware('can:admin-only') in routes/web.php
        Gate::define('admin-only', fn($user) => $user->role === 'admin');

        // Additional convenience gates
        Gate::define('teacher-or-admin', fn($user) => in_array($user->role, ['admin', 'teacher']));
        Gate::define('staff', fn($user) => in_array($user->role, ['admin', 'teacher']));
    }
}
