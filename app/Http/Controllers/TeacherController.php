<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Teacher;

class TeacherController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');

        if ($request->query('all')) {
            $teachers = Teacher::query()
                ->when($search, function ($query, $search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                })
                ->latest()
                ->get();

            return response()->json($teachers->map(function($t) {
                // Same transformation logic
                $t->classIds = \App\Models\ClassRoom::where('teacher_id', $t->id)->pluck('id');
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'gender' => $t->gender,
                    'email' => $t->email,
                    'phone' => $t->phone,
                    'icNo' => $t->ic_no,
                    'specialization' => $t->specialization,
                    'status' => $t->status,
                    'joinedDate' => $t->joined_date,
                    'qualification' => $t->qualification,
                    'experience' => $t->experience,
                    'medicalHistory' => $t->medical_history,
                    'emergencyContactName' => $t->emergency_contact_name,
                    'emergencyContactPhone' => $t->emergency_contact_phone,
                    'dependentsCount' => $t->dependents_count,
                    'residence' => $t->residence,
                    'serviceStartDate' => $t->service_start_date,
                    'userId' => $t->user_id,
                    'classIds' => $t->classIds
                ];
            }));
        }

        $teachers = Teacher::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10);

        // Map classIds from class_rooms table
        $teachers->getCollection()->transform(function($t) {
            $t->classIds = \App\Models\ClassRoom::where('teacher_id', $t->id)->pluck('id');
            // camelCase for consistency
            return [
                'id' => $t->id,
                'name' => $t->name,
                'gender' => $t->gender,
                'email' => $t->email,
                'phone' => $t->phone,
                'icNo' => $t->ic_no,
                'specialization' => $t->specialization,
                'status' => $t->status,
                'joinedDate' => $t->joined_date,
                'qualification' => $t->qualification,
                'experience' => $t->experience,
                'medicalHistory' => $t->medical_history,
                'emergencyContactName' => $t->emergency_contact_name,
                'emergencyContactPhone' => $t->emergency_contact_phone,
                'dependentsCount' => $t->dependents_count,
                'residence' => $t->residence,
                'serviceStartDate' => $t->service_start_date,
                'userId' => $t->user_id,
                'classIds' => $t->classIds
            ];
        });

        return response()->json($teachers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email', // Check uniqueness in users table
            'phone' => 'required|string|max:20',
            'icNo' => 'nullable|string|unique:teachers,ic_no', // IC is now optional
            'username' => 'nullable|string|unique:users,name', // User can provide a custom username
            'gender' => 'nullable|in:M,F',
            'specialization' => 'nullable|string|max:255',
            'status' => 'string|in:Aktif,Tidak Aktif',
            'joinedDate' => 'nullable|date',
            'qualification' => 'nullable|string',
            'experience' => 'nullable|string',
            'medicalHistory' => 'nullable|string',
            'emergencyContactName' => 'nullable|string',
            'emergencyContactPhone' => 'nullable|string',
            'dependentsCount' => 'nullable|integer',
            'residence' => 'nullable|string',
            'serviceStartDate' => 'nullable|date',
        ]);

        // Determine Login ID (Username)
        // Order: Custom Username -> IC No -> Email Prefix
        $loginId = $validated['username'] 
                   ?? $validated['icNo'] 
                   ?? explode('@', $validated['email'])[0];

        // 1. Create User Account
        $user = \App\Models\User::create([
            'name' => $loginId,
            'full_name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($loginId), // Use login ID as initial password
            'role' => 'teacher',
            'status' => 'active',
        ]);

        // 2. Create Teacher Profile
        $data = [
            'user_id' => $user->id,
            'name' => $validated['name'],
            'gender' => $validated['gender'] ?? 'M',
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'ic_no' => $validated['icNo'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
            'status' => $validated['status'] ?? 'Aktif',
            'joined_date' => $validated['joinedDate'] ?? now()->format('Y-m-d'),
            'qualification' => $validated['qualification'] ?? null,
            'experience' => $validated['experience'] ?? null,
            'medical_history' => $validated['medicalHistory'] ?? null,
            'emergency_contact_name' => $validated['emergencyContactName'] ?? null,
            'emergency_contact_phone' => $validated['emergencyContactPhone'] ?? null,
            'dependents_count' => $validated['dependentsCount'] ?? 0,
            'residence' => $validated['residence'] ?? null,
            'service_start_date' => $validated['serviceStartDate'] ?? null,
        ];

        $teacher = Teacher::create($data);

        return response()->json($teacher, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $teacher = Teacher::findOrFail($id);
        
        $data = $request->all();
        
        // Map camelCase to snake_case for DB
        $updateData = [];
        if (isset($data['name'])) $updateData['name'] = $data['name'];
        if (isset($data['email'])) $updateData['email'] = $data['email'];
        if (isset($data['phone'])) $updateData['phone'] = $data['phone'];
        if (isset($data['icNo'])) $updateData['ic_no'] = $data['icNo'];
        if (isset($data['specialization'])) $updateData['specialization'] = $data['specialization'];
        if (isset($data['status'])) $updateData['status'] = $data['status'];
        if (isset($data['joinedDate'])) $updateData['joined_date'] = $data['joinedDate'];
        if (isset($data['qualification'])) $updateData['qualification'] = $data['qualification'];
        if (isset($data['experience'])) $updateData['experience'] = $data['experience'];
        if (isset($data['medicalHistory'])) $updateData['medical_history'] = $data['medicalHistory'];
        if (isset($data['emergencyContactName'])) $updateData['emergency_contact_name'] = $data['emergencyContactName'];
        if (isset($data['emergencyContactPhone'])) $updateData['emergency_contact_phone'] = $data['emergencyContactPhone'];
        if (isset($data['dependentsCount'])) $updateData['dependents_count'] = $data['dependentsCount'];
        if (isset($data['residence'])) $updateData['residence'] = $data['residence'];
        if (isset($data['serviceStartDate'])) $updateData['service_start_date'] = $data['serviceStartDate'];

        $teacher->update($updateData);

        return response()->json($teacher);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $teacher = Teacher::findOrFail($id);
        $teacher->delete();
        \App\Models\ActivityLog::log('Guru Dipadam (Boleh Dipulihkan)', $teacher->name);
        return response()->json(null, 204);
    }

    public function trashed()
    {
        return Teacher::onlyTrashed()->get()->map(fn($t) => [
            'id'        => $t->id,
            'name'      => $t->name,
            'email'     => $t->email,
            'phone'     => $t->phone,
            'deletedAt' => $t->deleted_at?->format('d/m/Y H:i'),
        ]);
    }

    public function restore(string $id)
    {
        $teacher = Teacher::onlyTrashed()->findOrFail($id);
        $teacher->restore();
        \App\Models\ActivityLog::log('Guru Dipulihkan', $teacher->name);
        return response()->json(['success' => true, 'message' => "Guru {$teacher->name} berjaya dipulihkan."]);
    }

    public function forceDelete(string $id)
    {
        $teacher = Teacher::onlyTrashed()->findOrFail($id);
        $name = $teacher->name;
        $teacher->forceDelete();
        \App\Models\ActivityLog::log('Guru Dipadam Kekal', $name);
        return response()->json(['success' => true]);
    }
}
