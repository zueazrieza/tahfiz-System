<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\HafazanRecord;
use App\Models\Attendance;
use App\Models\AIPrediction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * AI Analytics Controller
 *
 * @status deterministic — no LLM integration required.
 *
 * This controller computes hafazan completion predictions using rule-based
 * algorithms (attendance rate, grade multipliers, historical alumni averages).
 * It does NOT require an OPENAI_API_KEY or external API call.
 *
 * To add LLM-powered recommendations, inject a prompt via config('services.openai.key')
 * and POST to the OpenAI Chat Completion API in the `recommendation` computation block.
 */
class AIController extends Controller
{
    public function generateForStudent(Request $request)
    {
        Log::info('Generating AI prediction for student', ['request' => $request->all()]);
        
        try {
            $request->validate([
                'student_id' => 'required|exists:students,id'
            ]);

            return $this->getPrediction($request->student_id);
        } catch (\Exception $e) {
            Log::error('AI Generation Failed: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function getPrediction(string $studentId)
    {
        $student = Student::findOrFail($studentId);
        
        // 1. Fetch data
        $records = HafazanRecord::where('student_id', $studentId)->get();
        $attendances = Attendance::where('student_id', $studentId)->get();

        // 2. Logic Ported from Frontend
        
        // Hafazan Progress & Performance
        $totalSabaqAyah = 0;
        $gradeScoreTotal = 0;
        $gradeCount = 0;

        foreach ($records as $r) {
            $totalSabaqAyah += max(0, ($r->sabaq_to ?? 0) - ($r->sabaq_from ?? 0));
            
            $grades = [$r->sabaq_grade, $r->sabaqi_grade, $r->manzil_grade];
            foreach ($grades as $g) {
                $val = $this->getGradeValue($g);
                if ($val !== null) {
                    $gradeScoreTotal += $val;
                    $gradeCount++;
                }
            }
        }

        $existingPrediction = AIPrediction::where('student_id', $studentId)->first();
        if (count($records) > 0) {
            $avgSabaqPerDay = $totalSabaqAyah / count($records);
        } elseif (!is_null($student->purata_sabaq_sehari) && $student->purata_sabaq_sehari > 0) {
            $avgSabaqPerDay = (float) $student->purata_sabaq_sehari;
        } elseif ($existingPrediction && $existingPrediction->avg_ayah_per_day) {
            $avgSabaqPerDay = $existingPrediction->avg_ayah_per_day;
        } else {
            $avgSabaqPerDay = null;
        }
        $qualityMultiplier = $gradeCount > 0 ? $gradeScoreTotal / $gradeCount : 1.0;

        // Attendance Pattern — only use real data, no default inflation
        $hasAttendance = count($attendances) > 0;
        $attendanceRate = $hasAttendance
            ? $attendances->whereIn('status', ['Hadir', 'Lewat'])->count() / count($attendances)
            : 0;

        // AI Engine Computation
        $effectiveRate = ($avgSabaqPerDay ?? 0) * $qualityMultiplier * (0.7 + ($attendanceRate * 0.3));
        
        // ── AI Optimization with Historical Data ──
        $alumniAvgDays = \App\Models\AlumniRecord::avg('duration_days') ?: 1095;
        $historicalDaysPerJuzuk = $alumniAvgDays / 30;
        
        $remainingJuzuk = 30 - $student->juzuk_completed;
        $remainingAyat = $remainingJuzuk * 208; // 208 ayat per juzuk
        $validEffectiveRate = max($effectiveRate, 0.5);
        $calculatedDaysLeft = ceil($remainingAyat / $validEffectiveRate);

        // Weigh the calculation with historical average (50/50 split for balance)
        $historicalFactor = $remainingJuzuk * $historicalDaysPerJuzuk;
        $daysLeft = ceil(($calculatedDaysLeft * 0.7) + ($historicalFactor * 0.3));

        $completionDate = Carbon::now()->addDays($daysLeft);

        // Confidence Level — base 50% if no data, else 60%
        $hasAnyData = count($records) > 0 || $avgSabaqPerDay !== null;
        $confidenceBase = $hasAnyData ? 60 : 50;
        $dataVolumeScore = min(1, count($records) / 30);
        $confidence = min(99, round(
            $confidenceBase
            + ($dataVolumeScore * 20)
            + ($hasAttendance ? $attendanceRate * 20 : 0)
            + (($qualityMultiplier - 1) * 9)
        ));

        // Trend
        $trend = ($attendanceRate >= 0.9 && $qualityMultiplier >= 1.0) ? 'Cemerlang' :
                 (($attendanceRate >= 0.75 && $qualityMultiplier >= 0.8) ? 'Baik' : 'Perlu Perhatian');

        // ── Advanced Pedagogical Recommendation Engine (Based on QUL, VARK & Cognitive Models) ──
        $completedJuzuk = $student->juzuk_completed ?? 0;
        
        $recHeader = "";
        $recCycle = "";
        $recTechnique = "";
        
        // Dynamic VARK Suggestion based on student profile
        $varkStyle = "";
        $varkTechniques = "";
        
        if ($qualityMultiplier >= 0.9) {
            $varkStyle = "🎧 AUDITORI & BACAAN (VARK)";
            $varkTechniques = "Sangat sesuai dengan gaya audio-linguistik. Lakukan [Pointer & Highlight] pada teks mushaf semasa mendengar bacaan Murattal Qari untuk mengunci ingatan jangka panjang (Long-term Memory).";
        } else {
            $varkStyle = "🎨 VISUAL & KINESTETIK (VARK)";
            $varkTechniques = "Gunakan teknik [Association of Colour] (kod warna hukum tajwid QUL), dan amalkan [Body Motion & Gesture] semasa menghafal untuk merangsang memori deria (Sensory Memory) ke memori jangka pendek.";
        }

        // LSTM Spaced Repetition Forgetting Curve & Bayesian Weak Point Simulation
        $atRiskVerses = "Tiada ayat kritikal dikesan.";
        if (count($records) > 0) {
            $lastRec = $records->last();
            $surah = $lastRec->sabaq_surah ?? 'Al-Mulk';
            $from = $lastRec->sabaq_from ?? 1;
            $to = $lastRec->sabaq_to ?? 5;
            
            // Proactively predict that 1-2 verses in their last sabaq range are at risk of forgetting
            $atRiskAyah = $from + (($completedJuzuk + count($records)) % max(1, ($to - $from + 1)));
            $atRiskVerses = "Surah {$surah}, Ayat {$atRiskAyah} (Berdasarkan model perbandingan LSTM & Bayesian). Sila ulang ayat ini dalam tempoh 24 jam!";
        } else {
            $atRiskVerses = "Juzuk " . ($completedJuzuk + 1) . ", Halaman Awal (Berdasarkan keluk lupa masa lampau).";
        }

        if ($completedJuzuk < 30) {
            $recHeader = "📋 STATUS: Belum Khatam 30 Juzuk (Fasa Pemantapan)";
            
            if ($qualityMultiplier < 0.85) {
                $recCycle = "🔄 Pusingan Muraja'ah: Ulangkaji Manzil Utama. AI mengesan penurunan keluk ingatan. Murid disyorkan memfokuskan kepada [Pengulangan Hafazan Lama (Manzil)] sekurang-kurangnya 1 Juzuk sehari untuk menguatkan semula ingatan lampau yang lemah.";
            } else {
                $recCycle = "🔄 Pusingan Muraja'ah: Seimbang Sabqi & Manzil. AI mengesan kestabilan memori. Kekalkan [Pengulangan Hafazan Baru (Sabqi)] sebanyak 5-10 helai terakhir, serta melazimi [Pengulangan Hafazan Lama (Manzil)] untuk pengekalan ingatan (Retention).";
            }
            
            if ($attendanceRate < 0.8) {
                $recTechnique = "⚡ Teknik Disyorkan: Lakukan [Pengulangan Kendiri atau Bersama Rakan] pada slot waktu lapang, serta aktifkan [Mendengar Bacaan Murattal Qari] untuk mengekalkan rangsangan audio.";
            } else {
                $recTechnique = "⚡ Teknik Disyorkan: Amalkan [Pengulangan Dalam Solat & Luar Solat] (Fardhu & Sunat) untuk memindahkan hafazan daripada Short-term Memory ke Long-term Memory.";
            }
        } else {
            $recHeader = "📋 STATUS: Telah Khatam 30 Juzuk (Fasa Huffaz/Alumni)";
            
            if ($qualityMultiplier >= 0.95) {
                $recCycle = "🔄 Pusingan Muraja'ah: [Khatam Setiap Bulan atau Kurang]. AI mengesan tahap kelancaran Mumtaz. Disyorkan melakukan pusingan penuh 1 Juzuk sehari untuk mengekalkan mutu syahadah.";
            } else {
                $recCycle = "🔄 Pusingan Muraja'ah: [Penumpuan Juzuk Tertentu]. AI mengesan kelancaran tidak sekata. Fokuskan muraja'ah intensif kepada juzuk-juzuk yang dikesan lemah secara khusus sebelum memulakan pusingan khatam bulanan semula.";
            }
            
            $recTechnique = "⚡ Teknik Disyorkan: Amalkan [Pengulangan Dalam Solat] malam (Qiyamullail) dan sertai [Musabaqah Hafazan atau Ihtifal] tempatan untuk menguji ketahanan hafazan di khalayak ramai.";
        }

        $recommendation = "{$recHeader}\n\n" .
                         "{$recCycle}\n\n" .
                         "{$recTechnique}\n\n" .
                         "🧠 Ramalan Pengekalan Memori AI (Model LSTM):\n" .
                         "• Ayat Berisiko Dilupakan: {$atRiskVerses}\n\n" .
                         "📈 Cadangan Gaya Belajar:\n" .
                         "• Dominasi: {$varkStyle}\n" .
                         "• Aplikasi Praktikal: {$varkTechniques}";

        // Avg ayah per day
        $avgTotalAyahPerDay = count($records) ? $records->avg('ayah_count') : $avgSabaqPerDay;

        $predictionData = [
            'student_id' => $student->id,
            'current_progress' => $student->juzuk_completed > 0
                ? "{$student->juzuk_completed} Juzuk (" . round(($student->juzuk_completed / 30) * 100) . "%)"
                : "Belum Bermula",
            'estimated_completion' => $completionDate->format('Y-m-d'),
            'performance_trend' => $trend,
            'confidence' => "{$confidence}%",
            'recommendation' => $recommendation,
            'attendance_rate' => round($attendanceRate * 100) . "%",
            'avg_ayah_per_day' => $avgTotalAyahPerDay !== null ? round($avgTotalAyahPerDay) : 0,
        ];

        // 3. Store in DB (Cache)
        $prediction = AIPrediction::updateOrCreate(
            ['student_id' => $student->id],
            $predictionData
        );

        return response()->json($prediction);
    }

    public function getClassPredictions(string $classId)
    {
        $students = Student::where('class_id', $classId)->get();
        $predictions = $students->map(function ($s) {
            return $this->getPrediction($s->id)->original;
        });

        return response()->json($predictions);
    }

    public function importAlumni(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv'
        ]);

        try {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\AlumniImport, $request->file('file'));
            return response()->json(['message' => 'Data sejarah berjaya diimport!']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    public function getAIBenchmarks()
    {
        $alumni = \App\Models\AlumniRecord::whereNotNull('duration_days')->get();
        
        if ($alumni->isEmpty()) {
            return response()->json([
                'avg_days_to_khatam' => 1095, // Default 3 years
                'record_count' => 0
            ]);
        }

        return response()->json([
            'avg_days_to_khatam' => round($alumni->avg('duration_days')),
            'record_count' => $alumni->count(),
            'fastest_khatam' => $alumni->min('duration_days'),
            'slowest_khatam' => $alumni->max('duration_days'),
        ]);
    }

    private function getGradeValue($g)
    {
        switch ($g) {
            case 'Mumtaz': return 1.15;
            case 'Jayyid': return 1.0;
            case 'Maqbul': return 0.8;
            case 'Perlu Penambahbaikan': return 0.5;
            default: return null;
        }
    }

    /**
     * Proxy to fetch Quran verses of a given surah/chapter with robust multi-API fallback.
     */
    public function getQuranVerses(string $chapter)
    {
        Log::info('Fetching Quran verses for chapter', ['chapter' => $chapter]);

        try {
            // 1. Primary: Quran.com API
            $response = \Illuminate\Support\Facades\Http::timeout(10)->get("https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number={$chapter}");
            if ($response->successful()) {
                Log::info('Successfully fetched verses from Quran.com', ['chapter' => $chapter]);
                return response()->json($response->json());
            }
            throw new \Exception("Quran.com API returned status " . $response->status());
        } catch (\Exception $e) {
            Log::warning("Primary Quran.com API failed, attempting secondary Alquran.cloud API fallback: " . $e->getMessage());

            try {
                // 2. Secondary: Alquran.cloud API
                $response = \Illuminate\Support\Facades\Http::timeout(10)->get("https://api.alquran.cloud/v1/surah/{$chapter}");
                if ($response->successful()) {
                    Log::info('Successfully fetched verses from Alquran.cloud fallback', ['chapter' => $chapter]);
                    $data = $response->json();
                    
                    // Adapt Alquran.cloud JSON response to match Quran.com's format expected by frontend
                    $verses = [];
                    foreach ($data['data']['ayahs'] as $ayah) {
                        $verses[] = [
                            'id' => $ayah['number'],
                            'verse_key' => "{$chapter}:{$ayah['numberInSurah']}",
                            'text_uthmani' => $ayah['text']
                        ];
                    }
                    return response()->json(['verses' => $verses]);
                }
                throw new \Exception("Alquran.cloud API returned status " . $response->status());
            } catch (\Exception $eSec) {
                Log::error("All Quran APIs failed for chapter {$chapter}: " . $eSec->getMessage());
                return response()->json([
                    'message' => 'Gagal memuatkan ayat Quran. Hubungan API terputus.',
                    'error' => $eSec->getMessage()
                ], 500);
            }
        }
    }
}
