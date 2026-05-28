<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\HafazanRecord;
use App\Models\Attendance;
use App\Models\Payment;
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
        $payments = Payment::where('student_id', $studentId)->get();

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
        $avgSabaqPerDay = count($records) ? $totalSabaqAyah / count($records) : (($existingPrediction && $existingPrediction->avg_ayah_per_day) ? $existingPrediction->avg_ayah_per_day : 5);
        $qualityMultiplier = $gradeCount > 0 ? $gradeScoreTotal / $gradeCount : 1.0;

        // Attendance Pattern
        $attendanceRate = 0.8; // Default
        if (count($attendances)) {
            $present = $attendances->whereIn('status', ['Hadir', 'Lewat'])->count();
            $attendanceRate = $present / count($attendances);
        }

        // Payment Consistency
        $paymentScore = 0.8; // Default
        if (count($payments)) {
            $paid = $payments->where('status', 'Dibayar')->count();
            $paymentScore = $paid / count($payments);
        }

        // AI Engine Computation
        $effectiveRate = $avgSabaqPerDay * $qualityMultiplier * (0.6 + ($attendanceRate * 0.3) + ($paymentScore * 0.1));
        
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

        // Confidence Level
        $dataVolumeScore = min(1, count($records) / 30);
        $confidence = min(99, round(60 + ($dataVolumeScore * 15) + ($attendanceRate * 15) + ($paymentScore * 5) + (($qualityMultiplier - 1) * 10)));

        // Trend
        $trend = ($attendanceRate >= 0.9 && $qualityMultiplier >= 1.0) ? 'Cemerlang' :
                 (($attendanceRate >= 0.75 && $qualityMultiplier >= 0.8) ? 'Baik' : 'Perlu Perhatian');

        // Recommendation
        $recommendation = 'Progres konsisten dikekalkan. Dijangka tamat lebih awal.';
        if ($existingPrediction && count($records) === 0) {
            $recommendation = $existingPrediction->recommendation;
        } else {
            if ($qualityMultiplier < 0.85) $recommendation = 'Tumpukan kepada ulang kaji Sabaqi/Manzil untuk meningkatkan kualiti ingatan.';
            elseif ($attendanceRate < 0.85) $recommendation = 'Kehadiran yang lebih konsisten diperlukan untuk ramalan yang stabil.';
            elseif ($paymentScore < 1.0) $recommendation = 'Yuran yang belum dijelaskan mungkin mempengaruhi trend kestabilan.';
        }

        // Avg ayah per day
        $avgTotalAyahPerDay = count($records)
            ? $records->avg('ayah_count')
            : $avgSabaqPerDay;

        $predictionData = [
            'student_id' => $student->id,
            'current_progress' => "{$student->juzuk_completed} Juzuk (" . round(($student->juzuk_completed / 30) * 100) . "%)",
            'estimated_completion' => $completionDate->format('Y-m-d'),
            'performance_trend' => $trend,
            'confidence' => "{$confidence}%",
            'recommendation' => $recommendation,
            'attendance_rate' => round($attendanceRate * 100) . "%",
            'avg_ayah_per_day' => round($avgTotalAyahPerDay),
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
}
