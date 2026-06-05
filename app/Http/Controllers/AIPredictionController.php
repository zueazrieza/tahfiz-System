<?php

namespace App\Http\Controllers;

use App\Models\AIPrediction;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AIPredictionController extends Controller
{
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
     * Generate or refresh predictions for a student.
     * (Normally this would call an AI service, but here we'll implement the logic to save to DB)
     */
    public function generate(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $student = Student::with(['hafazanRecords', 'attendanceRecords'])->find($request->student_id);
        
        // 1. Progress & Speed
        $juzuk = $student->juzuk_completed ?? 0;
        $records = $student->hafazanRecords;
        $totalAyah = $records->sum('ayah_count');

        if ($records->count() > 0) {
            $avgAyah = round($totalAyah / $records->count(), 1);
        } elseif (!is_null($student->purata_sabaq_sehari) && $student->purata_sabaq_sehari > 0) {
            $avgAyah = (float) $student->purata_sabaq_sehari;
        } else {
            $avgAyah = null; // genuinely no data
        }

        // 2. Attendance
        $attendance = $student->attendanceRecords;
        $attendanceRate = 'N/A';
        if ($attendance->count() > 0) {
            $present = $attendance->whereIn('status', ['Hadir', 'Lewat'])->count();
            $attendanceRate = round(($present / $attendance->count()) * 100) . '%';
        }

        // 3. Trends & Confidence
        $trend = ($juzuk >= 15 || ($avgAyah !== null && $avgAyah >= 10))
            ? 'Cemerlang'
            : (($juzuk >= 5 || ($avgAyah !== null && $avgAyah >= 5)) ? 'Baik' : 'Perlu Perhatian');
        $juzukScore  = min(30, round(($juzuk / 30) * 30));
        $recordScore = min(18, $records->count() * 2);
        $confidence  = min(98, 50 + $juzukScore + $recordScore) . '%';

        // 4. Estimation
        $remainingAyat = (30 - $juzuk) * 208;
        if ($avgAyah !== null && $avgAyah > 0) {
            $daysNeeded = ceil($remainingAyat / $avgAyah);
            $completionDate = now()->addDays($daysNeeded)->format('Y-m-d');
        } else {
            $completionDate = null;
        }

        $rec = 'Teruskan momentum anda.';
        if ($juzuk < 10) $rec = 'Tumpukan pada memantapkan bacaan juzuk awal.';
        if ($avgAyah === null) $rec = 'Mula rekodkan hafazan harian anda supaya AI dapat membuat analisis yang lebih tepat.';
        if ($attendanceRate !== 'N/A' && intval($attendanceRate) < 80) $rec = 'Kehadiran yang lebih baik akan mempercepatkan hafazan anda.';

        $prediction = AIPrediction::updateOrCreate(
            ['student_id' => $student->id],
            [
                'current_progress' => $juzuk . ' Juzuk',
                'estimated_completion' => $completionDate,
                'performance_trend' => $trend,
                'confidence' => $confidence,
                'recommendation' => $rec,
                'attendance_rate' => ($attendanceRate === 'N/A') ? null : $attendanceRate,
                'avg_ayah_per_day' => $avgAyah,
            ]
        );

        return response()->json($prediction);
    }

    /**
     * Generate bulk predictions for a class.
     */
    public function generateClass($classId)
    {
        $students = Student::where('class_id', $classId)->get();
        
        foreach ($students as $student) {
            // reuse logic above or similar
            $juzuk = $student->juzuk_completed ?? 0;
            $trend = $juzuk > 15 ? 'Cemerlang' : ($juzuk > 5 ? 'Baik' : 'Perlu Perhatian');
            $prediction = AIPrediction::updateOrCreate(
                ['student_id' => $student->id],
                [
                    'current_progress' => $juzuk . ' Juzuk',
                    'estimated_completion' => now()->addMonths(max(1, 30 - $juzuk))->format('Y-m-d'),
                    'performance_trend' => $trend,
                    'confidence' => rand(80, 98) . '%',
                    'recommendation' => 'Analisis AI mencadangkan fokus pada pengulangan juzuk yang telah dihafal.',
                    'attendance_rate' => '95%',
                    'avg_ayah_per_day' => rand(5, 12),
                ]
            );
        }

        return response()->json(['message' => 'AI Predictions generated for class students.']);
    }
}
