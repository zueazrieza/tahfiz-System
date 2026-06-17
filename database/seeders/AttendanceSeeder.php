<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Attendance;
use App\Models\Student;
use App\Models\ClassRoom;
use Carbon\Carbon;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing data
        Attendance::truncate();

        // Get all students that have a class
        $students = Student::whereNotNull('class_id')->get(['id', 'class_id']);

        // Get class → teacher_id map
        $classTeacher = ClassRoom::all(['id', 'teacher_id'])
            ->pluck('teacher_id', 'id');

        // Generate school days: Mon–Fri from 2026-03-01 to yesterday
        $start = Carbon::parse('2026-03-01');
        $end   = Carbon::yesterday();

        $schoolDays = [];
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            // Skip weekends (Sat=6, Sun=0)
            if ($d->dayOfWeek === Carbon::SATURDAY || $d->dayOfWeek === Carbon::SUNDAY) {
                continue;
            }
            // Skip a few Malaysian public holidays (rough dates)
            $mdStr = $d->format('m-d');
            if (in_array($mdStr, ['03-28', '03-31', '04-11', '05-01', '05-12', '06-02', '06-07'])) {
                continue;
            }
            $schoolDays[] = $d->format('Y-m-d');
        }

        // Per-student attendance profile: mix of high, medium, low attendance
        // 70% students → 90–98% hadir (rajin)
        // 20% students → 75–89% hadir (sederhana)
        // 10% students → 55–74% hadir (perlu perhatian)
        $rows = [];
        $now  = now()->toDateTimeString();

        foreach ($students as $student) {
            $teacherId = $classTeacher[$student->class_id] ?? null;

            // Assign attendance tier
            $rand = rand(1, 100);
            if ($rand <= 70) {
                $hadirChance  = rand(90, 98);
            } elseif ($rand <= 90) {
                $hadirChance  = rand(75, 89);
            } else {
                $hadirChance  = rand(55, 74);
            }

            // Lewat chance: ~10% of total sessions
            $lewatChance = rand(5, 15);

            foreach ($schoolDays as $date) {
                $roll = rand(1, 100);

                if ($roll <= $hadirChance) {
                    // Present — might be late
                    $isLate = rand(1, 100) <= $lewatChance;
                    $status  = $isLate ? 'Lewat' : 'Hadir';
                    $remarks = $isLate ? $this->randomLateReason() : null;
                } else {
                    $status  = 'Tidak Hadir';
                    $remarks = $this->randomAbsentReason();
                }

                $rows[] = [
                    'student_id' => $student->id,
                    'class_id'   => $student->class_id,
                    'teacher_id' => $teacherId,
                    'date'       => $date,
                    'status'     => $status,
                    'remarks'    => $remarks,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // Bulk insert in chunks of 500
        foreach (array_chunk($rows, 500) as $chunk) {
            Attendance::insert($chunk);
        }

        $total = count($rows);
        $this->command->info("✅ Seeded {$total} attendance records for " . $students->count() . " students across " . count($schoolDays) . " school days.");
    }

    private function randomAbsentReason(): string
    {
        $reasons = [
            'Sakit',
            'Urusan keluarga',
            'Tidak hadir tanpa sebab',
            'Sakit – ada MC',
            'Balik kampung',
            'Urusan perubatan',
            'Tidak hadir tanpa makluman',
            'Kematian ahli keluarga',
        ];
        return $reasons[array_rand($reasons)];
    }

    private function randomLateReason(): string
    {
        $reasons = [
            'Terlambat bangun',
            'Kenderaan rosak',
            'Trafik sesak',
            'Urusan peribadi',
            null,
            null,
        ];
        return $reasons[array_rand($reasons)] ?? 'Lewat';
    }
}
