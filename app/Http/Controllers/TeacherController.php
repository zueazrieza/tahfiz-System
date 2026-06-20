<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Teacher;

class TeacherController extends Controller
{
    private function teacherShape(Teacher $t): array
    {
        $classIds = \App\Models\ClassRoom::where('teacher_id', $t->id)->pluck('id');
        return [
            'id'             => $t->id,
            'name'           => $t->name,
            'gender'         => $t->gender,
            'email'          => $t->email,
            'phone'          => $t->phone,
            'icNo'           => $t->ic_no,
            'specialization' => $t->specialization,
            'status'         => $t->status,
            'joinedDate'     => $t->joined_date,
            'userId'         => $t->user_id,
            'classIds'       => $classIds,
        ];
    }

    public function index(Request $request)
    {
        $search = $request->query('search');

        if ($request->query('all')) {
            $teachers = Teacher::query()
                ->when($search, fn($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))
                ->latest()
                ->get();

            return response()->json($teachers->map(fn($t) => $this->teacherShape($t)));
        }

        $teachers = Teacher::query()
            ->when($search, fn($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))
            ->latest()
            ->paginate(10);

        $teachers->getCollection()->transform(fn($t) => $this->teacherShape($t));

        return response()->json($teachers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'phone'          => 'required|string|max:20',
            'icNo'           => 'nullable|string|unique:teachers,ic_no',
            'username'       => 'nullable|string|unique:users,name',
            'gender'         => 'nullable|in:M,F',
            'specialization' => 'nullable|string|max:255',
            'status'         => 'string|in:Aktif,Tidak Aktif',
            'joinedDate'     => 'nullable|date',
        ]);

        $loginId = $validated['username']
                   ?? $validated['icNo']
                   ?? explode('@', $validated['email'])[0];

        $user = \App\Models\User::create([
            'name'      => $loginId,
            'full_name' => $validated['name'],
            'email'     => $validated['email'],
            'password'  => \Illuminate\Support\Facades\Hash::make($loginId),
            'role'      => 'teacher',
            'status'    => 'active',
        ]);

        $teacher = Teacher::create([
            'user_id'        => $user->id,
            'name'           => $validated['name'],
            'gender'         => $validated['gender'] ?? 'M',
            'email'          => $validated['email'],
            'phone'          => $validated['phone'],
            'ic_no'          => $validated['icNo'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
            'status'         => $validated['status'] ?? 'Aktif',
            'joined_date'    => $validated['joinedDate'] ?? now()->format('Y-m-d'),
        ]);

        return response()->json($this->teacherShape($teacher), 201);
    }

    public function update(Request $request, string $id)
    {
        $teacher = Teacher::findOrFail($id);

        $data = $request->all();

        $updateData = [];
        if (isset($data['name']))           $updateData['name']           = $data['name'];
        if (isset($data['email']))          $updateData['email']          = $data['email'];
        if (isset($data['phone']))          $updateData['phone']          = $data['phone'];
        if (isset($data['icNo']))           $updateData['ic_no']          = $data['icNo'];
        if (isset($data['gender']))         $updateData['gender']         = $data['gender'];
        if (isset($data['specialization'])) $updateData['specialization'] = $data['specialization'];
        if (isset($data['status']))         $updateData['status']         = $data['status'];
        if (isset($data['joinedDate']))     $updateData['joined_date']    = $data['joinedDate'];

        $teacher->update($updateData);
        $teacher->refresh();

        return response()->json($this->teacherShape($teacher));
    }

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
