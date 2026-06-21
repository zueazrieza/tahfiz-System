<?php

namespace App\Http\Controllers;

use App\Models\AIPrediction;
use App\Models\Student;
use Illuminate\Http\Request;

class AIPredictionController extends Controller
{
    const PAGES_PER_JUZ = 20;
    const TOTAL_PAGES   = 604;
    const TOTAL_JUZ     = 30;
    const MIN_DAYS      = 365;   // 1 tahun
    const MAX_DAYS      = 548;   // 1.5 tahun

    /** Grade string → numeric score (0–100) */
    private function gradeToScore(?string $grade): ?int
    {
        return match ($grade) {
            'Mumtaz'        => 95,
            'Jayyid Jiddan' => 80,
            'Jayyid'        => 65,
            'Maqbul'        => 50,
            default         => null,
        };
    }

    /**
     * Core prediction engine — returns array ready for DB save.
     */
    private function computePrediction(Student $student): array
    {
        $juzuk      = $student->juzuk_completed ?? 0;
        $records    = $student->hafazanRecords->sortByDesc('date');
        $attendance = $student->attendanceRecords;

        // ── Pages / day (Sabaq rate) ───────────────────────────────────────
        $totalAyah  = $records->sum('ayah_count');
        $avgPpd     = null; // pages per day
        if ($records->count() > 0) {
            $avgPpd = round(($totalAyah / $records->count()) / 6, 2);
        } elseif (!is_null($student->purata_sabaq_sehari) && $student->purata_sabaq_sehari > 0) {
            $avgPpd = round($student->purata_sabaq_sehari / 6, 2);
        }

        // ── Sabak / Sabki / Manzil scores (last 8 records) ────────────────
        $recent = $records->take(8);

        $sabaqScores  = $recent->map(fn($r) => $this->gradeToScore($r->sabaq_grade))->filter()->values();
        $sabkiScores  = $recent->map(fn($r) => $this->gradeToScore($r->sabaqi_grade))->filter()->values();
        $manzilScores = $recent->map(fn($r) => $this->gradeToScore($r->manzil_grade))->filter()->values();

        $sabaqScore  = $sabaqScores->count()  ? (int) round($sabaqScores->avg())  : null;
        $sabkiScore  = $sabkiScores->count()  ? (int) round($sabkiScores->avg())  : null;
        $manzilScore = $manzilScores->count() ? (int) round($manzilScores->avg()) : null;

        // Weekly Sabak coverage: ayat recorded this week / 5 pages target
        $weekStart   = now()->startOfWeek();
        $weekRecords = $records->filter(fn($r) => \Carbon\Carbon::parse($r->date)->gte($weekStart));
        $weekPages   = round($weekRecords->sum('ayah_count') / 6, 1);
        $weekTarget  = 5; // mukasurat per week (1/day)
        $weekPct     = $weekTarget > 0 ? min(100, round(($weekPages / $weekTarget) * 100)) : 0;

        // Manzil coverage: how many old juzuk reviewed recently (out of juzuk completed)
        $manzilJuzukReviewed = $recent->filter(fn($r) => !empty($r->manzil_surah))->count();
        $manzilCoverage      = $juzuk > 0 ? min(100, round(($manzilJuzukReviewed / max(1, $juzuk)) * 100)) : 0;

        // Consecutive Mumtaz streak (Sabak)
        $mumtazStreak = 0;
        foreach ($records as $r) {
            if ($r->sabaq_grade === 'Mumtaz') $mumtazStreak++;
            else break;
        }

        // ── Attendance ────────────────────────────────────────────────────
        $attendanceRate = null;
        $attendancePct  = null;
        if ($attendance->count() > 0) {
            $present       = $attendance->whereIn('status', ['Hadir', 'Lewat'])->count();
            $attendancePct = round(($present / $attendance->count()) * 100);
            $attendanceRate = $attendancePct . '%';
        }

        // ── Estimation ───────────────────────────────────────────────────
        $pagesCompleted = min(self::TOTAL_PAGES, $juzuk * self::PAGES_PER_JUZ);
        $pagesRemaining = self::TOTAL_PAGES - $pagesCompleted;
        $progressPct    = round(($pagesCompleted / self::TOTAL_PAGES) * 100, 1);

        if ($avgPpd !== null && $avgPpd > 0) {
            $rawDays = ceil($pagesRemaining / $avgPpd);
            if ($attendancePct !== null && $attendancePct < 80) {
                $rawDays = ceil($rawDays * (1 + (80 - $attendancePct) / 100));
            }
            $daysNeeded = max(self::MIN_DAYS, min(self::MAX_DAYS, $rawDays));
        } else {
            $daysNeeded = self::MAX_DAYS;
        }

        $completionDate = now()->addDays($daysNeeded)->format('Y-m-d');

        // 3-month milestone
        $milestone3Month = null;
        if ($avgPpd !== null && $avgPpd > 0) {
            $juzIn3m         = round(($avgPpd * 90) / self::PAGES_PER_JUZ, 1);
            $milestone3Month = $juzIn3m . ' Juzuk dalam 3 bulan';
        }

        // ── Trend ────────────────────────────────────────────────────────
        $trend = 'Perlu Perhatian';
        if ($juzuk >= 20 || ($avgPpd !== null && $avgPpd >= 2.5))
            $trend = 'Cemerlang';
        elseif ($juzuk >= 10 || ($avgPpd !== null && $avgPpd >= 1.5))
            $trend = 'Baik';
        elseif ($juzuk >= 5 || ($avgPpd !== null && $avgPpd >= 0.8))
            $trend = 'Sederhana';

        $juzukScore  = min(30, round(($juzuk / self::TOTAL_JUZ) * 30));
        $recordScore = min(18, $records->count() * 2);
        $confidence  = min(98, 50 + $juzukScore + $recordScore) . '%';

        // ── Structured multi-section recommendation ───────────────────────
        $rec = $this->buildRecommendation(
            juzuk: $juzuk,
            avgPpd: $avgPpd,
            weekPct: $weekPct,
            weekPages: $weekPages,
            weekTarget: $weekTarget,
            sabaqScore: $sabaqScore,
            sabkiScore: $sabkiScore,
            manzilScore: $manzilScore,
            manzilCoverage: $manzilCoverage,
            attendancePct: $attendancePct,
            daysNeeded: $daysNeeded,
            mumtazStreak: $mumtazStreak,
            recordCount: $records->count(),
            progressPct: $progressPct,
        );

        return [
            'current_progress'     => $juzuk . ' Juzuk (' . $progressPct . '% — ' . $pagesCompleted . '/604 muka surat)',
            'estimated_completion' => $completionDate,
            'performance_trend'    => $trend,
            'confidence'           => $confidence,
            'recommendation'       => $rec,
            'attendance_rate'      => $attendanceRate,
            'avg_ayah_per_day'     => $avgPpd !== null ? round($avgPpd * 6, 1) : null,
            'pages_per_day'        => $avgPpd,
            'days_to_complete'     => $daysNeeded,
            'milestone_3_months'   => $milestone3Month,
            'progress_percent'     => $progressPct,
            'sabaq_score'          => $sabaqScore,
            'sabki_score'          => $sabkiScore,
            'manzil_score'         => $manzilScore,
        ];
    }

    /**
     * Build multi-section recommendation text (structured with \n\n separators).
     */
    private function buildRecommendation(
        int $juzuk, ?float $avgPpd, int $weekPct, float $weekPages, int $weekTarget,
        ?int $sabaqScore, ?int $sabkiScore, ?int $manzilScore, int $manzilCoverage,
        ?int $attendancePct, int $daysNeeded, int $mumtazStreak, int $recordCount,
        float $progressPct
    ): string {
        $sections = [];

        // ── SABAK ─────────────────────────────────────────────────────────
        $sabakBullets = [];
        if ($recordCount === 0) {
            $sabakBullets[] = 'Tiada rekod hafazan lagi. Mulakan rekod harian untuk analisis yang tepat.';
        } else {
            if ($weekPct < 50) {
                $sabakBullets[] = "Pencapaian Sabak minggu ini ({$weekPct}%) masih jauh di bawah sasaran ({$weekTarget} muka surat). Perlu penambahbaikan segera.";
                $sabakBullets[] = 'Sasarkan sekurang-kurangnya 1 muka surat baharu setiap hari secara konsisten.';
            } elseif ($weekPct < 80) {
                $sabakBullets[] = "Pencapaian Sabak minggu ini ({$weekPct}%) masih di bawah sasaran. Cuba tambah bilangan halaman baharu setiap hari.";
                $sabakBullets[] = 'Kadar semasa ' . ($avgPpd ?? 0) . ' muka surat/hari. Sasaran idealnya 1+ muka surat/hari.';
            } else {
                $sabakBullets[] = "Pencapaian Sabak minggu ini ({$weekPct}%) memuaskan. Teruskan momentum ini.";
            }
            if ($sabaqScore !== null) {
                $label = $sabaqScore >= 90 ? 'Mumtaz' : ($sabaqScore >= 75 ? 'Jayyid Jiddan' : ($sabaqScore >= 60 ? 'Jayyid' : 'Maqbul'));
                $sabakBullets[] = "Kualiti Sabak semasa: {$label} ({$sabaqScore}%). " .
                    ($sabaqScore < 60 ? 'Perlu ulang Tajwid dan Makhraj sebelum tambah hafalan baharu.' :
                    ($sabaqScore < 80 ? 'Pastikan bacaan mantap sebelum beralih ke muka surat seterusnya.' : 'Kualiti bacaan cemerlang.'));
            }
            if ($mumtazStreak >= 5) {
                $sabakBullets[] = "Tahniah! {$mumtazStreak} rekod Mumtaz berturutan — layak untuk Mumtaz Award!";
            }
        }
        $sections[] = "SABAK (HAFALAN BAHARU)\n• " . implode("\n• ", $sabakBullets);

        // ── SABKI ─────────────────────────────────────────────────────────
        $sabkiBullets = [];
        if ($sabkiScore === null) {
            $sabkiBullets[] = 'Rekod Sabki belum mencukupi untuk analisis.';
            $sabkiBullets[] = 'Pastikan guru rekod gred Sabki setiap sesi.';
        } elseif ($sabkiScore >= 80) {
            $sabkiBullets[] = "Sabki dalam keadaan baik ({$sabkiScore}%). Pastikan kelancaran dikekalkan dalam 5-10 helai terakhir.";
            $sabkiBullets[] = 'Ulang kaji Sabki sebelum memulakan Sabak baharu setiap sesi.';
        } elseif ($sabkiScore >= 60) {
            $sabkiBullets[] = "Sabki sederhana ({$sabkiScore}%). Perlu lebih banyak ulang kaji pada bahagian yang lemah.";
            $sabkiBullets[] = 'Fokus 15-20 minit Sabki sebelum memulakan Sabak baharu.';
        } else {
            $sabkiBullets[] = "Sabki lemah ({$sabkiScore}%). Hafalan semasa tidak stabil — pertimbangkan untuk hentikan Sabak baharu sementara.";
            $sabkiBullets[] = 'Tumpukan sepenuhnya pada Sabki sehingga mencapai sekurang-kurangnya Jayyid (60%).';
        }
        $sections[] = "SABKI (ULANG KAJI SEMASA)\n• " . implode("\n• ", $sabkiBullets);

        // ── MANZIL ───────────────────────────────────────────────────────
        $manzilBullets = [];
        if ($juzuk === 0) {
            $manzilBullets[] = 'Manzil belum bermula — belum ada juzuk untuk diulang.';
        } elseif ($manzilCoverage >= 70) {
            $manzilBullets[] = "Manzil baik dengan liputan {$manzilCoverage}%. Teruskan jadual ulang kaji juzuk lama secara sistematik.";
            $manzilBullets[] = 'Kaedah cadangan: Manzil = 4 jam = 1 Juzuk. Jadikan rutin harian.';
        } elseif ($manzilCoverage >= 40) {
            $manzilBullets[] = "Liputan Manzil {$manzilCoverage}% — perlu ditingkatkan agar hafalan lama tidak terlupa.";
            $manzilBullets[] = 'Sasarkan ulang 1 juzuk lama setiap hari sebagai Manzil.';
        } else {
            $manzilBullets[] = "Liputan Manzil rendah ({$manzilCoverage}%). Hafalan {$juzuk} juzuk terdahulu berisiko dilupakan.";
            $manzilBullets[] = 'Segera jadualkan sesi Manzil harian. Mulakan dengan juzuk yang paling lama dihafal.';
        }
        if ($manzilScore !== null && $manzilScore < 60) {
            $manzilBullets[] = "Kualiti Manzil masih lemah ({$manzilScore}%). Perlu lebih banyak ulang kaji juzuk lama.";
        }
        $sections[] = "MANZIL (PENJAGAAN HAFALAN LAMA)\n• " . implode("\n• ", $manzilBullets);

        // ── KEHADIRAN ────────────────────────────────────────────────────
        if ($attendancePct !== null) {
            $attBullets = [];
            if ($attendancePct >= 90) {
                $attBullets[] = "Kehadiran cemerlang ({$attendancePct}%). Istiqamah anda amat membantu perkembangan hafazan.";
            } elseif ($attendancePct >= 75) {
                $attBullets[] = "Kehadiran baik ({$attendancePct}%). Cuba capai 90%+ untuk hasil maksimum.";
            } elseif ($attendancePct >= 60) {
                $attBullets[] = "Kehadiran sederhana ({$attendancePct}%). Ketidakhadiran melambatkan hafazan secara signifikan.";
                $attBullets[] = 'Setiap sesi yang ditinggalkan bermakna 1 muka surat Sabak hilang.';
            } else {
                $attBullets[] = "Kehadiran kritikal ({$attendancePct}%). Ini punca utama hafazan terbantut.";
                $attBullets[] = 'Berbincang dengan ibu bapa tentang kepentingan kehadiran yang konsisten.';
            }
            $sections[] = "KEHADIRAN & KONSISTENSI\n• " . implode("\n• ", $attBullets);
        }

        // ── UNJURAN & SASARAN ────────────────────────────────────────────
        $projBullets = [];
        $years  = floor($daysNeeded / 365);
        $months = round(($daysNeeded % 365) / 30);
        $timeStr = $years > 0 ? "{$years} tahun {$months} bulan" : "{$months} bulan";
        $projBullets[] = "Unjuran khatam: {$timeStr} lagi (berdasarkan kadar semasa).";
        $projBullets[] = "Kemajuan keseluruhan: {$progressPct}% ({$juzuk}/30 Juzuk).";
        if ($daysNeeded >= self::MAX_DAYS) {
            $projBullets[] = 'Kadar hafazan perlu ditingkatkan untuk khatam dalam masa 1.5 tahun.';
            $projBullets[] = 'Sasarkan 1 muka surat Sabak + 1 juzuk Manzil setiap hari.';
        } elseif ($daysNeeded <= (self::MIN_DAYS + 60)) {
            $projBullets[] = 'Pada kadar ini, anda boleh khatam dalam masa 1 tahun. Tahniah!';
        }
        $sections[] = "UNJURAN & PELAN TINDAKAN\n• " . implode("\n• ", $projBullets);

        return implode("\n\n", $sections);
    }

    // ── API Methods ──────────────────────────────────────────────────────

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

    public function generate(Request $request)
    {
        $request->validate(['student_id' => 'required|exists:students,id']);
        $student    = Student::with(['hafazanRecords', 'attendanceRecords'])->find($request->student_id);
        $data       = $this->computePrediction($student);
        $prediction = AIPrediction::updateOrCreate(['student_id' => $student->id], $data);
        return response()->json($prediction);
    }

    public function generateClass($classId)
    {
        $students = Student::with(['hafazanRecords', 'attendanceRecords'])
            ->where('class_id', $classId)->get();
        foreach ($students as $student) {
            $data = $this->computePrediction($student);
            AIPrediction::updateOrCreate(['student_id' => $student->id], $data);
        }
        return response()->json(['message' => 'AI Predictions generated for class students.']);
    }
}
