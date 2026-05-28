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
        Schema::create('mudir_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('evaluator_id')->constrained('users')->onDelete('cascade');
            $table->string('surah');
            $table->integer('juzuk');
            $table->integer('tajwid_score'); // max 40
            $table->integer('kelancaran_score'); // max 30
            $table->integer('hafazan_score'); // max 20
            $table->integer('lagu_score'); // max 10
            $table->integer('total_score'); // max 100
            $table->boolean('passed')->default(false);
            $table->string('awarded_badge')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mudir_evaluations');
    }
};
