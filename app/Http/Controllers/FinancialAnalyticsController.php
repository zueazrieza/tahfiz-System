<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Student;
use Illuminate\Http\Request;

class FinancialAnalyticsController extends Controller
{
    public function index()
    {
        // Calculate last 6 months trend
        $last6Months = collect(range(0, 5))->map(function($i) {
            $date = now()->subMonths($i);
            return [
                'month' => $date->format('M'),
                'month_num' => $date->month,
                'year' => $date->year,
            ];
        })->reverse()->values();

        $revenueData = $last6Months->map(function($m) {
            $collected = Payment::where('month', $m['month_num'])
                ->where('year', $m['year'])
                ->where('status', 'Dibayar')
                ->sum('amount');
                
            $pending = Payment::where('month', $m['month_num'])
                ->where('year', $m['year'])
                ->where('status', '!=', 'Dibayar')
                ->sum('amount');

            return [
                'name' => $m['month'],
                'kutipan' => (float)$collected,
                'tunggakan' => (float)$pending,
            ];
        });

        // Current Month Stats
        $activeStudentsCount = Student::where('status', 'Aktif')->count();
        $monthlyFee = Payment::avg('amount') ?? 1112.50;
        $forecast = $activeStudentsCount * $monthlyFee;

        // Overall stats
        $totalCollected = Payment::where('status', 'Dibayar')->sum('amount');
        $totalPending = Payment::where('status', '!=', 'Dibayar')->sum('amount');

        return response()->json([
            'revenueTrend' => $revenueData,
            'forecast' => $forecast,
            'activeStudents' => $activeStudentsCount,
            'totalCollected' => (float)$totalCollected,
            'totalPending' => (float)$totalPending,
            'collectionRate' => $totalCollected + $totalPending > 0 ? round(($totalCollected / ($totalCollected + $totalPending)) * 100, 1) : 0,
        ]);
    }
}
