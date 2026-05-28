<?php

namespace Database\Seeders;

use App\Models\ClassRoom;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Models\HafazanRecord;
use App\Models\Attendance;
use App\Models\Payment;
use App\Models\AIPrediction;
use App\Models\ParentProfile;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Teachers ──────────────────────────────────────────────────────────
        $teachers = [
            ['name' => 'Ustaz Ahmad Fauzi', 'email' => 'ustaz.ahmad@tahfiz.com'],
            ['name' => 'Ustazah Aisyah',    'email' => 'ustazah.aisyah@tahfiz.com'],
            ['name' => 'Ustaz Hamid',        'email' => 'ustaz.hamid@tahfiz.com'],
        ];

        $teacherModels = [];
        foreach ($teachers as $t) {
            $user = User::updateOrCreate(['email' => $t['email']], [
                'name' => $t['name'], 'password' => Hash::make('password'),
                'role' => 'teacher', 'status' => 'active',
            ]);
            $teacherModels[] = Teacher::updateOrCreate(
                ['user_id' => $user->id],
                ['name' => $t['name'], 'user_id' => $user->id]
            );
        }

        // ── Classes ───────────────────────────────────────────────────────────
        $classNames = ['Ibnu Sina', 'Al-Farabi', 'Al-Kindi', 'Al-Ghazali'];
        $classes = [];
        foreach ($classNames as $i => $cn) {
            $classes[] = ClassRoom::firstOrCreate(['name' => $cn], [
                'teacher_id' => $teacherModels[$i % count($teacherModels)]->id ?? null,
            ]);
        }

        // ── Students ──────────────────────────────────────────────────────────
        $studentNames = [
            ['Ahmad Nawawi', 'M'], ['Muhammad Harith', 'M'], ['Fatimah Zahra', 'F'],
            ['Nur Aisyah',   'F'], ['Abdullah Umar',   'M'], ['Zaid Ibrahim',  'M'],
            ['Maryam Hana',  'F'], ['Yusuf Taha',      'M'], ['Khadijah Nisa', 'F'],
            ['Ibrahim Ismail','M'], ['Sumayyah Rahimi', 'F'], ['Omar Farouq',   'M'],
            ['Asma Siddiq',  'F'], ['Bilal Hassan',    'M'], ['Ruqayyah Amira','F'],
            ['Salman Farisi', 'M'], ['Hafsah Nuraini', 'F'], ['Anas Malik',    'M'],
            ['Umm Kulthum',  'F'], ['Talha Zubair',    'M'],
        ];

        $juzukValues = [2, 5, 8, 1, 12, 15, 3, 7, 20, 6, 10, 4, 18, 9, 25, 11, 14, 3, 22, 17];

        foreach ($studentNames as $idx => [$studentName, $gender]) {
            $class   = $classes[$idx % count($classes)];
            $juzuk   = $juzukValues[$idx];
            $dob     = Carbon::now()->subYears(rand(13, 18))->subMonths(rand(0, 11));
            $enrolled = Carbon::now()->subMonths(rand(6, 36));

            $student = Student::updateOrCreate(['name' => $studentName], [
                'gender'          => $gender,
                'dob'             => $dob->format('Y-m-d'),
                'age'             => $dob->age,
                'class_id'        => $class->id,
                'enrolled_date'   => $enrolled->format('Y-m-d'),
                'juzuk_completed' => $juzuk,
                'intake_juzuk'    => 0,
                'status'          => 'Aktif',
                'admission_type'  => 'tetap',
                'ranking'         => $idx + 1,
                'intake'          => 'Sesi 2025',
            ]);

            // ── Hafazan Records (last 30 days) ─────────────────────────────
            for ($d = 30; $d >= 1; $d -= rand(1, 3)) {
                $ayah = rand(5, 20);
                $grades = ['Mumtaz', 'Jayyid', 'Maqbul'];
                HafazanRecord::updateOrCreate(
                    ['student_id' => $student->id, 'date' => Carbon::now()->subDays($d)->format('Y-m-d')],
                    [
                        'ayah_count'    => $ayah,
                        'sabaq_grade'   => $grades[array_rand($grades)],
                        'sabaqi_grade'  => $grades[array_rand($grades)],
                        'manzil_grade'  => $grades[array_rand($grades)],
                        'sabaq_from'    => 1,
                        'sabaq_to'      => $ayah,
                        'class_room_id' => $class->id,
                    ]
                );
            }

            // ── Attendance (last 20 school days) ───────────────────────────
            for ($d = 20; $d >= 1; $d--) {
                $statuses = ['Hadir', 'Hadir', 'Hadir', 'Lewat', 'Tidak Hadir'];
                Attendance::updateOrCreate(
                    ['student_id' => $student->id, 'date' => Carbon::now()->subDays($d)->format('Y-m-d')],
                    ['status' => $statuses[array_rand($statuses)], 'class_room_id' => $class->id]
                );
            }

            // ── Payments ───────────────────────────────────────────────────
            for ($m = 5; $m >= 1; $m--) {
                $paid    = rand(0, 1);
                $monthDt = Carbon::now()->subMonths($m);
                Payment::updateOrCreate(
                    ['student_id' => $student->id, 'month' => $monthDt->month, 'year' => $monthDt->year],
                    [
                        'amount'    => 300,
                        'status'    => $paid ? 'Dibayar' : 'Belum Dibayar',
                        'paid_date' => $paid ? $monthDt->addDays(rand(1, 10))->format('Y-m-d') : null,
                        'due_date'  => $monthDt->format('Y-m-10'),
                    ]
                );
            }

            // ── AI Prediction ──────────────────────────────────────────────
            $remaining   = 30 - $juzuk;
            $avgAyah     = rand(5, 15);
            $daysLeft    = ceil(($remaining * 208) / max($avgAyah, 0.5));
            $trend       = $avgAyah >= 10 ? 'Cemerlang' : ($avgAyah >= 5 ? 'Baik' : 'Perlu Perhatian');

            AIPrediction::updateOrCreate(
                ['student_id' => $student->id],
                [
                    'current_progress'     => "{$juzuk} Juzuk (" . round(($juzuk / 30) * 100) . "%)",
                    'estimated_completion' => Carbon::now()->addDays($daysLeft)->format('Y-m-d'),
                    'performance_trend'    => $trend,
                    'confidence'           => rand(70, 95) . '%',
                    'recommendation'       => 'Teruskan momentum hafazan secara konsisten.',
                    'attendance_rate'      => rand(75, 98) . '%',
                    'avg_ayah_per_day'     => $avgAyah,
                ]
            );
        }

        $this->command->info('✅ DemoDataSeeder: 20 students, classes, hafazan, attendance, payments, AI predictions seeded.');
    }
}
