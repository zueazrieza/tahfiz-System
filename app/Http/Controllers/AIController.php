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
        // Return pre-computed prediction from AIPredictionController if available
        $stored = AIPrediction::where('student_id', $studentId)->first();
        if ($stored) {
            return response()->json(array_merge($stored->toArray(), [
                'avg_pages_per_week' => $stored->pages_per_day ? round($stored->pages_per_day * 7, 1) : null,
                'sabaq_score'        => $stored->sabaq_score,
                'sabki_score'        => $stored->sabki_score,
                'manzil_score'       => $stored->manzil_score,
            ]));
        }

        $student = Student::findOrFail($studentId);

        $records    = HafazanRecord::where('student_id', $studentId)->orderBy('date')->get();
        $attendances = Attendance::where('student_id', $studentId)->get();

        $completedJuzuk = (int) ($student->juzuk_completed ?? 0);
        // 604 pages total, ~20.13 pages per juzuk
        $pagesMemorized  = round($completedJuzuk * (604 / 30));
        $remainingPages  = 604 - $pagesMemorized;
        $progressPercent = round($pagesMemorized / 604 * 100, 1);

        // ── 1. SABAK SCORE (Hafazan Baharu) ──────────────────────────────────
        $sabaqScores = $records->map(fn($r) => $this->gradeToScore($r->sabaq_grade))->filter()->values();
        $sabaqScore  = $sabaqScores->count() ? round($sabaqScores->avg()) : null;

        // Avg ayah per sabak session → convert to pages (15 ayat ≈ 1 page)
        $sabaqAyahPerSession = $records->map(function ($r) {
            return max(0, ($r->sabaq_to ?? 0) - ($r->sabaq_from ?? 0));
        })->filter(fn($v) => $v > 0);
        $avgSabaqAyahPerDay  = $sabaqAyahPerSession->count() ? $sabaqAyahPerSession->avg() : null;

        // Pages per week from real records (last 4 weeks window)
        $recentRecords = $records->filter(fn($r) => Carbon::parse($r->date)->gte(Carbon::now()->subWeeks(4)));
        $weeksSpanned  = max(1, $recentRecords->count() > 0
            ? Carbon::parse($recentRecords->first()->date)->diffInWeeks(Carbon::now()) + 1
            : 1);
        $totalRecentAyah     = $recentRecords->sum(fn($r) => max(0, ($r->sabaq_to ?? 0) - ($r->sabaq_from ?? 0)));
        $avgPagesPerWeek     = $weeksSpanned > 0 && $totalRecentAyah > 0
            ? round($totalRecentAyah / 15 / $weeksSpanned, 1)
            : ($student->purata_sabaq_sehari ? round($student->purata_sabaq_sehari * 7 / 15, 1) : null);

        // Sabak achievement vs weekly target (default target: 5 pages/week)
        $weeklyTarget = $student->target_hafazan ? (float) $student->target_hafazan : 5;
        $sabaqAchievement = $avgPagesPerWeek !== null
            ? min(100, round($avgPagesPerWeek / $weeklyTarget * 100))
            : null;

        // ── 2. SABKI SCORE (Ulang Kaji Semasa / Sabaqi) ──────────────────────
        $sabkiScores = $records->map(fn($r) => $this->gradeToScore($r->sabaqi_grade))->filter()->values();
        $sabkiScore  = $sabkiScores->count() ? round($sabkiScores->avg()) : null;

        // ── 3. MANZIL SCORE (Ulang Kaji Juzuk Lama) ──────────────────────────
        $manzilScores = $records->map(fn($r) => $this->gradeToScore($r->manzil_grade))->filter()->values();
        $manzilScore  = $manzilScores->count() ? round($manzilScores->avg()) : null;

        // Manzil coverage: unique juzuk reviewed vs total completed
        $manzilCoverage = null;
        if ($completedJuzuk > 0 && $records->count() > 0) {
            $uniqueManzilSurah = $records->pluck('manzil_surah')->filter()->unique()->count();
            // Approximate: assume each unique surah in manzil = at least part of a juzuk reviewed
            $manzilCoverage = min(100, round($uniqueManzilSurah / max(1, $completedJuzuk) * 100));
        }

        // ── 4. ATTENDANCE + PONTENG ──────────────────────────────────────────
        $totalAttendance = $attendances->count();
        $attendanceRate  = $totalAttendance > 0
            ? $attendances->whereIn('status', ['Hadir', 'Lewat'])->count() / $totalAttendance
            : null;

        // Count ponteng specifically (remarks = 'Ponteng', case-insensitive)
        $pontengCount = $attendances->filter(
            fn($a) => $a->status === 'Tidak Hadir' && strtolower(trim($a->remarks ?? '')) === 'ponteng'
        )->count();
        $pontengRate = $totalAttendance > 0 ? $pontengCount / $totalAttendance : 0;

        // Ponteng penalty label
        if ($pontengRate >= 0.20) {
            $pontengLabel   = 'Kritikal';
            $pontengPenalty = 0.35; // +35% more weeks
        } elseif ($pontengRate >= 0.10) {
            $pontengLabel   = 'Membimbangkan';
            $pontengPenalty = 0.20;
        } elseif ($pontengRate >= 0.05) {
            $pontengLabel   = 'Perhatian';
            $pontengPenalty = 0.10;
        } else {
            $pontengLabel   = null;
            $pontengPenalty = 0;
        }

        // ── 5. ESTIMATED COMPLETION DATE ─────────────────────────────────────
        if ($avgPagesPerWeek && $avgPagesPerWeek > 0) {
            $weeksLeft = ceil($remainingPages / $avgPagesPerWeek);
            // Apply ponteng penalty — each skip session extends timeline
            $weeksLeft = (int) ceil($weeksLeft * (1 + $pontengPenalty));
            $completionDate = Carbon::now()->addWeeks($weeksLeft);
        } else {
            // Fallback: alumni average (3 years default)
            $alumniAvgDays  = \App\Models\AlumniRecord::avg('duration_days') ?: 1095;
            $daysLeft       = ceil(($remainingPages / 604) * $alumniAvgDays);
            $daysLeft       = (int) ceil($daysLeft * (1 + $pontengPenalty));
            $completionDate = Carbon::now()->addDays($daysLeft);
        }

        // ── 6. PERFORMANCE TREND ─────────────────────────────────────────────
        $recentSabaq = $records->filter(fn($r) => Carbon::parse($r->date)->gte(Carbon::now()->subDays(14)));
        $olderSabaq  = $records->filter(fn($r) => Carbon::parse($r->date)->lt(Carbon::now()->subDays(14))
            && Carbon::parse($r->date)->gte(Carbon::now()->subDays(28)));

        $recentAvgGrade = $recentSabaq->map(fn($r) => $this->gradeToScore($r->sabaq_grade))->filter()->avg();
        $olderAvgGrade  = $olderSabaq->map(fn($r) => $this->gradeToScore($r->sabaq_grade))->filter()->avg();

        if ($recentAvgGrade && $olderAvgGrade) {
            $trend = $recentAvgGrade >= $olderAvgGrade + 5 ? 'Meningkat'
                : ($recentAvgGrade <= $olderAvgGrade - 5 ? 'Menurun' : 'Stabil');
        } elseif ($sabaqScore !== null && $sabaqScore >= 75) {
            $trend = 'Stabil';
        } else {
            $trend = 'Belum Cukup Data';
        }

        // ── 7. OVERALL PERFORMANCE LABEL ─────────────────────────────────────
        $overallScores = collect([$sabaqScore, $sabkiScore, $manzilScore])->filter();
        $overallAvg    = $overallScores->count() ? $overallScores->avg() : null;
        $performanceLabel = $overallAvg !== null ? $this->scoreToLabel($overallAvg) : 'Belum Cukup Data';

        // ── 8. CONFIDENCE ────────────────────────────────────────────────────
        $confidence = 40; // base
        $confidence += min(20, $records->count() * 2);         // up to +20 for 10+ records
        $confidence += $sabaqScore !== null ? 10 : 0;
        $confidence += $sabkiScore !== null ? 10 : 0;
        $confidence += $manzilScore !== null ? 10 : 0;
        $confidence += $attendanceRate !== null ? 10 : 0;
        // Ponteng reduces confidence: it makes timeline less predictable
        $confidence -= (int) round($pontengRate * 30);         // -30% of confidence per ponteng rate
        $confidence  = min(99, max(20, $confidence));

        // ── 9. RECOMMENDATION ────────────────────────────────────────────────
        $sabaqLabel  = $sabaqScore  !== null ? $this->scoreToLabel($sabaqScore)  : 'Tiada Data';
        $sabkiLabel  = $sabkiScore  !== null ? $this->scoreToLabel($sabkiScore)  : 'Tiada Data';
        $manzilLabel = $manzilScore !== null ? $this->scoreToLabel($manzilScore) : 'Tiada Data';

        $sabaqLine  = $sabaqScore  !== null ? "Sabak: {$sabaqScore}% ({$sabaqLabel})"   : "Sabak: Tiada Rekod";
        $sabkiLine  = $sabkiScore  !== null ? "Sabki: {$sabkiScore}% ({$sabkiLabel})"   : "Sabki: Tiada Rekod";
        $manzilLine = $manzilScore !== null ? "Manzil: {$manzilScore}% ({$manzilLabel})" : "Manzil: Tiada Rekod";

        // Sabak advice
        if ($sabaqAchievement !== null && $sabaqAchievement < 80) {
            $sabaqAdvice = "Pencapaian Sabak minggu ini ({$sabaqAchievement}%) masih di bawah sasaran. Cuba tambah bilangan halaman baharu setiap hari.";
        } elseif ($sabaqScore !== null && $sabaqScore < 60) {
            $sabaqAdvice = "Kualiti hafalan baharu (Sabak) perlu diperbaiki. Ulang semula sebelum tambah halaman baharu.";
        } else {
            $sabaqAdvice = "Kekalkan kadar hafalan Sabak semasa. Tambah 1–2 ayat setiap sesi jika selesa.";
        }

        // Sabki advice
        if ($sabkiScore === null) {
            $sabkiAdvice = "Tiada rekod Sabki. Pastikan guru merekod ulang kaji semasa setiap sesi.";
        } elseif ($sabkiScore < 60) {
            $sabkiAdvice = "Sabki lemah. Pelajar perlu meningkatkan ulang kaji hafalan dalam juzuk semasa sebelum meneruskan Sabak.";
        } else {
            $sabkiAdvice = "Sabki dalam keadaan baik. Pastikan kelancaran dikekalkan dalam 5–10 helai terakhir.";
        }

        // Manzil advice
        if ($manzilScore === null || $manzilCoverage === null) {
            $manzilAdvice = "Tiada rekod Manzil. Guru perlu merekod ulang kaji juzuk lama secara berkala.";
        } elseif ($manzilScore < 60) {
            $manzilAdvice = "Manzil lemah ({$manzilScore}%). Kurangkan penambahan Sabak dan fokus ulang kaji juzuk lama.";
        } elseif ($manzilCoverage < 50) {
            $manzilAdvice = "Liputan Manzil hanya {$manzilCoverage}% daripada juzuk yang dihafal. Perlu lebih konsisten mengulang juzuk lama.";
        } else {
            $manzilAdvice = "Manzil baik dengan liputan {$manzilCoverage}%. Teruskan jadual ulang kaji juzuk lama secara sistematik.";
        }

        $completionStr = $completionDate->format('Y-m-d');

        // Ponteng warning block
        $pontengWarning = '';
        if ($pontengLabel !== null) {
            $pontengPct   = round($pontengRate * 100);
            $pontengWarning = "\n\n⚠️ AMARAN PONTENG ({$pontengLabel}):\n" .
                "• Pelajar ponteng {$pontengCount} sesi daripada {$totalAttendance} ({$pontengPct}% kadar ponteng).\n" .
                "• Anggaran khatam telah dilanjutkan " . round($pontengPenalty * 100) . "% akibat ketidakhadiran tanpa sebab.\n" .
                "• Sila berbincang dengan pelajar dan ibu bapa untuk mengenal pasti punca ponteng.";
        }

        $recommendation =
            "LAPORAN KEMAJUAN HAFAZAN (KAEDAH SABAK–SABKI–MANZIL)\n\n" .
            "Kemajuan Keseluruhan: {$pagesMemorized} / 604 halaman ({$progressPercent}%)\n" .
            "Anggaran Khatam: {$completionStr}\n\n" .
            "SKOR KOMPONEN:\n" .
            "• {$sabaqLine}\n" .
            "• {$sabkiLine}\n" .
            "• {$manzilLine}\n\n" .
            "CADANGAN GURU:\n" .
            "• {$sabaqAdvice}\n" .
            "• {$sabkiAdvice}\n" .
            "• {$manzilAdvice}" .
            $pontengWarning;

        // ── 10. STORE ────────────────────────────────────────────────────────
        $predictionData = [
            'student_id'          => $student->id,
            'current_progress'    => "{$completedJuzuk} Juzuk / {$pagesMemorized} Halaman ({$progressPercent}%)",
            'estimated_completion' => $completionDate->format('Y-m-d'),
            'performance_trend'   => $performanceLabel . ' — ' . $trend,
            'confidence'          => "{$confidence}%",
            'recommendation'      => $recommendation,
            'attendance_rate'     => $attendanceRate !== null ? round($attendanceRate * 100) . '%' : 'N/A',
            'avg_ayah_per_day'    => $avgSabaqAyahPerDay !== null ? round($avgSabaqAyahPerDay) : 0,
        ];

        $prediction = AIPrediction::updateOrCreate(
            ['student_id' => $student->id],
            $predictionData
        );

        return response()->json(array_merge($prediction->toArray(), [
            'sabaq_score'        => $sabaqScore,
            'sabki_score'        => $sabkiScore,
            'manzil_score'       => $manzilScore,
            'sabaq_achievement'  => $sabaqAchievement,
            'manzil_coverage'    => $manzilCoverage,
            'pages_memorized'    => $pagesMemorized,
            'pages_remaining'    => $remainingPages,
            'avg_pages_per_week' => $avgPagesPerWeek,
            'ponteng_count'      => $pontengCount,
            'ponteng_rate'       => round($pontengRate * 100),
            'ponteng_label'      => $pontengLabel,
        ]));
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

    // Grade string → numeric score (0–100)
    private function gradeToScore($grade): ?float
    {
        return match ($grade) {
            'Mumtaz'                => 95.0,
            'Jayyid Jiddan'         => 87.0,
            'Jayyid'                => 80.0,
            'Maqbul'                => 67.0,
            'Perlu Penambahbaikan'  => 45.0,
            'Sangat Baik'           => 92.0,
            'Baik'                  => 80.0,
            'Sederhana'             => 67.0,
            'Lemah'                 => 45.0,
            'Perlu Ulang'           => 25.0,
            default                 => null,
        };
    }

    // Score → descriptive label
    private function scoreToLabel(float $score): string
    {
        return match (true) {
            $score >= 90 => 'Mumtaz',
            $score >= 75 => 'Baik',
            $score >= 60 => 'Sederhana',
            $score >= 40 => 'Lemah',
            default      => 'Perlu Ulang Semula',
        };
    }

    // Keep for backward-compat with AIPredictionController
    private function getGradeValue($g): ?float
    {
        $score = $this->gradeToScore($g);
        return $score !== null ? $score / 100 : null;
    }

    /**
     * Proxy to fetch Malay (Basmeih) translation for a surah.
     */
    public function getQuranTranslation(string $chapter)
    {
        $chapterInt = (int) $chapter;
        if ($chapterInt < 1 || $chapterInt > 114) {
            return response()->json(['error' => 'Invalid chapter number'], 422);
        }
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(10)
                ->get("https://api.alquran.cloud/v1/surah/{$chapterInt}/ms.basmeih");
            if ($response->successful()) {
                return response()->json($response->json());
            }
            throw new \Exception("alquran.cloud translation returned status " . $response->status());
        } catch (\Exception $e) {
            Log::warning("Translation proxy failed for chapter {$chapter}: " . $e->getMessage());
            return response()->json(['data' => ['ayahs' => []]], 200);
        }
    }

    /**
     * Proxy to fetch Quran verses of a given surah/chapter with robust multi-API fallback.
     */
    public function getQuranVerses(string $chapter)
    {
        $chapterInt = (int) $chapter;
        if ($chapterInt < 1 || $chapterInt > 114) {
            return response()->json(['error' => 'Invalid chapter number'], 422);
        }
        $chapter = (string) $chapterInt;
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
