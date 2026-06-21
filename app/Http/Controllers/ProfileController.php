<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\ParentProfile;

class ProfileController extends Controller
{
    /**
     * Get the current authenticated user's profile with role-specific data.
     */
    public function show()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $user->toArray();
        $data['name'] = $user->full_name ?: $user->name; // Prefer full_name for display
        $data['username'] = $user->name; // Keep IC as username
        
        if ($user->role === 'teacher') {
            $data['teacher_data'] = $user->teacher;
        } elseif ($user->role === 'parent') {
            $parentProfile = $user->parentProfile;
            $data['parent_data'] = $parentProfile;
            if ($parentProfile) {
                $children = $parentProfile->students;
                $data['children'] = $children->map(fn($c) => ['id' => $c->id, 'name' => $c->name]);
            }
        } elseif ($user->role === 'student') {
            $data['student_data'] = $user->student;
        }

        return response()->json($data);
    }

    /**
     * Update the current authenticated user's profile.
     */
    public function update(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name'             => 'sometimes|required|string|max:255|unique:users,name,' . $user->id,
            'full_name'        => 'nullable|string|max:255',
            'email'            => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone'            => 'nullable|string',
            'address'          => 'nullable|string',
            'password'         => 'nullable|string|min:8|confirmed',
            'current_password' => 'required_with:password|string',
        ]);

        if (!empty($validated['password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json(['message' => 'Kata laluan semasa tidak sah.'], 422);
            }
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }
        unset($validated['current_password']);

        // Also update phone/job/wage on users table
        $userFields = array_filter([
            'full_name' => $request->full_name ?: null,
            'phone'     => $request->phone,
            'job'       => $request->job,
            'wage'      => $request->wage,
        ], fn($v) => $v !== null);

        $user->update(array_merge($validated, $userFields));

        // Update teacher record
        if ($user->role === 'teacher') {
            $teacher = $user->teacher;
            if ($teacher) {
                $teacher->update([
                    'phone'                   => $request->phone                   ?? $teacher->phone,
                    'ic_no'                   => $request->icNo                    ?? $teacher->ic_no,
                    'gender'                  => $request->gender                  ?? $teacher->gender,
                    'qualification'           => $request->qualification           ?? $teacher->qualification,
                    'experience'              => $request->experience              ?? $teacher->experience,
                    'medical_history'         => $request->medicalHistory          ?? $teacher->medical_history,
                    'emergency_contact_name'  => $request->emergencyContactName    ?? $teacher->emergency_contact_name,
                    'emergency_contact_phone' => $request->emergencyContactPhone   ?? $teacher->emergency_contact_phone,
                    'residence'               => $request->residence               ?? $teacher->residence,
                    'dependents_count'        => $request->dependentsCount         ?? $teacher->dependents_count,
                    'service_start_date'      => $request->serviceStartDate        ?? $teacher->service_start_date,
                ]);
            }
        }

        // Update parent record
        if ($user->role === 'parent') {
            $parent = $user->parentProfile ?? ParentProfile::firstOrCreate(
                ['user_id' => $user->id],
                ['relationship_type' => 'parent']
            );
            $parent->update([
                'relationship_type' => $request->relation ?? $parent->relationship_type,
                'occupation'        => $request->job ?? $parent->occupation,
                'income'            => $request->wage ?? $parent->income,
                'phone'             => $request->phone ?? $parent->phone,
                'address'           => $request->address ?? $parent->address,
                'postcode'          => $request->postcode ?? $parent->postcode,
                'city'              => $request->city ?? $parent->city,
                'district'          => $request->district ?? $parent->district,
                'state_name'        => $request->stateName ?? $parent->state_name,
                'country'           => $request->country ?? $parent->country,
                'parliament'        => $request->parliament ?? $parent->parliament,
                'sector'            => $request->sector ?? $parent->sector,
                'office_phone'      => $request->officePhone ?? $parent->office_phone,
                'child_count'       => $request->childCount ?? $parent->child_count,
                'reference'         => $request->reference ?? $parent->reference,
            ]);
        }

        // Update student record
        if ($user->role === 'student') {
            $student = $user->student ?? Student::find($user->linked_id);
            if ($student) {
                $student->update([
                    'phone'                   => $request->phone ?? $student->phone,
                    'address'                 => $request->address ?? $student->address,
                    'gender'                  => $request->gender ?? $student->gender,
                    'marital_status'          => $request->maritalStatus ?? $student->marital_status,
                    'blood_type'              => $request->bloodType ?? $student->blood_type,
                    'dob'                     => $request->dob ?? $student->dob,
                    'pob'                     => $request->pob ?? $student->pob,
                    'citizenship'             => $request->citizenship ?? $student->citizenship,
                    'race'                    => $request->race ?? $student->race,
                    'religion'                => $request->religion ?? $student->religion,
                    'family_income'           => $request->familyIncome ?? $student->family_income,
                    'medical_history'         => $request->medicalHistory ?? $student->medical_history,
                    'emergency_contact_name'  => $request->emergencyContactName ?? $student->emergency_contact_name,
                    'emergency_contact_phone' => $request->emergencyContactPhone ?? $student->emergency_contact_phone,
                ]);
            }
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $user->fresh(),
        ]);
    }
}
