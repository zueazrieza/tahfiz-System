<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\MudirEvaluation;
use App\Models\Achievement;
use App\Models\Student;

class MudirEvaluationController extends Controller
{
    public function index()
    {
        return response()->json(MudirEvaluation::with(['student', 'evaluator'])->latest()->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'surah' => 'required|string',
            'juzuk' => 'required|integer',
            'tajwid_score' => 'required|integer|max:40',
            'kelancaran_score' => 'required|integer|max:30',
            'hafazan_score' => 'required|integer|max:20',
            'lagu_score' => 'required|integer|max:10',
        ]);

        $total_score = $request->tajwid_score + $request->kelancaran_score + $request->hafazan_score + $request->lagu_score;
        $passed = $total_score >= 80; // Pass mark could be 80
        $badge = $passed ? 'Level ' . ($request->juzuk > 0 ? ceil($request->juzuk / 5) : 1) : null; 

        // Award graduation condition
        if ($request->juzuk == 30 && $passed) {
            $badge = 'Gold G'; // Gold G for Khatam 30 Juzuk (from HafazanLevelSelector)
        }

        $evaluation = MudirEvaluation::create([
            'student_id' => $request->student_id,
            'evaluator_id' => $request->input('evaluator_id', 1),
            'surah' => $request->surah,
            'juzuk' => $request->juzuk,
            'tajwid_score' => $request->tajwid_score,
            'kelancaran_score' => $request->kelancaran_score,
            'hafazan_score' => $request->hafazan_score,
            'lagu_score' => $request->lagu_score,
            'total_score' => $total_score,
            'passed' => $passed,
            'awarded_badge' => $badge,
            'remarks' => $request->remarks,
        ]);

        if ($passed && $badge) {
            Achievement::create([
                'student_id' => $request->student_id,
                'name' => $badge,
                'type' => 'Badge',
                'description' => 'Lulus Tasmik Mudir dengan markah ' . $total_score . '% (Juzuk ' . $request->juzuk . ')',
                'awarded_by' => $request->input('evaluator_id', 1),
                'date' => now(),
            ]);

            // Update student juzuk completed
            $student = Student::find($request->student_id);
            if ($student && $request->juzuk > $student->juzuk_completed) {
                $student->juzuk_completed = $request->juzuk;
                // Mark as KHATAM when all 30 juzuk are completed
                if ($request->juzuk >= 30) {
                    $student->status = 'KHATAM';
                }
                $student->save();
            }
        }

        return response()->json([
            'message' => 'Penilaian berjaya direkodkan',
            'evaluation' => $evaluation
        ], 201);
    }
}
