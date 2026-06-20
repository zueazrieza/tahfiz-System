<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hafazan_records', function (Blueprint $table) {
            $table->index('student_id', 'idx_hafazan_records_student_id');
            $table->index('teacher_id', 'idx_hafazan_records_teacher_id');
            $table->index('date',       'idx_hafazan_records_date');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->index('teacher_id', 'idx_attendances_teacher_id');
            $table->index('date',       'idx_attendances_date');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('status',         'idx_payments_status');
            $table->index(['month', 'year'], 'idx_payments_month_year');
        });
    }

    public function down(): void
    {
        Schema::table('hafazan_records', function (Blueprint $table) {
            $table->dropIndex('idx_hafazan_records_student_id');
            $table->dropIndex('idx_hafazan_records_teacher_id');
            $table->dropIndex('idx_hafazan_records_date');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('idx_attendances_teacher_id');
            $table->dropIndex('idx_attendances_date');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_status');
            $table->dropIndex('idx_payments_month_year');
        });
    }
};
