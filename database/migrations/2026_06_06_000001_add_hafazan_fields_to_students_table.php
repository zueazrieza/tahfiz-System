<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->integer('juzuk_semasa')->nullable()->after('juzuk_completed');
            $table->decimal('purata_sabaq_sehari', 8, 2)->nullable()->after('juzuk_semasa');
            $table->string('jenis_bacaan')->nullable()->after('purata_sabaq_sehari');
            $table->integer('target_bil_juzuk')->nullable()->after('jenis_bacaan');
            $table->integer('target_ranking')->nullable()->after('target_bil_juzuk');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['juzuk_semasa', 'purata_sabaq_sehari', 'jenis_bacaan', 'target_bil_juzuk', 'target_ranking']);
        });
    }
};
