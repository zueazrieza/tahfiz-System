<?php

namespace App\Http\Controllers;

use App\Models\ClassRoom;
use Illuminate\Http\Request;

class ClassRoomController extends Controller
{
    public function index()
    {
        $classes = ClassRoom::with('primaryTeacher')->get()->map(function ($cls) {
            $cls->teacherId = $cls->teacher_id;
            $cls->studentIds = \App\Models\Student::where('class_id', $cls->id)->pluck('id');
            return $cls;
        });
        return response()->json($classes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'teacherId' => 'nullable',
        ]);

        if (ClassRoom::count() >= 10) {
            return response()->json(['message' => 'Had maksimum halaqah (10 kelas) telah dicapai.'], 422);
        }


        $class = ClassRoom::create([
            'name' => $validated['name'],
            'capacity' => $validated['capacity'],
            'teacher_id' => $validated['teacherId'] ?? null,
        ]);

        $class->teacherId = $class->teacher_id;
        $class->studentIds = [];

        return response()->json($class, 201);
    }

    public function show(string $id)
    {
        $classRoom = ClassRoom::findOrFail($id);
        $classRoom->teacherId = $classRoom->teacher_id;
        $classRoom->studentIds = \App\Models\Student::where('class_id', $classRoom->id)->pluck('id');
        return response()->json($classRoom);
    }

    public function update(Request $request, string $id)
    {
        $classRoom = ClassRoom::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'capacity' => 'sometimes|required|integer|min:1',
            'teacherId' => 'nullable',
        ]);

        $classRoom->update([
            'name' => $validated['name'] ?? $classRoom->name,
            'capacity' => $validated['capacity'] ?? $classRoom->capacity,
            'teacher_id' => array_key_exists('teacherId', $validated) ? $validated['teacherId'] : $classRoom->teacher_id,
        ]);

        $classRoom->teacherId = $classRoom->teacher_id;
        $classRoom->studentIds = \App\Models\Student::where('class_id', $classRoom->id)->pluck('id');

        return response()->json($classRoom);
    }

    public function destroy(ClassRoom $classRoom)
    {
        $classRoom->delete();
        return response()->json(null, 204);
    }
}
