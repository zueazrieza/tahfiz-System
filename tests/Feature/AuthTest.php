<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────
function makeUser(string $role, ?string $email = null): User
{
    return User::factory()->create([
        'email'    => $email ?? "{$role}@test.com",
        'password' => Hash::make('password'),
        'role'     => $role,
        'status'   => 'active',
    ]);
}

function apiLogin(string $role, string $email, string $password = 'password'): \Illuminate\Testing\TestResponse
{
    return test()->postJson('/api/login', [
        'email'    => $email,
        'password' => $password,
        'role'     => $role,
    ]);
}

// ── /api/me ────────────────────────────────────────────────────────────────
test('GET /api/me returns 401 when not authenticated', function () {
    $this->getJson('/api/me')->assertStatus(401);
});

test('GET /api/me returns user after login', function () {
    $user = makeUser('admin');
    apiLogin('admin', $user->email);   // sets session cookie
    $this->getJson('/api/me')->assertStatus(200)->assertJsonPath('user.role', 'admin');
});

// ── Login ──────────────────────────────────────────────────────────────────
test('POST /api/login returns 401 for wrong password', function () {
    $user = makeUser('teacher');
    apiLogin('teacher', $user->email, 'wrong-password')->assertStatus(401);
});

test('POST /api/login returns 401 for wrong role', function () {
    $user = makeUser('teacher');
    apiLogin('admin', $user->email)->assertStatus(401);
});

test('POST /api/login returns 403 for pending user', function () {
    $user = User::factory()->create([
        'email'    => 'pending@test.com',
        'password' => Hash::make('password'),
        'role'     => 'parent',
        'status'   => 'pending',
    ]);
    apiLogin('parent', 'pending@test.com')->assertStatus(403);
});

test('POST /api/login succeeds and returns user data', function () {
    $user = makeUser('parent');
    apiLogin('parent', $user->email)
        ->assertStatus(200)
        ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role']]);
});

test('POST /api/login rejects name-as-username (email validation)', function () {
    $user = makeUser('admin');
    $this->postJson('/api/login', [
        'email'    => $user->name,   // passing display name, not email
        'password' => 'password',
        'role'     => 'admin',
    ])->assertStatus(422); // fails email format validation
});

// ── Logout ─────────────────────────────────────────────────────────────────
test('POST /api/logout clears session', function () {
    $user = makeUser('admin');
    apiLogin('admin', $user->email);

    $this->postJson('/api/logout')->assertStatus(200);
    $this->getJson('/api/me')->assertStatus(401);
});

// ── Protected routes — require auth ───────────────────────────────────────
test('GET /api/students returns 401 when not authenticated', function () {
    $this->getJson('/api/students')->assertStatus(401);
});

test('GET /api/teachers returns 401 when not authenticated', function () {
    $this->getJson('/api/teachers')->assertStatus(401);
});

// ── Admin gate ─────────────────────────────────────────────────────────────
test('GET /api/users/pending returns 403 for non-admin', function () {
    $teacher = makeUser('teacher');
    apiLogin('teacher', $teacher->email);
    $this->getJson('/api/users/pending')->assertStatus(403);
});

test('GET /api/users/pending succeeds for admin', function () {
    $admin = makeUser('admin');
    apiLogin('admin', $admin->email);
    $this->getJson('/api/users/pending')->assertStatus(200);
});
