<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\HafazanRecording;
use Illuminate\Support\Facades\Storage;

class HafazanRecordingController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = HafazanRecording::with('student')->orderBy('recorded_at', 'desc');

        if ($user->role === 'student') {
            $query->where('student_id', $user->linked_id);
        } elseif ($user->role === 'teacher') {
            $teacher   = \App\Models\Teacher::where('user_id', $user->id)->first();
            $studentIds = $teacher
                ? \App\Models\Student::where('teacher_id', $teacher->id)->pluck('id')
                : collect();
            $query->whereIn('student_id', $studentIds);
        } elseif ($request->student_id) {
            $query->where('student_id', $request->student_id);
        }

        return $query->get()->map(fn($r) => [
            'id'               => $r->id,
            'student_id'       => $r->student_id,
            'student_name'     => $r->student->name ?? '—',
            'surah'            => $r->surah,
            'ayat_from'        => $r->ayat_from,
            'ayat_to'          => $r->ayat_to,
            'duration_seconds' => $r->duration_seconds,
            'notes'            => $r->notes,
            'recorded_by'      => $r->recorded_by,
            'recorded_at'      => $r->recorded_at?->toISOString(),
            'url'              => Storage::disk('public')->url($r->file_path),
            'mime_type'        => $r->mime_type,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'audio'      => 'required|file|max:51200|mimes:webm,ogg,wav,mp4,mpeg,mp3',
            'student_id' => 'required|exists:students,id',
        ]);

        $file     = $request->file('audio');
        $mime     = $file->getMimeType() ?? 'audio/webm';
        $ext      = match (true) {
            str_contains($mime, 'mp4') || str_contains($mime, 'mpeg') => 'mp4',
            str_contains($mime, 'ogg')  => 'ogg',
            str_contains($mime, 'wav')  => 'wav',
            str_contains($mime, 'mp3')  => 'mp3',
            default                     => 'webm',
        };

        $filename = 'rec_' . $request->student_id . '_' . time() . '.' . $ext;
        $path     = $file->storeAs('recordings', $filename, 'public');

        $recording = HafazanRecording::create([
            'student_id'       => $request->student_id,
            'surah'            => $request->surah,
            'ayat_from'        => $request->ayat_from ?: null,
            'ayat_to'          => $request->ayat_to ?: null,
            'file_path'        => $path,
            'mime_type'        => $mime,
            'duration_seconds' => $request->duration_seconds ?: null,
            'notes'            => $request->notes,
            'recorded_by'      => $request->recorded_by ?? 'student',
            'recorded_at'      => now(),
        ]);

        return response()->json([
            'id'  => $recording->id,
            'url' => Storage::disk('public')->url($path),
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $recording = HafazanRecording::findOrFail($id);
        $user      = $request->user();

        $allowed = match ($user->role) {
            'admin'   => true,
            'teacher' => (function () use ($user, $recording) {
                $teacher = \App\Models\Teacher::where('user_id', $user->id)->first();
                if (!$teacher) return false;
                return \App\Models\Student::where('id', $recording->student_id)
                    ->where('teacher_id', $teacher->id)->exists();
            })(),
            'student' => (int) $user->linked_id === (int) $recording->student_id,
            default   => false,
        };

        if (!$allowed) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        Storage::disk('public')->delete($recording->file_path);
        $recording->delete();
        return response()->json(['success' => true]);
    }
}
