<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\WeeklyReport;

class WeeklyReportController extends Controller
{
    public function index()
    {
        return response()->json(WeeklyReport::with('teacher')->orderBy('date', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'content' => 'required|string',
            'weekly_score' => 'required|integer',
            'date' => 'required|date',
        ]);

        $report = WeeklyReport::create($request->all());

        return response()->json([
            'message' => 'Laporan Mingguan berjaya disimpan.',
            'report' => $report
        ], 201);
    }
}
