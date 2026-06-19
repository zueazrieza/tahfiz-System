<?php

namespace App\Http\Controllers;

use App\Models\AIAssessment;
use Illuminate\Http\Request;

class AIAssessmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $teacherId = $request->query('teacherId');
        $status = $request->query('status');

        $query = AIAssessment::with('student');

        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $results = $query->latest('date')->get();

        return $results->map(function ($r) {
            return [
                'id' => $r->id,
                'studentName' => $r->student->name ?? 'Unknown Student',
                'surah' => $r->surah,
                'score' => $r->score,
                'date' => $r->date,
                'status' => $r->status,
                'audioPath' => $r->audio_path,
                'feedback' => $r->feedback,
            ];
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'studentId' => 'required|exists:students,id',
            'teacherId' => 'nullable|integer',
            'surah' => 'required|string',
            'score' => 'required|integer',
            'date' => 'required|date',
            'status' => 'string|in:pending,reviewed',
            'audioPath' => 'nullable|string',
            'feedback' => 'nullable|string',
        ]);

        // Resolve teacher: use provided ID if valid, otherwise use student's assigned teacher
        $teacherId = $validated['teacherId'] ?? null;
        if (!$teacherId || !\App\Models\Teacher::find($teacherId)) {
            $student   = \App\Models\Student::find($validated['studentId']);
            $teacherId = $student?->teacher_id;
        }
        if (!$teacherId) {
            return response()->json(['error' => 'No teacher assigned to this student.'], 422);
        }

        $assessment = AIAssessment::create([
            'student_id' => $validated['studentId'],
            'teacher_id' => $teacherId,
            'surah' => $validated['surah'],
            'score' => $validated['score'],
            'date' => $validated['date'],
            'status' => $validated['status'] ?? 'pending',
            'audio_path' => $validated['audioPath'] ?? null,
            'feedback' => $validated['feedback'] ?? null,
        ]);

        return response()->json($assessment, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $assessment = AIAssessment::findOrFail($id);
        
        $data = $request->all();
        
        $assessment->update([
            'status' => $data['status'] ?? $assessment->status,
            'feedback' => $data['feedback'] ?? $assessment->feedback,
            'score' => $data['score'] ?? $assessment->score,
        ]);

        return response()->json($assessment);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $assessment = AIAssessment::findOrFail($id);
        $assessment->delete();
        return response()->json(null, 204);
    }
}
