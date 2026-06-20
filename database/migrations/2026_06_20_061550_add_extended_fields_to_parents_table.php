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
        Schema::table('parents', function (Blueprint $table) {
            $table->string('postcode')->nullable()->after('address');
            $table->string('city')->nullable()->after('postcode');
            $table->string('district')->nullable()->after('city');
            $table->string('state_name')->nullable()->after('district');
            $table->string('country')->nullable()->default('MAL')->after('state_name');
            $table->string('parliament')->nullable()->after('country');
            $table->string('sector')->nullable()->after('parliament');
            $table->string('office_phone')->nullable()->after('sector');
            $table->unsignedInteger('child_count')->nullable()->after('office_phone');
            $table->string('reference')->nullable()->after('child_count');
        });
    }

    public function down(): void
    {
        Schema::table('parents', function (Blueprint $table) {
            $table->dropColumn([
                'postcode', 'city', 'district', 'state_name', 'country',
                'parliament', 'sector', 'office_phone', 'child_count', 'reference',
            ]);
        });
    }
};
