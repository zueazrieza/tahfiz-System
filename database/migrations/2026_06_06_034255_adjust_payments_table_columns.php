<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'month')) {
                $table->integer('month')->nullable()->after('amount');
            }
            if (!Schema::hasColumn('payments', 'year')) {
                $table->integer('year')->nullable()->after('month');
            }
            if (!Schema::hasColumn('payments', 'due_date')) {
                $table->date('due_date')->nullable()->after('year');
            }
            if (!Schema::hasColumn('payments', 'paid_date')) {
                $table->date('paid_date')->nullable()->after('due_date');
            }
            // Make status column a string instead of restrictive enum if needed, to support both 'paid' and 'Dibayar'
            $table->string('status')->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['month', 'year', 'due_date', 'paid_date']);
        });
    }
};
