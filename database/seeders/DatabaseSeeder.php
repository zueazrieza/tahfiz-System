<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Admin User
        User::updateOrCreate(
            ['email' => 'admin@tahfiz.com'],
            [
                'name' => 'Admin Tahfiz',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active'
            ]
        );

        // 2. Teacher User
        User::updateOrCreate(
            ['email' => 'ustaz@tahfiz.com'],
            [
                'name' => 'Ustaz Ahmad',
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'status' => 'active'
            ]
        );

        // 3. Parent User
        User::updateOrCreate(
            ['email' => 'waris@example.com'],
            [
                'name' => 'En. Roslan',
                'password' => Hash::make('password'),
                'role' => 'parent',
                'status' => 'active'
            ]
        );

        // 4. Student User (if any)
        User::updateOrCreate(
            ['email' => 'pelajar@example.com'],
            [
                'name' => 'Najmi Masturh',
                'password' => Hash::make('password'),
                'role' => 'student',
                'status' => 'active'
            ]
        );

        $this->call([
            DemoDataSeeder::class,
        ]);
    }
}
