<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_predictions', function (Blueprint $table) {
            $table->decimal('pages_per_day', 5, 2)->nullable()->after('avg_ayah_per_day');
            $table->integer('days_to_complete')->nullable()->after('pages_per_day');
            $table->string('milestone_3_months')->nullable()->after('days_to_complete');
            $table->decimal('progress_percent', 5, 1)->nullable()->after('milestone_3_months');
        });
    }

    public function down(): void
    {
        Schema::table('ai_predictions', function (Blueprint $table) {
            $table->dropColumn(['pages_per_day', 'days_to_complete', 'milestone_3_months', 'progress_percent']);
        });
    }
};
