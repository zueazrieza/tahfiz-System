<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\HafazanRecord;
use App\Models\Student;
use App\Models\AppNotification;
use App\Models\User;

class HafazanRecordController extends Controller
{
    public function index(Request $request)
    {
        $studentId = $request->query('student_id');
        $teacherId = $request->query('teacher_id');

        $limit = $request->query('limit');

        $query = HafazanRecord::query();

        if ($studentId) {
            $query->where('student_id', $studentId);
        }

        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        $records = $query->latest('date');
        
        if ($limit) {
            $records = $records->limit($limit);
        }

        $records = $records->get();

        return $records->map(function($r) {
            return [
                'id' => $r->id,
                'studentId' => $r->student_id,
                'teacherId' => $r->teacher_id,
                'date' => $r->date,
                'sabaq' => [
                    'surah' => $r->sabaq_surah,
                    'from' => $r->sabaq_from,
                    'to' => $r->sabaq_to,
                    'grade' => $r->sabaq_grade,
                ],
                'sabaqi' => [
                    'surah' => $r->sabaqi_surah,
                    'from' => $r->sabaqi_from,
                    'to' => $r->sabaqi_to,
                    'grade' => $r->sabaqi_grade,
                ],
                'manzil' => [
                    'surah' => $r->manzil_surah,
                    'from' => $r->manzil_from,
                    'to' => $r->manzil_to,
                    'grade' => $r->manzil_grade,
                ],
                'remarks' => $r->remarks,
                'ayahCount' => $r->ayah_count,
            ];
        });
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'studentId' => 'required|exists:students,id',
            'teacherId' => 'required|exists:teachers,id',
            'date' => 'required|date',
            'sabaq.surah' => 'nullable|string',
            'sabaq.from' => 'nullable|integer',
            'sabaq.to' => 'nullable|integer',
            'sabaq.grade' => 'nullable|string',
            'sabaqi.surah' => 'nullable|string',
            'sabaqi.from' => 'nullable|integer',
            'sabaqi.to' => 'nullable|integer',
            'sabaqi.grade' => 'nullable|string',
            'manzil.surah' => 'nullable|string',
            'manzil.from' => 'nullable|integer',
            'manzil.to' => 'nullable|integer',
            'manzil.grade' => 'nullable|string',
            'remarks' => 'nullable|string',
            'ayahCount' => 'integer',
        ]);

        $record = HafazanRecord::create([
            'student_id' => $validated['studentId'],
            'teacher_id' => $validated['teacherId'],
            'date' => $validated['date'],
            'sabaq_surah' => $validated['sabaq']['surah'] ?? null,
            'sabaq_from' => $validated['sabaq']['from'] ?? null,
            'sabaq_to' => $validated['sabaq']['to'] ?? null,
            'sabaq_grade' => $validated['sabaq']['grade'] ?? null,
            'sabaqi_surah' => $validated['sabaqi']['surah'] ?? null,
            'sabaqi_from' => $validated['sabaqi']['from'] ?? null,
            'sabaqi_to' => $validated['sabaqi']['to'] ?? null,
            'sabaqi_grade' => $validated['sabaqi']['grade'] ?? null,
            'manzil_surah' => $validated['manzil']['surah'] ?? null,
            'manzil_from' => $validated['manzil']['from'] ?? null,
            'manzil_to' => $validated['manzil']['to'] ?? null,
            'manzil_grade' => $validated['manzil']['grade'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
            'ayah_count' => $validated['ayahCount'] ?? 0,
        ]);

        // Auto-notify student and parent
        $student = Student::with('parents')->find($record->student_id);
        if ($student) {
            $sabaqGrade  = $record->sabaq_grade  ?? '—';
            $sabkiGrade  = $record->sabaqi_grade ?? '—';
            $manzilGrade = $record->manzil_grade ?? '—';
            $title   = "Rekod Hafazan {$record->date}";
            $content = "Sabak: {$sabaqGrade} | Sabki: {$sabkiGrade} | Manzil: {$manzilGrade}";

            // Notify student user account
            $studentUser = User::where('linked_id', $student->id)->where('role', 'student')->first();
            if ($studentUser) AppNotification::send($studentUser->id, $title, $content, 'hafazan');

            // Notify parent user accounts
            foreach ($student->parents as $parent) {
                $parentUser = User::where('linked_id', $parent->id)->where('role', 'parent')->first();
                if ($parentUser) AppNotification::send($parentUser->id, "Rekod Hafazan {$student->name}", $content, 'hafazan');
            }
        }

        // Sync achievements (milestones, streaks, quality badges)
        try {
            (new AchievementController())->syncStudentAchievements($record->student_id);
        } catch (\Exception $e) {
            Log::warning('Achievement sync failed: ' . $e->getMessage());
        }

        return response()->json($record, 201);
    }
}
