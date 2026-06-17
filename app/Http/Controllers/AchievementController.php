<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\Student;
use App\Models\HafazanRecord;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AchievementController extends Controller
{
    /**
     * Get achievements for a student.
     */
    public function index($studentId)
    {
        // Sync achievements first to ensure they are up to date
        $this->syncStudentAchievements($studentId);
        
        $achievements = Achievement::where('student_id', $studentId)
            ->orderBy('earned_at', 'desc')
            ->get();
            
        return response()->json($achievements);
    }

    /**
     * Logic to evaluate and award achievements.
     */
    public function syncStudentAchievements($studentId)
    {
        $student = Student::with(['hafazanRecords' => function($q) {
            $q->orderBy('date', 'desc');
        }])->findOrFail($studentId);
        
        $records = $student->hafazanRecords;
        
        // --- 1. Milestone: Juzuk Completion ---
        $this->checkJuzukMilestones($student);
        
        // --- 2. High Performance: Raja Sabaq ---
        $this->checkRajaSabaq($student, $records);
        
        // --- 3. Consistency: Istiqamah (Streak) ---
        $this->checkStreakAchievement($student, $records);
        
        // --- 4. Quality: Mumtaz Award ---
        $this->checkQualityAchievement($student, $records);
    }

    private function checkJuzukMilestones($student)
    {
        $juzuk = (int) ($student->juzuk_completed ?? 0);

        // Juzuk-based rank badges — awarded automatically when threshold is met
        $juzukRanks = [
            0  => ['name' => 'Tahsin',          'desc' => 'Selamat datang ke AKMAL! Perjalanan hafazan anda bermula.'],
            1  => ['name' => 'Warrior',          'desc' => 'Tamat juzuk pertama — anda seorang pejuang hafazan!'],
            5  => ['name' => 'Elite',            'desc' => 'Tamat 5 Juzuk dengan lancar. Selamat naik ke Elite!'],
            10 => ['name' => 'Master',           'desc' => 'Tamat 10 Juzuk — pakar hafazan semakin terserlah!'],
            15 => ['name' => 'Grandmaster',      'desc' => 'Tamat 15 Juzuk — separuh Al-Quran sudah di dada!'],
            20 => ['name' => 'Titan',            'desc' => 'Tamat 20 Juzuk — ketahanan hafazan setaraf Titan!'],
            25 => ['name' => 'Gladiator',        'desc' => 'Tamat 25 Juzuk — hampir khatam, teruskan perjuangan!'],
            30 => ['name' => 'Legend Al-Hafiz',  'desc' => 'MashaAllah! Khatam 30 Juzuk Al-Quran. Gelaran Al-Hafiz milik anda!'],
        ];

        foreach ($juzukRanks as $threshold => $info) {
            if ($juzuk >= $threshold) {
                Achievement::firstOrCreate(
                    ['student_id' => $student->id, 'name' => $info['name']],
                    ['type' => 'badge', 'earned_at' => now(), 'meta' => ['description' => $info['desc']]]
                );
            }
        }

        // DB ranking field unlocks Legend sub-ranks (require exam — awarded via ManageAchievements)
        $dbRanking = (int) ($student->ranking ?? -1);
        $rankingBadges = [
            8  => ['name' => 'Legend Al-Hafiz Amethyst', 'desc' => 'Anugerah Amethyst — tasmik 5 Juzuk sehari tanpa salah.'],
            9  => ['name' => 'Legend Al-Hafiz Ruby',     'desc' => 'Anugerah Ruby — lulus peperiksaan tebuk 60 soalan.'],
            10 => ['name' => 'Legend Al-Hafiz Sapphire', 'desc' => 'Anugerah Sapphire — lulus peperiksaan tebuk 120 soalan.'],
            11 => ['name' => 'Syahadah Emperor',         'desc' => 'Pencapaian tertinggi AKMAL — Syahadah Emperor!'],
        ];

        foreach ($rankingBadges as $rankLevel => $info) {
            if ($dbRanking >= $rankLevel) {
                Achievement::firstOrCreate(
                    ['student_id' => $student->id, 'name' => $info['name']],
                    ['type' => 'badge', 'earned_at' => now(), 'meta' => ['description' => $info['desc']]]
                );
            }
        }
    }

    private function checkRajaSabaq($student, $records)
    {
        $hasHighSabaq = $records->contains(function($r) {
            return $r->ayah_count >= 15;
        });

        if ($hasHighSabaq) {
            Achievement::firstOrCreate(
                ['student_id' => $student->id, 'name' => 'Raja Sabaq'],
                ['type' => 'badge', 'meta' => ['description' => 'Berjaya menghafal 15+ ayat dalam satu sesi.']]
            );
        }
    }

    private function checkStreakAchievement($student, $records)
    {
        // Simple 7-day streak check
        $uniqueDates = $records->pluck('date')->unique()->sortDesc();
        if ($uniqueDates->count() < 7) return;

        $streak = 0;
        $prevDate = null;
        
        foreach ($uniqueDates as $d) {
            $current = Carbon::parse($d);
            if (!$prevDate) {
                $streak = 1;
            } else {
                if ($prevDate->diffInDays($current) <= 1) {
                    $streak++;
                } else {
                    break;
                }
            }
            $prevDate = $current;
        }

        if ($streak >= 7) {
            Achievement::firstOrCreate(
                ['student_id' => $student->id, 'name' => 'Istiqamah Hafiz'],
                ['type' => 'badge', 'meta' => ['description' => 'Hantar rekod hafazan 7 hari berturut-turut!']]
            );
        }
    }

    private function checkQualityAchievement($student, $records)
    {
        $mumtazCount = 0;
        foreach ($records->take(5) as $r) {
            if ($r->sabaq_grade === 'Mumtaz') $mumtazCount++;
        }

        if ($mumtazCount >= 5) {
            Achievement::firstOrCreate(
                ['student_id' => $student->id, 'name' => 'Mumtaz Award'],
                ['type' => 'badge', 'meta' => ['description' => '5 rekod terakhir berpangkat Mumtaz. Kualiti hebat!']]
            );
        }
    }

    /**
     * Store a manually awarded achievement.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'name' => 'required|string',
            'type' => 'required|string',
            'earned_at' => 'nullable|date',
        ]);

        $achievement = Achievement::create([
            'student_id' => $validated['student_id'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'earned_at' => $validated['earned_at'] ?? now(),
        ]);

        return response()->json($achievement, 201);
    }

    /**
     * Remove an achievement.
     */
    public function destroy($id)
    {
        $achievement = Achievement::findOrFail($id);
        $achievement->delete();

        return response()->json(['message' => 'Achievement removed successfully']);
    }
}
