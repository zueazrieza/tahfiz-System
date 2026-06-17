<?php

namespace App\Http\Controllers;

use App\Models\HafazanRecord;
use App\Models\Student;
use Illuminate\Http\Request;
use Carbon\Carbon;

class StudentReportController extends Controller
{
    public function getHafazanTargets($studentId)
    {
        $student = Student::findOrFail($studentId);
        
        $now = Carbon::now();
        $weekAgo = Carbon::now()->subDays(7);
        $monthStart = Carbon::now()->startOfMonth();
        $yearStart = Carbon::now()->startOfYear();

        $records = HafazanRecord::where('student_id', $studentId)->get();

        $weeklyAyah = HafazanRecord::where('student_id', $studentId)
            ->where('date', '>=', $weekAgo->toDateString())
            ->sum('ayah_count');

        $monthlyAyah = HafazanRecord::where('student_id', $studentId)
            ->where('date', '>=', $monthStart->toDateString())
            ->sum('ayah_count');

        $yearlyAyah = HafazanRecord::where('student_id', $studentId)
            ->where('date', '>=', $yearStart->toDateString())
            ->sum('ayah_count');

        // Targets (Default / Murabbi inputs)
        $weeklyTarget = 100;
        $monthlyTarget = 400;
        $yearlyTarget = 4800;

        if (!empty($student->target_hafazan)) {
            $parts = explode('|', $student->target_hafazan);
            
            $parseValue = function($str) {
                $str = trim($str);
                if (empty($str)) return 0;
                $strLower = strtolower($str);
                preg_match('/\d+/', $str, $matches);
                if (empty($matches)) return 0;
                $val = (int)$matches[0];
                
                if (str_contains($strLower, 'juzuk') || str_contains($strLower, 'juz')) {
                    return $val * 200; // 200 ayahs per juzuk estimate
                }
                return $val;
            };

            $m1 = isset($parts[0]) ? $parseValue($parts[0]) : 0;
            $m2 = isset($parts[1]) ? $parseValue($parts[1]) : 0;
            $m3 = isset($parts[2]) ? $parseValue($parts[2]) : 0;

            if ($m1 > 0) {
                $monthlyTarget = $m1;
                $weeklyTarget = max(1, (int)round($m1 / 4));
                $yearlyTarget = $m1 + $m2 + $m3;
            }
        }

        // Streak
        $streak = $this->calculateStreak($studentId);

        return response()->json([
            'weekly' => [
                'current' => (int)$weeklyAyah,
                'target' => $weeklyTarget,
                'progress' => $this->calcProgress($weeklyAyah, $weeklyTarget)
            ],
            'monthly' => [
                'current' => (int)$monthlyAyah,
                'target' => $monthlyTarget,
                'progress' => $this->calcProgress($monthlyAyah, $monthlyTarget)
            ],
            'yearly' => [
                'current' => (int)$yearlyAyah,
                'target' => $yearlyTarget,
                'progress' => $this->calcProgress($yearlyAyah, $yearlyTarget)
            ],
            'stats' => [
                'streak' => $streak,
                'totalRecords' => $records->count(),
                'juzukCompleted' => $student->juzuk_completed ?? 0,
                'targetHafazan' => $student->target_hafazan
            ]
        ]);
    }

    private function calcProgress($val, $target)
    {
        if ($target <= 0) return 0;
        return min(100, round(($val / $target) * 100));
    }

    private function calculateStreak($studentId)
    {
        $dates = HafazanRecord::where('student_id', $studentId)
            ->orderBy('date', 'desc')
            ->pluck('date')
            ->unique()
            ->toArray();

        if (empty($dates)) return 0;

        $streak = 0;
        $currentDate = Carbon::today();
        
        $lastRecordDate = Carbon::parse($dates[0]);
        $diff = $currentDate->diffInDays($lastRecordDate);
        
        if ($diff > 1) return 0;

        $prevDate = null;
        foreach ($dates as $dateStr) {
            $date = Carbon::parse($dateStr);
            if ($prevDate === null) {
                $streak = 1;
            } else {
                $diff = $prevDate->diffInDays($date);
                if ($diff === 1) {
                    $streak++;
                } else {
                    break;
                }
            }
            $prevDate = $date;
        }

        return $streak;
    }
}
