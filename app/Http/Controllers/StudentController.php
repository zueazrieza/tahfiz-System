<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\HafazanRecord;
use App\Models\Achievement;
use Illuminate\Support\Facades\Log;
use App\Imports\StudentsImport;
use Maatwebsite\Excel\Facades\Excel;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $classId = $request->query('classId');
        $students = $classId 
            ? Student::with(['classRoom.primaryTeacher', 'teacher'])->where('class_id', $classId)->get() 
            : Student::with(['classRoom.primaryTeacher', 'teacher'])->get();
        // Map snake_case to camelCase for frontend
        return $students->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'phone' => $s->phone,
                'icNo' => $s->ic_no,
                'gender' => $s->gender,
                'dob' => $s->dob,
                'age' => $s->age,
                'address' => $s->address,
                'maritalStatus' => $s->marital_status,
                'bloodType' => $s->blood_type,
                'pob' => $s->pob,
                'citizenship' => $s->citizenship,
                'race' => $s->race,
                'religion' => $s->religion,
                'educationBackground' => $s->education_background,
                'emergencyContactName' => $s->emergency_contact_name,
                'emergencyContactPhone' => $s->emergency_contact_phone,
                'familyIncome' => $s->family_income,
                'classId' => $s->class_id,
                'teacherId' => $s->teacher_id,
                'parentId' => $s->parent_id,
                'parentName' => $s->parent_name,
                'parentPhone' => $s->parent_phone,
                'enrolledDate' => $s->enrolled_date,
                'juzukCompleted' => $s->juzuk_completed,
                'intakeJuzuk' => $s->intake_juzuk,
                'status' => $s->status,
                'medicalHistory' => $s->medical_history,
                'admissionType' => $s->admission_type,
                'ranking' => $s->ranking,
                'matricNo' => $s->matric_no,
                'matric_no' => $s->matric_no,
                'intake' => $s->intake,
                'teacherName' => $s->teacher?->name ?? $s->classRoom?->primaryTeacher?->name ?? 'Belum Ditapis',
                'className' => $s->classRoom?->name ?? 'Belum Ditapis',
            ];
        });
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'phone' => 'nullable|string',
            'icNo' => 'nullable|string',
            'gender' => 'required|string',
            'dob' => 'nullable|date',
            'age' => 'required|integer',
            'address' => 'nullable|string',
            'maritalStatus' => 'nullable|string',
            'bloodType' => 'nullable|string',
            'pob' => 'nullable|string',
            'citizenship' => 'nullable|string',
            'race' => 'nullable|string',
            'religion' => 'nullable|string',
            'educationBackground' => 'nullable|string',
            'emergencyContactName' => 'nullable|string',
            'emergencyContactPhone' => 'nullable|string',
            'familyIncome' => 'nullable|string',
            'classId' => 'nullable',
            'teacherId' => 'nullable',
            'parentId' => 'nullable',
            'parentName' => 'nullable|string',
            'parentPhone' => 'nullable|string',
            'enrolledDate' => 'required|date',
            'intakeJuzuk' => 'integer',
            'juzukCompleted' => 'integer',
            'status' => 'string',
            'medicalHistory' => 'nullable|string',
            'admissionType' => 'nullable|string',
            'ranking' => 'nullable|integer',
            'matricNo' => 'nullable|string',
            'intake' => 'nullable|string',
        ]);

        $student = Student::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'ic_no' => $validated['icNo'] ?? null,
            'gender' => $validated['gender'] ?? 'M',
            'dob' => $validated['dob'] ?? null,
            'age' => $validated['age'],
            'address' => $validated['address'] ?? null,
            'marital_status' => $validated['maritalStatus'] ?? null,
            'blood_type' => $validated['bloodType'] ?? null,
            'pob' => $validated['pob'] ?? null,
            'citizenship' => $validated['citizenship'] ?? null,
            'race' => $validated['race'] ?? null,
            'religion' => $validated['religion'] ?? null,
            'education_background' => $validated['educationBackground'] ?? null,
            'emergency_contact_name' => $validated['emergencyContactName'] ?? null,
            'emergency_contact_phone' => $validated['emergencyContactPhone'] ?? null,
            'family_income' => $validated['familyIncome'] ?? null,
            'class_id' => $validated['classId'] ?? null,
            'teacher_id' => $validated['teacherId'] ?? null,
            'parent_id' => $validated['parentId'] ?? null,
            'parent_name' => $validated['parentName'] ?? null,
            'parent_phone' => $validated['parentPhone'] ?? null,
            'enrolled_date' => $validated['enrolledDate'],
            'intake_juzuk' => $validated['intakeJuzuk'] ?? 0,
            'juzuk_completed' => $validated['juzukCompleted'] ?? $validated['intakeJuzuk'] ?? 0,
            'status' => $validated['status'] ?? 'Aktif',
            'medical_history' => $validated['medicalHistory'] ?? null,
            'admission_type' => $validated['admissionType'] ?? 'tetap',
            'ranking' => $validated['ranking'] ?? null,
            'matric_no' => $validated['matricNo'] ?? $request->matric_no ?? null,
            'intake' => $validated['intake'] ?? null,
        ]);

        // Returns newly created student in camelCase
        return response()->json([
            'id' => $student->id,
            'name' => $student->name,
            'icNo' => $student->ic_no,
            'gender' => $student->gender,
            'dob' => $student->dob,
            'age' => $student->age,
            'address' => $student->address,
            'classId' => $student->class_id,
            'teacherId' => $student->teacher_id,
            'parentId' => $student->parent_id,
            'parentName' => $student->parent_name,
            'parentPhone' => $student->parent_phone,
            'enrolledDate' => $student->enrolled_date,
            'juzukCompleted' => $student->juzuk_completed,
            'intakeJuzuk' => $student->intake_juzuk,
            'status' => $student->status,
            'medicalHistory' => $student->medical_history,
            'admissionType' => $student->admission_type,
            'ranking' => $student->ranking,
            'matricNo' => $student->matric_no,
            'intake' => $student->intake,
        ]);
    }

    public function show(string $id)
    {
        $s = Student::with(['classRoom.primaryTeacher', 'teacher'])->findOrFail($id);
        return response()->json([
            'id' => $s->id,
            'name' => $s->name,
            'phone' => $s->phone,
            'icNo' => $s->ic_no,
            'gender' => $s->gender,
            'dob' => $s->dob,
            'age' => $s->age,
            'address' => $s->address,
            'maritalStatus' => $s->marital_status,
            'bloodType' => $s->blood_type,
            'pob' => $s->pob,
            'citizenship' => $s->citizenship,
            'race' => $s->race,
            'religion' => $s->religion,
            'educationBackground' => $s->education_background,
            'emergencyContactName' => $s->emergency_contact_name,
            'emergencyContactPhone' => $s->emergency_contact_phone,
            'familyIncome' => $s->family_income,
            'classId' => $s->class_id,
            'teacherId' => $s->teacher_id,
            'parentId' => $s->parent_id,
            'parentName' => $s->parent_name,
            'parentPhone' => $s->parent_phone,
            'enrolledDate' => $s->enrolled_date,
            'juzukCompleted' => $s->juzuk_completed,
            'intakeJuzuk' => $s->intake_juzuk,
            'status' => $s->status,
            'medicalHistory' => $s->medical_history,
            'admissionType' => $s->admission_type,
            'ranking' => $s->ranking,
            'matricNo' => $s->matric_no,
            'intake' => $s->intake,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $student = Student::findOrFail($id);
        $data = $request->all();

        $student->update([
            'name' => $request->name ?? $student->name,
            'phone' => $request->phone ?? $student->phone,
            'ic_no' => $request->icNo ?? $request->ic_no ?? $student->ic_no,
            'gender' => $request->gender ?? $student->gender,
            'dob' => $request->dob ?? $student->dob,
            'age' => $request->age ?? $student->age,
            'address' => $request->address ?? $student->address,
            'marital_status' => $request->maritalStatus ?? $request->marital_status ?? $student->marital_status,
            'blood_type' => $request->bloodType ?? $request->blood_type ?? $student->blood_type,
            'pob' => $request->pob ?? $student->pob,
            'citizenship' => $request->citizenship ?? $student->citizenship,
            'race' => $request->race ?? $student->race,
            'religion' => $request->religion ?? $student->religion,
            'education_background' => $request->educationBackground ?? $request->education_background ?? $student->education_background,
            'emergency_contact_name' => $request->emergencyContactName ?? $request->emergency_contact_name ?? $student->emergency_contact_name,
            'emergency_contact_phone' => $request->emergencyContactPhone ?? $request->emergency_contact_phone ?? $student->emergency_contact_phone,
            'family_income' => $request->familyIncome ?? $request->family_income ?? $student->family_income,
            'class_id' => $request->classId ?? $request->class_id ?? $student->class_id,
            'teacher_id' => $request->teacherId ?? $request->teacher_id ?? $student->teacher_id,
            'parent_id' => $request->parentId ?? $request->parent_id ?? $student->parent_id,
            'parent_name' => $request->parentName ?? $request->parent_name ?? $student->parent_name,
            'parent_phone' => $request->parentPhone ?? $request->parent_phone ?? $student->parent_phone,
            'enrolled_date' => $request->enrolledDate ?? $request->enrolled_date ?? $student->enrolled_date,
            'juzuk_completed' => $request->juzukCompleted ?? $request->juzuk_completed ?? $student->juzuk_completed,
            'intake_juzuk' => $request->intakeJuzuk ?? $request->intake_juzuk ?? $student->intake_juzuk,
            'status' => $request->status ?? $student->status,
            'medical_history' => $request->medicalHistory ?? $request->medical_history ?? $student->medical_history,
            'admission_type' => $request->admissionType ?? $request->admission_type ?? $student->admission_type,
            'ranking' => $request->ranking ?? $student->ranking,
            'matric_no' => $request->matricNo ?? $request->matric_no ?? $student->matric_no,
            'intake' => $request->intake ?? $student->intake,
        ]);

        return response()->json([
            'id' => $student->id,
            'name' => $student->name,
            'icNo' => $student->ic_no,
            'gender' => $student->gender,
            'dob' => $student->dob,
            'age' => $student->age,
            'address' => $student->address,
            'classId' => $student->class_id,
            'teacherId' => $student->teacher_id,
            'parentId' => $student->parent_id,
            'parentName' => $student->parent_name,
            'parentPhone' => $student->parent_phone,
            'enrolledDate' => $student->enrolled_date,
            'juzukCompleted' => $student->juzuk_completed,
            'intakeJuzuk' => $student->intake_juzuk,
            'status' => $student->status,
            'medicalHistory' => $student->medical_history,
            'admissionType' => $student->admission_type,
            'ranking' => $student->ranking,
            'matricNo' => $student->matric_no,
            'intake' => $student->intake,
        ]);
    }

    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);
        $student->delete();
        return response()->json(['success' => true]);
    }

    public function getTeacherStudents(Request $request)
    {
        $teacherId = $request->query('teacherId');
        if (!$teacherId) {
            return response()->json(['error' => 'Teacher ID required'], 400);
        }

        $students = Student::where('teacher_id', $teacherId)
            ->orWhereHas('classRoom', function($query) use ($teacherId) {
                $query->where('teacher_id', $teacherId);
            })
            ->get();

        return $students->map(function($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'classId' => $s->class_id,
                'teacherId' => $s->teacher_id,
                'age' => $s->age,
                'enrolledDate' => $s->enrolled_date,
                'juzukCompleted' => $s->juzuk_completed,
                'status' => $s->status,
                'parentName' => $s->parent_name,
                'parentPhone' => $s->parent_phone,
            ];
        });
    }

    public function dashboard($id)
    {
        $student = Student::with(['classRoom.primaryTeacher', 'teacher'])->findOrFail($id);
        
        // Calculate streak
        $dates = HafazanRecord::where('student_id', $id)
            ->orderBy('date', 'desc')
            ->pluck('date')
            ->unique()
            ->toArray();

        $streak = 0;
        if (!empty($dates)) {
            $currentDate = new \DateTime();
            $lastRecordDate = new \DateTime($dates[0]);
            $diff = $currentDate->diff($lastRecordDate)->days;
            
            if ($diff <= 1) {
                $prevDate = null;
                foreach ($dates as $dateStr) {
                    $date = new \DateTime($dateStr);
                    if ($prevDate === null) {
                        $streak = 1;
                    } else {
                        $interval = $prevDate->diff($date);
                        if ($interval->days === 1) {
                            $streak++;
                        } else {
                            break;
                        }
                    }
                    $prevDate = $date;
                }
            }
        }

        // Rank name: DB ranking field takes priority, else derived from juzuk
        $juzuk = $student->juzuk_completed ?? 0;
        $rankNames = [
            0  => 'Tahsin',
            1  => 'Warrior',
            2  => 'Elite',
            3  => 'Master',
            4  => 'Grandmaster',
            5  => 'Titan',
            6  => 'Gladiator',
            7  => 'Legend Al-Hafiz',
            8  => 'Legend Al-Hafiz Amethyst',
            9  => 'Legend Al-Hafiz Ruby',
            10 => 'Legend Al-Hafiz Sapphire',
            11 => 'Syahadah Emperor',
        ];
        $dbRanking = $student->ranking;
        if ($dbRanking !== null && isset($rankNames[$dbRanking])) {
            $rankName = $rankNames[$dbRanking];
        } else {
            if ($juzuk >= 30)     $rankName = 'Legend Al-Hafiz';
            elseif ($juzuk >= 25) $rankName = 'Gladiator';
            elseif ($juzuk >= 20) $rankName = 'Titan';
            elseif ($juzuk >= 15) $rankName = 'Grandmaster';
            elseif ($juzuk >= 10) $rankName = 'Master';
            elseif ($juzuk >= 5)  $rankName = 'Elite';
            elseif ($juzuk >= 1)  $rankName = 'Warrior';
            else                  $rankName = 'Tahsin';
        }

        // Today's hafazan record
        $todayRecord = HafazanRecord::where('student_id', $id)
            ->whereDate('date', now()->toDateString())
            ->first();

        $todayHafazan = $todayRecord ? [
            'sabaq'  => $todayRecord->sabaq_grade,
            'sabki'  => $todayRecord->sabaqi_grade,
            'manzil' => $todayRecord->manzil_grade,
            'surah'  => $todayRecord->sabaq_surah,
        ] : null;

        // Anonymous class rank
        $classRank = null;
        $classTotal = null;
        if ($student->class_id) {
            $classmates = Student::where('class_id', $student->class_id)
                ->orderByDesc('juzuk_completed')
                ->pluck('id')
                ->values();
            $pos = $classmates->search($student->id);
            $classRank  = $pos !== false ? $pos + 1 : null;
            $classTotal = $classmates->count();
        }

        // Streak milestones
        $streakMilestone = match(true) {
            $streak >= 100 => '💎 Legenda',
            $streak >= 30  => '🔥 Konsisten',
            $streak >= 14  => '⭐ Dua Minggu',
            $streak >= 7   => '✨ Seminggu',
            $streak >= 3   => '🌱 Bermula',
            default        => null,
        };

        return response()->json([
            'juzukCompleted'   => $juzuk,
            'streak'           => $streak,
            'streakMilestone'  => $streakMilestone,
            'rankName'         => $rankName,
            'classRank'        => $classRank,
            'classTotal'       => $classTotal,
            'todayHafazan'     => $todayHafazan,
            'student'          => [
                'id'          => $student->id,
                'name'        => $student->name,
                'className'   => $student->classRoom?->name ?? 'Tiada Kelas',
                'teacherName' => $student->classRoom?->primaryTeacher?->name ?? $student->teacher?->name ?? 'Tiada Murabbi',
                'class_id'    => $student->class_id,
            ],
        ]);
    }
    public function leaderboard($classId)
    {
        $students = Student::where('class_id', $classId)
            ->orderBy('juzuk_completed', 'desc')
            ->orderBy('ranking', 'asc')
            ->get();

        return $students->map(function ($s, $index) {
            return [
                'rank' => $index + 1,
                'id' => $s->id,
                'name' => $s->name,
                'progress' => $s->juzuk_completed . ' Juzuk',
                'badge' => ($index === 0) ? '🏆' : (($index === 1) ? '🥈' : (($index === 2) ? '🥉' : ''))
            ];
        });
    }

    /**
     * Import students from an Excel / CSV file.
     * POST /api/students/import
     */
    public function importFromExcel(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        $import = new StudentsImport();

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            return response()->json([
                'success'  => false,
                'message'  => 'Ralat pengesahan fail Excel.',
                'errors'   => collect($e->failures())->map(fn($f) => "Baris {$f->row()}: " . implode(', ', $f->errors()))->values(),
                'imported' => 0,
                'skipped'  => 0,
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success'  => false,
                'message'  => 'Gagal membaca fail: ' . $e->getMessage(),
                'errors'   => [],
                'imported' => 0,
                'skipped'  => 0,
            ], 500);
        }

        return response()->json([
            'success'  => true,
            'imported' => $import->imported,
            'skipped'  => $import->skipped,
            'errors'   => $import->errors,
            'message'  => "{$import->imported} pelajar berjaya diimport, {$import->skipped} baris dilangkau.",
        ]);
    }
    public function setTarget(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'target' => 'required|string',
        ]);

        if ($request->user() && $request->user()->role === 'student') {
            return response()->json(['message' => 'Tindakan ini tidak dibenarkan.'], 403);
        }

        $student = \App\Models\Student::find($request->student_id);
        if ($student) {
            $student->target_hafazan = $request->target;
            $student->save();
        }

        return response()->json(['message' => 'Target set successfully']);
    }

    /**
     * Live admin dashboard stats — read-only aggregate counts from DB.
     * Does NOT modify any data.
     */
    public function adminStats()
    {
        $totalStudents  = \App\Models\Student::count();
        $activeStudents = \App\Models\Student::where('status', 'Aktif')->count();
        $totalTeachers  = \App\Models\Teacher::count();
        $totalClasses   = \App\Models\ClassRoom::count();

        // Monthly revenue: sum of paid payments for current month
        $monthlyRevenue = \App\Models\Payment::where('status', 'paid')
            ->whereYear('payment_date', now()->year)
            ->whereMonth('payment_date', now()->month)
            ->sum('amount');

        // Pending payments this month
        $pendingPayments = \App\Models\Payment::where('status', 'pending')
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();

        // Today's attendance
        $todayPresent = \App\Models\Attendance::where('date', now()->format('Y-m-d'))
            ->whereIn('status', ['Hadir', 'Lewat'])
            ->count();

        $todayAbsent = \App\Models\Attendance::where('date', now()->format('Y-m-d'))
            ->where('status', 'Tidak Hadir')
            ->count();

        // New this week (students enrolled in last 7 days)
        $newThisWeek = \App\Models\Student::where('enrolled_date', '>=', now()->subDays(7)->format('Y-m-d'))->count();

        // Average juzuk completed
        $avgJuzuk = round(\App\Models\Student::avg('juzuk_completed') ?? 0, 1);

        return response()->json([
            'totalStudents'   => $totalStudents,
            'activeStudents'  => $activeStudents,
            'totalTeachers'   => $totalTeachers,
            'totalClasses'    => $totalClasses,
            'monthlyRevenue'  => $monthlyRevenue,
            'pendingPayments' => $pendingPayments,
            'todayPresent'    => $todayPresent,
            'todayAbsent'     => $todayAbsent,
            'newThisWeek'     => $newThisWeek,
            'avgJuzuk'        => $avgJuzuk,
            'lastUpdated'     => now()->toISOString(),
        ]);
    }

    /**
     * Get recent activities across the whole system.
     */
    public function adminActivities()
    {
        $activities = \App\Models\ActivityLog::orderBy('created_at', 'desc')->limit(20)->get();
        return response()->json($activities);
    }
}
