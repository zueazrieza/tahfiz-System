<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Announcement;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        // Auto archive announcements older than 30 days
        Announcement::where('is_active', true)
            ->where('created_at', '<', now()->subDays(30))
            ->update(['is_active' => false]);

        $query = Announcement::with('author')->where('is_active', true)->latest();

        $user = auth()->user();

        if ($user) {
            if ($user->role !== 'admin') {
                $audience = 'All';
                if ($user->role === 'parent') {
                    $audience = 'Parents';
                } elseif ($user->role === 'student') {
                    $audience = 'Students';
                } elseif ($user->role === 'teacher') {
                    $audience = 'Teachers';
                }
                $query->whereIn('target_audience', ['All', $audience]);
            }
        } elseif ($request->has('target_audience')) {
            $query->whereIn('target_audience', ['All', $request->target_audience]);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string',
            'target_audience' => 'required|string',
        ]);

        // Assumes user is authenticated via API token, but since this might be called from React, we need the author_id
        $author_id = $request->input('author_id') ?? 1; // Fallback to 1 if not provided

        $announcement = Announcement::create([
            'title' => $request->title,
            'content' => $request->content,
            'type' => $request->type,
            'target_audience' => $request->target_audience,
            'author_id' => $author_id,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Pengumuman berjaya ditambah', 'announcement' => $announcement->load('author')], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string',
            'target_audience' => 'required|string',
        ]);

        $announcement = Announcement::findOrFail($id);
        $announcement->update([
            'title' => $request->title,
            'content' => $request->content,
            'type' => $request->type,
            'target_audience' => $request->target_audience,
        ]);

        return response()->json(['message' => 'Pengumuman berjaya dikemaskini', 'announcement' => $announcement->load('author')]);
    }

    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->delete();

        return response()->json(['message' => 'Pengumuman berjaya dipadam']);
    }
}
