<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->date('tarikh_tamat')->nullable()->after('enrolled_date');
            $table->string('batch')->nullable()->after('intake');
            $table->string('status_khatam')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['tarikh_tamat', 'batch', 'status_khatam']);
        });
    }
};
