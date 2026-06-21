<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Student;
use App\Models\ClassRoom;
use App\Models\Teacher;
use App\Models\Attendance;

class ParentController extends Controller
{
    /**
     * Get list of children linked to the authenticated parent.
     */
    public function getChildren()
    {
        // ... (existing code remains SAME)
        $user = Auth::user();
        if (!$user || $user->role !== 'parent') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $parentProfile = $user->parentProfile;
        $children = $parentProfile ? $parentProfile->students : collect();

        $data = $children->map(function ($student) {
            $class = $student->classRoom;
            $teacher = $student->teacher;

            $totalAttendance = Attendance::where('student_id', $student->id)->count();
            $presentCount = Attendance::where('student_id', $student->id)
                ->whereIn('status', ['Hadir', 'Lewat'])
                ->count();
            $attendanceRate = $totalAttendance > 0
                ? round(($presentCount / $totalAttendance) * 100)
                : 0;

            return [
                'id' => $student->id,
                'name' => $student->name,
                'age' => $student->age,
                'class_id' => $student->class_id,
                'class_name' => $class ? $class->name : 'N/A',
                'teacher_id' => $student->teacher_id,
                'teacher_name' => $teacher ? $teacher->name : 'N/A',
                'juzuk_completed' => $student->juzuk_completed,
                'attendance_rate' => $attendanceRate,
                'status' => $student->status,
                'enrolled_date' => $student->enrolled_date,
            ];
        });

        return response()->json($data);
    }

    /**
     * Admin method to list all parents.
     */
    public function index()
    {
        // We group parents by the set of children they share.
        // First, get all students who have at least one parent link
        $students = \App\Models\Student::with(['parents.user', 'classRoom'])->get();
        
        $familyGroups = [];
        foreach ($students as $student) {
            $parents = $student->parents;
            if ($parents->isEmpty()) continue;

            // Create a unique key based on sorted parent IDs
            $pIds = $parents->pluck('id')->sort()->values()->toArray();
            $key = implode('-', $pIds);

            if (!isset($familyGroups[$key])) {
                $father = $parents->firstWhere('relationship_type', 'father');
                $mother = $parents->firstWhere('relationship_type', 'mother');
                
                // If neither is father/mother, just take the first one as primary
                $primary = $father ?: ($mother ?: $parents->first());

                $familyGroups[$key] = [
                    'id' => $key,
                    'name' => $primary->user->full_name ?? $primary->user->name ?? 'N/A',
                    'father' => $father ? [
                        'id'         => $father->id,
                        'name'       => $father->user->full_name ?? $father->user->name,
                        'icNo'       => $father->ic_no,
                        'phone'      => $father->phone,
                        'occupation' => $father->occupation,
                        'income'     => $father->income,
                        'sector'     => $father->sector,
                        'officePhone'=> $father->office_phone,
                        'address'    => $father->address,
                        'postcode'   => $father->postcode,
                        'city'       => $father->city,
                        'district'   => $father->district,
                        'state'      => $father->state_name,
                        'country'    => $father->country,
                        'parliament' => $father->parliament,
                        'childCount' => $father->child_count,
                        'reference'  => $father->reference,
                    ] : null,
                    'mother' => $mother ? [
                        'id'         => $mother->id,
                        'name'       => $mother->user->full_name ?? $mother->user->name,
                        'icNo'       => $mother->ic_no,
                        'phone'      => $mother->phone,
                        'occupation' => $mother->occupation,
                        'income'     => $mother->income,
                        'sector'     => $mother->sector,
                        'officePhone'=> $mother->office_phone,
                        'address'    => $mother->address,
                        'postcode'   => $mother->postcode,
                        'city'       => $mother->city,
                        'district'   => $mother->district,
                        'state'      => $mother->state_name,
                        'country'    => $mother->country,
                        'parliament' => $mother->parliament,
                        'childCount' => $mother->child_count,
                        'reference'  => $mother->reference,
                    ] : null,
                    // Flattened fields for list view
                    'icNo'           => $primary->ic_no,
                    'phone'          => $primary->phone ?? ($mother ? $mother->phone : ($father ? $father->phone : '')),
                    'occupation'     => $primary->occupation,
                    'income'         => $parents->sum('income'),
                    'sector'         => $primary->sector,
                    'officePhone'    => $primary->office_phone,
                    'address'        => $primary->address,
                    'postcode'       => $primary->postcode,
                    'city'           => $primary->city,
                    'district'       => $primary->district,
                    'state'          => $primary->state_name,
                    'country'        => $primary->country,
                    'parliament'     => $primary->parliament,
                    'childCount'     => $primary->child_count,
                    'reference'      => $primary->reference,
                    'relationshipType' => $father && $mother ? 'Ibu & Bapa' : $primary->relationship_type,
                    'children' => []
                ];
            }

            // Avoid duplicate children if they appear multiple times (though shouldn't)
            $exists = collect($familyGroups[$key]['children'])->contains('id', $student->id);
            if (!$exists) {
                $familyGroups[$key]['children'][] = [
                    'id' => $student->id,
                    'name' => $student->name,
                    'className' => $student->classRoom->name ?? 'N/A'
                ];
            }
        }

        // Also add parents who have NO children (orphaned parents)
        $allParents = \App\Models\ParentProfile::with(['user', 'students'])->get();
        foreach ($allParents as $parent) {
            $hasStudent = $parent->students->isNotEmpty();
            if (!$hasStudent) {
                $pData = [
                    'name'       => $parent->user->full_name ?? $parent->user->name,
                    'icNo'       => $parent->ic_no,
                    'phone'      => $parent->phone,
                    'occupation' => $parent->occupation,
                    'income'     => $parent->income,
                    'sector'     => $parent->sector,
                    'officePhone'=> $parent->office_phone,
                    'address'    => $parent->address,
                    'postcode'   => $parent->postcode,
                    'city'       => $parent->city,
                    'district'   => $parent->district,
                    'state'      => $parent->state_name,
                    'country'    => $parent->country,
                    'parliament' => $parent->parliament,
                    'childCount' => $parent->child_count,
                    'reference'  => $parent->reference,
                ];
                $familyGroups['p' . $parent->id] = [
                    'id'               => 'p' . $parent->id,
                    'name'             => $parent->user->full_name ?? $parent->user->name,
                    'father'           => $parent->relationship_type === 'father' ? $pData : null,
                    'mother'           => $parent->relationship_type === 'mother' ? $pData : null,
                    'icNo'             => $parent->ic_no,
                    'phone'            => $parent->phone,
                    'occupation'       => $parent->occupation,
                    'income'           => $parent->income,
                    'sector'           => $parent->sector,
                    'officePhone'      => $parent->office_phone,
                    'address'          => $parent->address,
                    'postcode'         => $parent->postcode,
                    'city'             => $parent->city,
                    'district'         => $parent->district,
                    'state'            => $parent->state_name,
                    'country'          => $parent->country,
                    'parliament'       => $parent->parliament,
                    'childCount'       => $parent->child_count,
                    'reference'        => $parent->reference,
                    'relationshipType' => $parent->relationship_type,
                    'children'         => []
                ];
            }
        }

        return response()->json(array_values($familyGroups));
    }
}
