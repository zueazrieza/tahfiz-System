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
        Schema::create('hafazan_recordings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('surah')->nullable();
            $table->integer('ayat_from')->nullable();
            $table->integer('ayat_to')->nullable();
            $table->string('file_path');
            $table->string('mime_type')->default('audio/webm');
            $table->integer('duration_seconds')->nullable();
            $table->string('notes', 300)->nullable();
            $table->enum('recorded_by', ['student', 'teacher'])->default('student');
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hafazan_recordings');
    }
};
