<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Announcement;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $query = Announcement::with('author')->latest();

        if ($request->has('target_audience')) {
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

    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->delete();

        return response()->json(['message' => 'Pengumuman berjaya dipadam']);
    }
}
