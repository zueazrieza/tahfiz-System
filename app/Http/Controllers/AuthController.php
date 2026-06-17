<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ─── Web Views (blade) ───────────────────────────────────────────────────

    public function showLogin()
    {
        return view('auth.login');
    }

    public function showRegister()
    {
        return view('auth.register');
    }

    // ─── API: JSON endpoints used by React SPA ───────────────────────────────

    /**
     * POST /api/login
     */
    public function apiLogin(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required'],
            'role'     => ['required', 'string', 'in:admin,teacher,parent,student'],
        ]);

        // Check if email exists in the database
        $emailExists = User::where('email', $credentials['email'])->exists();
        if (!$emailExists) {
            return response()->json([
                'message' => 'Akaun dengan e-mel ini tidak wujud / belum dicipta.',
            ], 404);
        }

        // Match by email and role
        $user = User::where('email', $credentials['email'])
            ->where('role', $credentials['role'])
            ->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'E-mel/Nama, kata laluan atau peranan tidak sah.',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Akaun anda masih belum diluluskan oleh Admin/Mudir. Sila tunggu kelulusan.',
            ], 403);
        }

        // Authenticate the user
        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
                'status' => $user->status,
                'linked_id' => $user->linked_id,
            ],
        ]);
    }

    /**
     * POST /api/register
     */
    public function apiRegister(Request $request)
    {
        $data = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'role'                  => ['required', 'string', 'in:teacher,parent'],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
            'status'   => 'pending', // Default to pending as requested
        ]);

        // We DO NOT login immediately if pending
        return response()->json([
            'message' => 'Pendaftaran berjaya! Sila tunggu kelulusan Admin sebelum log masuk.',
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
                'status' => $user->status,
            ],
        ], 201);
    }

    /**
     * POST /api/logout
     */
    public function apiLogout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['user' => null], 401);
        }

        $user = Auth::user();
        return response()->json([
            'user' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'full_name' => $user->full_name ?: $user->name,
                'email'     => $user->email,
                'role'      => $user->role,
                'status'    => $user->status,
                'linked_id' => $user->linked_id,
            ],
        ]);
    }

    /**
     * POST /api/forgot-password
     */
    public function apiForgotPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            return response()->json([
                'message' => 'E-mel ini tidak berdaftar dalam sistem.',
            ], 422);
        }

        return response()->json([
            'message' => 'Pautan set semula kata laluan telah dihantar ke e-mel anda.',
        ]);
    }

    // ─── Legacy web form routes (omitted for brevity or kept) ───────────────
}
