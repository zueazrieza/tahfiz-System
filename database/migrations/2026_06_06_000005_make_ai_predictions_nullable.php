<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_predictions', function (Blueprint $table) {
            $table->integer('avg_ayah_per_day')->nullable()->change();
            $table->date('estimated_completion')->nullable()->change();
            $table->string('attendance_rate')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('ai_predictions', function (Blueprint $table) {
            $table->integer('avg_ayah_per_day')->nullable(false)->change();
            $table->date('estimated_completion')->nullable(false)->change();
            $table->string('attendance_rate')->nullable(false)->change();
        });
    }
};
