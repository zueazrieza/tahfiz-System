<?php

namespace Database\Seeders;

use App\Models\AlumniRecord;
use App\Http\Controllers\AIController;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AlumniDataSeeder extends Seeder
{
    public function run(): void
    {
        // Skip if already seeded (more than 15 records = already done)
        if (AlumniRecord::count() > 15) {
            $this->command->info('Alumni data already seeded (' . AlumniRecord::count() . ' records). Skipping insert.');
        } else {
            $this->seedAlumni();
        }

        $this->regeneratePredictions();
    }

    private function seedAlumni(): void
    {
        $data = [
            // Fast graduates (730-1095 days) ~20%
            ['Ahmad Luqmanul Hakim',    810,  'M. Auni'],
            ['Muhammad Zikri',          756,  'M. Muntazir'],
            ['Nurul Huda Aisyah',       890,  'Ustazah Aisyah'],
            ['Hafiz Danial',            820,  'M. Faiz'],
            ['Zahra Batrisyia',         940,  'M. Ayuni'],
            ['Muhammad Arif Luqman',    870,  'M. Aliff'],
            ['Nur Iman Syahirah',       995,  'Ustazah Aisyah'],
            ['Sulaiman Rafiq',         1050,  'M. Hakeem'],
            ['Nur Fatimah Zahrah',     1030,  'M. Ayuni'],
            ['Khairul Amri',            780,  'M. Harith'],

            // Average graduates (1095-1460 days) ~60%
            ['Ahmad Firdaus',          1100,  'M. Auni'],
            ['Nor Hidayah',            1150,  'Ustazah Aisyah'],
            ['Muhammad Asyraf',        1200,  'M. Muntazir'],
            ['Siti Maryam',            1250,  'M. Ayuni'],
            ['Abdul Muiz',             1180,  'M. Faiz'],
            ['Wardah Nadhirah',        1220,  'Ustazah Aisyah'],
            ['Mohd Hafeez',            1300,  'M. Harith'],
            ['Nur Liyana',             1280,  'M. Ayuni'],
            ['Izzat Hazim',            1140,  'M. Aliff'],
            ['Madinah Raihanah',       1350,  'M. Ayuni'],
            ['Ahmad Zulkhairi',        1170,  'M. Hakeem'],
            ['Fatin Nabihah',          1230,  'Ustazah Aisyah'],
            ['Mohd Ridhuan',           1310,  'M. Auni'],
            ['Nur Amalina',            1260,  'M. Ayuni'],
            ['Haziq Syazwan',          1190,  'M. Muntazir'],
            ['Siti Hajar',             1380,  'Ustazah Aisyah'],
            ['Muhammad Nasrullah',     1420,  'M. Faiz'],
            ['Ainul Mardhiah',         1150,  'M. Ayuni'],
            ['Hafizuddin Akram',       1330,  'M. Harith'],
            ['Nur Qurratu Ain',        1210,  'Ustazah Aisyah'],
            ['Ridwan Afiq',            1270,  'M. Aliff'],
            ['Masturah Hamidah',       1390,  'M. Ayuni'],

            // Slower graduates (1460-1800 days) ~20%
            ['Mukhlis Hamdan',         1500,  'M. Hakeem'],
            ['Rabiatul Adawiyah',      1550,  'Ustazah Aisyah'],
            ['Mohd Hafizudin',         1600,  'M. Auni'],
            ['Zulaikha Izzati',        1480,  'M. Ayuni'],
            ['Saiful Anwar',           1700,  'M. Muntazir'],
            ['Khairunnisa',            1650,  'Ustazah Aisyah'],
            ['Mohd Khairul Nizam',     1580,  'M. Harith'],
            ['Siti Nabilah',           1720,  'M. Ayuni'],
            ['Fahmi Hakimi',           1540,  'M. Faiz'],
            ['Nur Aini Izzatul',       1800,  'Ustazah Aisyah'],
        ];

        $inserted = 0;
        foreach ($data as [$name, $days, $murabbi]) {
            $startYear  = rand(2015, 2022);
            $startDate  = Carbon::create($startYear, rand(1, 12), rand(1, 28));
            $khatamDate = $startDate->copy()->addDays($days);

            AlumniRecord::create([
                'name'          => $name,
                'murabbi_name'  => $murabbi,
                'start_date'    => $startDate->toDateString(),
                'khatam_date'   => $khatamDate->toDateString(),
                'duration_days' => $days,
            ]);
            $inserted++;
        }

        $avg = round(AlumniRecord::avg('duration_days'));
        $this->command->info("Inserted {$inserted} alumni records. Total: " . AlumniRecord::count() . ". Avg: {$avg} days (" . round($avg / 365, 1) . " years)");
    }

    private function regeneratePredictions(): void
    {
        $controller = new AIController();
        $students   = Student::where('status', 'Aktif')->get();
        $done       = 0;
        $errors     = 0;

        $this->command->info("Generating AI predictions for {$students->count()} active students...");

        foreach ($students as $student) {
            try {
                $controller->getPrediction($student->id);
                $done++;
            } catch (\Exception $e) {
                $errors++;
                $this->command->warn("Error for {$student->name}: " . $e->getMessage());
            }
        }

        $this->command->info("Done: {$done} predictions generated. Errors: {$errors}.");
    }
}
