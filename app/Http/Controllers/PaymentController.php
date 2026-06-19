<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AppNotification;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $studentId = $request->query('student_id');
        $query = \App\Models\Payment::query();
        if ($studentId) {
            $this->syncPayments($studentId);
            $query->where('student_id', $studentId);
        }
        $payments = $query->get();
        return $payments->map(function($p) {
            return [
                'id' => $p->id,
                'studentId' => $p->student_id,
                'month' => $p->month,
                'year' => $p->year,
                'amount' => $p->amount,
                'status' => $p->status,
                'dueDate' => $p->due_date,
                'paidDate' => $p->paid_date,
            ];
        });
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'studentId' => 'required',
            'month' => 'required|integer',
            'year' => 'required|integer',
            'amount' => 'required|integer',
            'status' => 'required|string',
            'dueDate' => 'required|date',
        ]);

        $payment = \App\Models\Payment::create([
            'student_id' => $validated['studentId'],
            'month' => $validated['month'],
            'year' => $validated['year'],
            'amount' => $validated['amount'],
            'status' => $validated['status'],
            'due_date' => $validated['dueDate'],
        ]);

        return response()->json([
            'id' => $payment->id,
            'studentId' => $payment->student_id,
            'month' => $payment->month,
            'year' => $payment->year,
            'amount' => $payment->amount,
            'status' => $payment->status,
            'dueDate' => $payment->due_date,
            'paidDate' => $payment->paid_date,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $payment = \App\Models\Payment::findOrFail($id);
        $data = $request->all();

        if (isset($data['status']) && $data['status'] === 'Dibayar' && !$payment->paid_date) {
            $data['paid_date'] = date('Y-m-d');
        } elseif (isset($data['status']) && $data['status'] === 'Belum Bayar') {
            $data['paid_date'] = null;
        }

        $payment->update([
            'status' => $data['status'] ?? $payment->status,
            'paid_date' => $data['paid_date'] ?? $payment->paid_date,
        ]);

        return response()->json([
            'id' => $payment->id,
            'studentId' => $payment->student_id,
            'month' => $payment->month,
            'year' => $payment->year,
            'amount' => $payment->amount,
            'status' => $payment->status,
            'dueDate' => $payment->due_date,
            'paidDate' => $payment->paid_date,
        ]);
    }

    public function destroy(string $id)
    {
        $payment = \App\Models\Payment::findOrFail($id);
        $payment->delete();
        return response()->json(['success' => true]);
    }

    public function notifyPaid(Request $request, string $id)
    {
        $payment = \App\Models\Payment::findOrFail($id);
        $studentName = $request->input('student_name', 'Pelajar');
        $period      = $request->input('period', 'bulan berkenaan');

        $parentName = $request->user()->name;

        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            AppNotification::send(
                $admin->id,
                'Pengesahan Bayaran Diperlukan',
                "Ibu bapa/penjaga {$parentName} melaporkan bahawa bayaran yuran {$studentName} bagi tempoh {$period} telah dijelaskan. Sila semak dan kemaskini status invois.",
                'payment'
            );
        }

        return response()->json(['success' => true]);
    }

    private function syncPayments($studentId)
    {
        $now = \Carbon\Carbon::now();
        $startYear = $now->year;

        // Use actual average fee from DB, fall back to 1112.50
        $monthlyFee = \App\Models\Payment::where('student_id', $studentId)->avg('amount') ?? 1112.50;

        // Generate bills for each month of the current year up to now
        for ($m = 1; $m <= $now->month; $m++) {
            $exists = \App\Models\Payment::where('student_id', $studentId)
                ->where('month', $m)
                ->where('year', $startYear)
                ->exists();

            if (!$exists) {
                \App\Models\Payment::create([
                    'student_id' => $studentId,
                    'month'      => $m,
                    'year'       => $startYear,
                    'amount'     => $monthlyFee,
                    'status'     => 'Belum Bayar',
                    'due_date'   => \Carbon\Carbon::create($startYear, $m, 7)->toDateString(),
                ]);
            }
        }

        // Auto-mark unpaid past-due payments as Tertunggak
        \App\Models\Payment::where('student_id', $studentId)
            ->where('status', 'Belum Bayar')
            ->where('due_date', '<', $now->toDateString())
            ->update(['status' => 'Tertunggak']);
    }
}
