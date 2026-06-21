<?php

namespace App\Http\Controllers;

use App\Models\AIPrediction;
use App\Models\Student;
use Illuminate\Http\Request;

class AIPredictionController extends Controller
{
    // Al-Quran constants (Ts Noorhuzaimi formula)
    const PAGES_PER_JUZ    = 20;   // 1 juzuk = 20 mukasurat
    const TOTAL_PAGES      = 604;  // 30 juzuk x ~20.13 mukasurat
    const TOTAL_JUZ        = 30;

    // Completion window: min 1 year, max 1.5 years (for struggling students)
    const MIN_DAYS = 365;          // 1 tahun
    const MAX_DAYS = 548;          // 1 tahun 6 bulan

    /**
     * Shared prediction engine.
     * Returns array of prediction fields ready to save.
     */
    private function computePrediction(Student $student): array
    {
        $juzuk   = $student->juzuk_completed ?? 0;
        $records = $student->hafazanRecords;
        $attendance = $student->attendanceRecords;

        // ── 1. Calculate average Sabaq pages per day ──────────────────────
        // ayah_count from records ≈ ayat. Convert: ~6 ayat ≈ 1 mukasurat.
        // But also check if sabaq_pages stored directly.
        $totalAyah = $records->sum('ayah_count');

        // Derive pages/day: avg ayah per session ÷ 6 ayat per muka surat
        $avgPagesPerDay = null;
        if ($records->count() > 0) {
            $avgAyahPerSession = $totalAyah / $records->count();
            $avgPagesPerDay    = round($avgAyahPerSession / 6, 2);  // ~6 ayat = 1 muka surat
        } elseif (!is_null($student->purata_sabaq_sehari) && $student->purata_sabaq_sehari > 0) {
            // Fallback: purata_sabaq_sehari stored as ayat/day
            $avgPagesPerDay = round($student->purata_sabaq_sehari / 6, 2);
        }

        // ── 2. Pages progress ─────────────────────────────────────────────
        $pagesCompleted = min(self::TOTAL_PAGES, $juzuk * self::PAGES_PER_JUZ);
        $pagesRemaining = self::TOTAL_PAGES - $pagesCompleted;
        $progressPct    = round(($pagesCompleted / self::TOTAL_PAGES) * 100, 1);

        // ── 3. Attendance rate ────────────────────────────────────────────
        $attendanceRate = null;
        $attendancePct  = null;
        if ($attendance->count() > 0) {
            $present       = $attendance->whereIn('status', ['Hadir', 'Lewat'])->count();
            $attendancePct = round(($present / $attendance->count()) * 100);
            $attendanceRate = $attendancePct . '%';
        }

        // ── 4. Estimate days to complete (Ts Noorhuzaimi formula) ─────────
        // Base: pages remaining ÷ avg pages per day (Sabaq rate)
        // Then clamp between MIN_DAYS and MAX_DAYS.
        $daysNeeded = null;
        if ($avgPagesPerDay !== null && $avgPagesPerDay > 0) {
            $rawDays = ceil($pagesRemaining / $avgPagesPerDay);

            // Apply attendance penalty: if < 80%, extend proportionally
            if ($attendancePct !== null && $attendancePct < 80) {
                $penalty  = 1 + ((80 - $attendancePct) / 100);  // e.g. 60% → ×1.20
                $rawDays  = ceil($rawDays * $penalty);
            }

            // Clamp to [MIN_DAYS, MAX_DAYS]
            $daysNeeded = max(self::MIN_DAYS, min(self::MAX_DAYS, $rawDays));
        } else {
            // No records yet → assume 18 months (problem student default)
            $daysNeeded = self::MAX_DAYS;
        }

        $completionDate = now()->addDays($daysNeeded)->format('Y-m-d');

        // ── 5. 3-Month milestone prediction ───────────────────────────────
        // "Predict 3 months ahead, then extrapolate the rest" — Ts Noorhuzaimi
        $milestone3Month = null;
        if ($avgPagesPerDay !== null && $avgPagesPerDay > 0) {
            $pagesIn3Months     = round($avgPagesPerDay * 90);
            $juzukIn3Months     = round($pagesIn3Months / self::PAGES_PER_JUZ, 1);
            $milestone3Month    = $juzukIn3Months . ' Juzuk dalam 3 bulan';
        }

        // ── 6. Trend & confidence ─────────────────────────────────────────
        $trend = 'Perlu Perhatian';
        if ($juzuk >= 20 || ($avgPagesPerDay !== null && $avgPagesPerDay >= 2.5)) {
            $trend = 'Cemerlang';
        } elseif ($juzuk >= 10 || ($avgPagesPerDay !== null && $avgPagesPerDay >= 1.5)) {
            $trend = 'Baik';
        } elseif ($juzuk >= 5 || ($avgPagesPerDay !== null && $avgPagesPerDay >= 0.8)) {
            $trend = 'Sederhana';
        }

        $juzukScore   = min(30, round(($juzuk / self::TOTAL_JUZ) * 30));
        $recordScore  = min(18, $records->count() * 2);
        $confidence   = min(98, 50 + $juzukScore + $recordScore) . '%';

        // ── 7. Recommendation ─────────────────────────────────────────────
        $rec = 'Teruskan momentum hafazan anda. Konsisten dalam Sabaq, Sabki dan Manzil.';

        if ($avgPagesPerDay === null || $records->count() === 0) {
            $rec = 'Mula rekodkan hafazan harian supaya sistem dapat membuat analisis yang lebih tepat.';
        } elseif ($attendancePct !== null && $attendancePct < 70) {
            $rec = 'Kehadiran sangat rendah (' . $attendancePct . '%). Tingkatkan kehadiran untuk mempercepatkan hafazan.';
        } elseif ($avgPagesPerDay < 0.5) {
            $rec = 'Kadar Sabaq kurang 0.5 muka surat sehari. Sasarkan sekurang-kurangnya 1 muka surat/hari.';
        } elseif ($juzuk < 5) {
            $rec = 'Tumpukan pada memantapkan Tajwid dan Makhraj sebelum meningkatkan kuantiti hafazan.';
        } elseif ($daysNeeded >= self::MAX_DAYS) {
            $rec = 'Kadar hafazan semasa memerlukan 18 bulan untuk khatam. Tingkatkan Sabaq kepada 1+ muka surat/hari.';
        } elseif ($daysNeeded <= (self::MIN_DAYS + 30)) {
            $rec = 'Prestasi cemerlang! Pada kadar ini anda boleh khatam dalam tempoh 1 tahun.';
        }

        return [
            'current_progress'     => $juzuk . ' Juzuk (' . $progressPct . '% — ' . $pagesCompleted . '/604 muka surat)',
            'estimated_completion' => $completionDate,
            'performance_trend'    => $trend,
            'confidence'           => $confidence,
            'recommendation'       => $rec,
            'attendance_rate'      => $attendanceRate,
            'avg_ayah_per_day'     => $avgPagesPerDay !== null ? round($avgPagesPerDay * 6, 1) : null, // store as ayat
            'pages_per_day'        => $avgPagesPerDay,
            'days_to_complete'     => $daysNeeded,
            'milestone_3_months'   => $milestone3Month,
            'progress_percent'     => $progressPct,
        ];
    }

    /**
     * Get predictions for students in a specific class.
     */
    public function getByClass($classId)
    {
        $studentIds = Student::where('class_id', $classId)->pluck('id');
        $predictions = AIPrediction::whereIn('student_id', $studentIds)->get();
        return response()->json($predictions);
    }

    public function getByStudent($studentId)
    {
        $prediction = AIPrediction::where('student_id', $studentId)->first();
        if (!$prediction) {
            return response()->json(['message' => 'No prediction found'], 404);
        }
        return response()->json($prediction);
    }

    /**
     * Generate or refresh prediction for a single student.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $student = Student::with(['hafazanRecords', 'attendanceRecords'])->find($request->student_id);
        $data    = $this->computePrediction($student);

        $prediction = AIPrediction::updateOrCreate(
            ['student_id' => $student->id],
            $data
        );

        return response()->json($prediction);
    }

    /**
     * Generate bulk predictions for a class.
     */
    public function generateClass($classId)
    {
        $students = Student::with(['hafazanRecords', 'attendanceRecords'])
            ->where('class_id', $classId)
            ->get();

        foreach ($students as $student) {
            $data = $this->computePrediction($student);
            AIPrediction::updateOrCreate(
                ['student_id' => $student->id],
                $data
            );
        }

        return response()->json(['message' => 'AI Predictions generated for class students.']);
    }
}
