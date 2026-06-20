<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function pendingUsers()
    {
        $users = User::where('status', 'pending')->get();
        Log::info('Pending users count: ' . $users->count());
        return $users;
    }

    public function approveUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'active']);

        // Notify the approved user so they know they can now log in
        AppNotification::send(
            $user->id,
            'Akaun Anda Telah Diluluskan',
            'Tahniah! Akaun anda telah diluluskan oleh Admin. Anda kini boleh log masuk ke sistem AKMAL.',
            'system'
        );

        return response()->json(['message' => 'User approved successfully', 'user' => $user]);
    }

    public function rejectUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User rejected and account deleted.']);
    }

    public function studentsWithoutAccounts()
    {
        $students = Student::where('status', 'Aktif')->get();

        // Map each student with their account info (if any)
        $userMap = User::where('role', 'student')
            ->whereNotNull('linked_id')
            ->pluck('email', 'linked_id');

        $result = $students->map(function ($student) use ($userMap) {
            return [
                'id'           => $student->id,
                'name'         => $student->name,
                'matric_no'    => $student->matric_no,
                'has_account'  => isset($userMap[$student->id]),
                'account_email'=> $userMap[$student->id] ?? null,
            ];
        });

        return response()->json($result->values());
    }

    public function createStudentAccount(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'username' => 'required|unique:users,name',
            'password' => 'required|min:6',
        ]);

        $student = Student::findOrFail($request->student_id);

        $email = str_replace(' ', '', strtolower($request->username)) . '@tahfiz.com';

        $user = User::create([
            'name'      => $request->username,
            'email'     => $email,
            'password'  => Hash::make($request->password),
            'role'      => 'student',
            'status'    => 'active',
            'linked_id' => $student->id,
        ]);

        // Notify all parents linked to this student
        $parentProfiles = $student->parents ?? collect();
        foreach ($parentProfiles as $profile) {
            if ($profile->user_id) {
                AppNotification::send(
                    $profile->user_id,
                    'Akaun Portal Pelajar Telah Disediakan',
                    "Akaun log masuk untuk {$student->name} telah dicipta oleh Admin. E-mel: {$email} | Kata laluan: {$request->password}. Sila log masuk ke portal pelajar.",
                    'system'
                );
            }
        }

        return response()->json(['message' => 'Student account created', 'user' => $user]);
    }

    public function index()
    {
        return User::all();
    }
}
