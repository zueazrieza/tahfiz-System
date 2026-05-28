<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Repair the student_parent pivot table by syncing from the
     * legacy students.parent_id column.
     *
     * Problem: 53 students have a valid parent_id FK but the
     * student_parent pivot only has 4 rows — so parent dashboards
     * show "Tiada data anak dijumpai."
     *
     * This migration populates the pivot for every student whose
     * parent_id is not yet in the pivot, then looks up whether a
     * spouse parent profile exists (same ic_no pair) and links both.
     */
    public function up(): void
    {
        // 1. Insert into pivot for every student that has parent_id but no pivot row
        DB::statement("
            INSERT IGNORE INTO student_parent (student_id, parent_id, created_at, updated_at)
            SELECT s.id, s.parent_id, NOW(), NOW()
            FROM students s
            WHERE s.parent_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM student_parent sp
                WHERE sp.student_id = s.id AND sp.parent_id = s.parent_id
            )
        ");

        // 2. Also link the spouse: for each father in the pivot, find the mother
        //    who belongs to the same family group (user linked via full_name prefix)
        //    by looking at students.parent_ic (mother IC stored from import)
        DB::statement("
            INSERT IGNORE INTO student_parent (student_id, parent_id, created_at, updated_at)
            SELECT s.id, p.id, NOW(), NOW()
            FROM students s
            JOIN parents p ON p.ic_no = REGEXP_REPLACE(s.parent_ic, '[^0-9]', '')
            WHERE s.parent_ic IS NOT NULL
            AND s.parent_ic != ''
            AND NOT EXISTS (
                SELECT 1 FROM student_parent sp
                WHERE sp.student_id = s.id AND sp.parent_id = p.id
            )
        ");
    }

    public function down(): void
    {
        // Non-destructive: cannot safely reverse without knowing original state
    }
};
