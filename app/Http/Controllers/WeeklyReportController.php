<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\WeeklyReport;

class WeeklyReportController extends Controller
{
    public function index()
    {
        return response()->json(WeeklyReport::with('teacher')->orderBy('date', 'desc')->paginate(50));
    }

    public function store(Request $request)
    {
        abort_if(!in_array(auth()->user()?->role, ['admin', 'teacher']), 403, 'Akses ditolak.');

        $request->validate([
            'content' => 'required|string',
            'weekly_score' => 'required|integer',
            'date' => 'required|date',
        ]);

        $report = WeeklyReport::create([
            'teacher_id' => auth()->id(),
            'content' => $request->content,
            'weekly_score' => $request->weekly_score,
            'date' => $request->date,
        ]);

        return response()->json([
            'message' => 'Laporan Mingguan berjaya disimpan.',
            'report' => $report
        ], 201);
    }
}
