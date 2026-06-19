<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'student_id', 'parent_id', 'amount', 'payment_type', 'payment_date',
        'month_year', 'status', 'receipt_no', 'notes', 'month', 'year',
        'due_date', 'paid_date'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    protected static function booted()
    {
        static::created(function ($payment) {
            $studentName = $payment->student?->name ?? 'Pelajar';
            \App\Models\ActivityLog::log('Invois Yuran Dibuat', "{$studentName} (RM {$payment->amount})");
        });

        static::updated(function ($payment) {
            if ($payment->isDirty('status')) {
                $studentName = $payment->student?->name ?? 'Pelajar';
                $statusText = $payment->status === 'Dibayar' ? 'Dibayar' : ($payment->status === 'Tertunggak' ? 'Tertunggak' : 'Belum Bayar');
                \App\Models\ActivityLog::log("Status Bayaran Terkini: {$statusText}", "{$studentName} (RM {$payment->amount})");
            }
        });
    }
}
