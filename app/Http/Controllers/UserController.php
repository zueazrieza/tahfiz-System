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
        $students = Student::all();
        $studentUserIds = User::where('role', 'student')->whereNotNull('linked_id')->pluck('linked_id')->toArray();
        
        $studentsWithoutUser = $students->filter(function($student) use ($studentUserIds) {
            return !in_array($student->id, $studentUserIds);
        });
        
        Log::info('Students without accounts count: ' . $studentsWithoutUser->count());
        return response()->json($studentsWithoutUser->values());
    }

    public function createStudentAccount(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'username' => 'required|unique:users,name',
            'password' => 'required|min:6',
        ]);

        $student = Student::findOrFail($request->student_id);

        $user = User::create([
            'name' => $request->username,
            'email' => str_replace(' ', '', strtolower($request->username)) . '@tahfiz.com',
            'password' => Hash::make($request->password),
            'role' => 'student',
            'status' => 'active',
            'linked_id' => $student->id
        ]);

        return response()->json(['message' => 'Student account created', 'user' => $user]);
    }

    public function index()
    {
        return User::all();
    }
}
