<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Models\HafazanRecord;
use App\Models\Student;
use App\Models\AppNotification;
use App\Models\User;
use App\Mail\HafazanRecordedMail;

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
            'teacherId' => 'nullable|integer',
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

        // Resolve teacher: use provided ID if valid, else auto-resolve from student or auth user
        $teacherId = $validated['teacherId'] ?? null;
        if (!$teacherId || !\App\Models\Teacher::find($teacherId)) {
            $student = \App\Models\Student::find($validated['studentId']);
            $teacherId = $student?->teacher_id;
            if (!$teacherId && auth()->check()) {
                $teacher = \App\Models\Teacher::where('id', auth()->user()->linked_id)->first();
                $teacherId = $teacher?->id ?? \App\Models\Teacher::min('id');
            }
        }

        $record = HafazanRecord::create([
            'student_id' => $validated['studentId'],
            'teacher_id' => $teacherId,
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

            // Notify parent user accounts (in-app + email)
            $notifiedParentIds = [];
            foreach ($student->parents as $parent) {
                $parentUser = User::where('linked_id', $parent->id)->where('role', 'parent')->first();
                if ($parentUser) {
                    AppNotification::send($parentUser->id, "Rekod Hafazan {$student->name}", $content, 'hafazan');
                    if ($parentUser->email && !in_array($parentUser->id, $notifiedParentIds)) {
                        $notifiedParentIds[] = $parentUser->id;
                        try {
                            Mail::to($parentUser->email)->send(new HafazanRecordedMail($student, $record, $parentUser->name));
                        } catch (\Exception $e) {
                            Log::warning('Hafazan email failed: ' . $e->getMessage());
                        }
                    }
                }
            }

            // Fallback: find parent via student.parent_id if no parents relationship resolved
            if (empty($notifiedParentIds) && $student->parent_id) {
                $parentUser = User::where('role', 'parent')
                    ->where(function($q) use ($student) {
                        $q->where('linked_id', $student->parent_id)
                          ->orWhere('id', $student->parent_id);
                    })->first();
                if (!$parentUser && ($student->parent_name || $student->parent_phone)) {
                    $parentUser = User::where('role', 'parent')
                        ->where(function($q) use ($student) {
                            if ($student->parent_name)  $q->orWhere('name',  $student->parent_name);
                            if ($student->parent_phone) $q->orWhere('phone', $student->parent_phone);
                        })->first();
                }
                if ($parentUser) {
                    AppNotification::send($parentUser->id, "Rekod Hafazan {$student->name}", $content, 'hafazan');
                    if ($parentUser->email) {
                        try {
                            Mail::to($parentUser->email)->send(new HafazanRecordedMail($student, $record, $parentUser->name));
                        } catch (\Exception $e) {
                            Log::warning('Hafazan email fallback failed: ' . $e->getMessage());
                        }
                    }
                }
            }
        }

        // Sync achievements (milestones, streaks, quality badges)
        try {
            (new AchievementController())->syncStudentAchievements($record->student_id);
        } catch (\Exception $e) {
            Log::warning('Achievement sync failed: ' . $e->getMessage());
        }

        return response()->json([
            'id'        => $record->id,
            'studentId' => $record->student_id,
            'teacherId' => $record->teacher_id,
            'date'      => $record->date,
            'sabaq'     => [
                'surah' => $record->sabaq_surah,
                'from'  => $record->sabaq_from,
                'to'    => $record->sabaq_to,
                'grade' => $record->sabaq_grade,
            ],
            'sabaqi'    => [
                'surah' => $record->sabaqi_surah,
                'from'  => $record->sabaqi_from,
                'to'    => $record->sabaqi_to,
                'grade' => $record->sabaqi_grade,
            ],
            'manzil'    => [
                'surah' => $record->manzil_surah,
                'from'  => $record->manzil_from,
                'to'    => $record->manzil_to,
                'grade' => $record->manzil_grade,
            ],
            'remarks'   => $record->remarks,
            'ayahCount' => $record->ayah_count,
        ], 201);
    }
}
