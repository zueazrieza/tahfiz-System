<?php

/*
|--------------------------------------------------------------------------
| API Routes — routes/api.php
|--------------------------------------------------------------------------
| NOTE: All business API routes live in routes/web.php (under prefix('api'))
| where Sanctum's stateful (cookie-based) session middleware applies correctly.
|
| This file is intentionally minimal to avoid duplicate route definitions and
| ensure the auth:sanctum guard is never bypassed through a second declaration.
|--------------------------------------------------------------------------
*/

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health-check — used by Railway / Render deploy pipelines
Route::get('/health', fn() => response()->json(['status' => 'ok', 'ts' => now()]));
