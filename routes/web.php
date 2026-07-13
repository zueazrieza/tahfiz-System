<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ClassRoomController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\HafazanRecordController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ParentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\StudentController as StudentCtrl;
use App\Http\Controllers\AchievementController;
use App\Http\Controllers\AIAssessmentController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\MudirEvaluationController;
use App\Http\Controllers\HafazanRecordingController;
use App\Http\Controllers\WeeklyReportController;
use App\Http\Controllers\AchievementController as AchCtrl;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\FinancialAnalyticsController;
use App\Http\Controllers\StudentReportController;
use Illuminate\Support\Facades\Route;

// ─── Landing page ─────────────────────────────────────────────────────────────
Route::get('/', function () {
    return view('landing');
});

// ─── Legacy blade auth (kept for fallback) ────────────────────────────────────
Route::get('/login',    [AuthController::class, 'showLogin'])->name('login');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/logout',  [AuthController::class, 'logout'])->name('logout');

// ─── React SPA — handles all /app/** routes ───────────────────────────────────
Route::get('/app/{any?}', function () {
    return view('app');
})->where('any', '.*')->name('spa');

// ─── Authenticated dashboard (blade fallback redirect) ────────────────────────
Route::get('/dashboard', function () {
    $user = auth()->user();
    if (!$user) return redirect('/');
    return redirect('/app/' . $user->role . '/dashboard');
})->middleware('auth')->name('dashboard');

// ═══════════════════════════════════════════════════════════════════════════════
// JSON API — used by React SPA
// ═══════════════════════════════════════════════════════════════════════════════
Route::prefix('api')->middleware(['web'])->group(function () {

    // ── Public (no auth required) ─────────────────────────────────────────────
    Route::get('/csrf-cookie', fn() => response()->json(['token' => csrf_token()]));

    // Login: rate-limited to 5 attempts / minute per IP (P0 fix)
    Route::post('/login',    [AuthController::class, 'apiLogin'])->middleware('throttle:5,1');
    Route::post('/register', [AuthController::class, 'apiRegister']);
    Route::post('/logout',   [AuthController::class, 'apiLogout']);
    Route::post('/forgot-password', [AuthController::class, 'apiForgotPassword']);
    Route::get('/me',        [AuthController::class, 'me']);

    // Public enrollment (no auth)
    Route::post('/public/register-enrollment', [EnrollmentController::class, 'publicRegister']);

    // ── Authenticated — session cookie required ───────────────────────────────
    Route::middleware(['auth:sanctum'])->group(function () {

        // Students
        Route::post('/students/import',           [StudentController::class, 'importFromExcel']);
        Route::post('/students/set-target',       [StudentController::class, 'setTarget']);
        Route::get('/students/leaderboard/{classId}', [StudentController::class, 'leaderboard']);
        Route::get('/students/dashboard/{id}',    [StudentController::class, 'studentDashboard']);
        Route::get('/teacher/students',           [StudentController::class, 'getTeacherStudents']);
        Route::get('/admin/stats',                [StudentController::class, 'adminStats']);
        Route::get('/admin/activities',           [StudentController::class, 'adminActivities']);
        // Explicit named routes BEFORE apiResource to prevent wildcard shadowing
        Route::get('/students/trashed',           [StudentController::class, 'trashed']);
        Route::apiResource('students', StudentController::class);

        // Teachers — same ordering rule
        Route::get('/teachers/trashed',           [TeacherController::class, 'trashed']);
        Route::apiResource('teachers', TeacherController::class);

        // Classes
        Route::apiResource('classes', ClassRoomController::class);

        // Payments
        Route::apiResource('payments', PaymentController::class);
        Route::post('/payments/{id}/notify-paid', [PaymentController::class, 'notifyPaid']);

        // Voice Recordings
        Route::get('/recordings', [HafazanRecordingController::class, 'index']);
        Route::post('/recordings', [HafazanRecordingController::class, 'store']);
        Route::delete('/recordings/{id}', [HafazanRecordingController::class, 'destroy']);

        // Attendance
        Route::get('/attendance',          [AttendanceController::class, 'index']);
        Route::post('/attendance/bulk',    [AttendanceController::class, 'bulkStore']);

        // Hafazan Records
        Route::get('/hafazan-records',     [HafazanRecordController::class, 'index']);
        Route::post('/hafazan-records',    [HafazanRecordController::class, 'store']);

        // AI
        Route::post('/ai-predictions/generate',                       [AIController::class, 'generateForStudent']);
        Route::get('/ai-predictions/student/{studentId}',            [AIController::class, 'getPrediction']);
        Route::get('/ai-predictions/class/{classId}',                [AIController::class, 'getClassPredictions']);
        Route::match(['GET', 'POST'], '/ai-predictions/generate/class/{classId}', [AIController::class, 'getClassPredictions']);
        Route::post('/ai/import-alumni',                    [AIController::class, 'importAlumni']);
        Route::get('/ai/benchmarks',                        [AIController::class, 'getAIBenchmarks']);
        Route::get('/quran/verses/{chapter}',               [AIController::class, 'getQuranVerses']);
        Route::get('/quran/translation/{chapter}',          [AIController::class, 'getQuranTranslation']);
        Route::apiResource('ai-assessments', AIAssessmentController::class);

        // Achievements
        Route::get('/achievements/student/{studentId}', [AchievementController::class, 'index']);
        Route::post('/achievements',                    [AchievementController::class, 'store']);
        Route::delete('/achievements/{id}',             [AchievementController::class, 'destroy']);

        // Profile
        Route::get('/profile',  [ProfileController::class, 'show']);
        Route::post('/profile', [ProfileController::class, 'update']);

        // Parent portal
        Route::get('/parent/children', [ParentController::class, 'getChildren']);
        Route::get('/parents',         [ParentController::class, 'index']);

        // Notifications
        Route::get('/notifications',                    [NotificationController::class, 'index']);
        Route::post('/notifications/mark-all-read',     [NotificationController::class, 'markAllAsRead']);
        Route::apiResource('notifications', NotificationController::class)->only(['update', 'destroy']);

        // Announcements
        Route::apiResource('announcements', AnnouncementController::class)->only(['index', 'store', 'update', 'destroy']);

        // Enrollment management (staff)
        Route::get('/enrollment/applicants',                [EnrollmentController::class, 'index']);
        Route::post('/enrollment/applicants',               [EnrollmentController::class, 'adminCreate']);
        Route::get('/enrollment/schedules',                 [EnrollmentController::class, 'getInterviewSchedules']);
        Route::post('/enrollment/parent-decide/{id}',       [EnrollmentController::class, 'parentDecide']);

        // Mudir & Reports
        Route::apiResource('mudir-evaluations', MudirEvaluationController::class)->only(['index', 'store']);
        Route::apiResource('reports/weekly',    WeeklyReportController::class)->only(['index', 'store']);
        Route::get('/students/targets/{studentId}', [StudentReportController::class, 'getHafazanTargets']);

        // Analytics
        Route::get('/analytics/financial', [FinancialAnalyticsController::class, 'index']);

        // ── Admin-only ────────────────────────────────────────────────────────
        Route::middleware('can:admin-only')->group(function () {
            Route::get('/users/pending',              [UserController::class, 'pendingUsers']);
            Route::post('/users/{id}/interview',      [UserController::class, 'recordInterview']);
            Route::post('/users/{id}/approve',        [UserController::class, 'approveUser']);
            Route::post('/users/{id}/reject',         [UserController::class, 'rejectUser']);
            Route::get('/users/students-no-account',  [UserController::class, 'studentsWithoutAccounts']);
            Route::post('/users/student-account',     [UserController::class, 'createStudentAccount']);

            // Restore / permanent-delete — admin only
            Route::post('/students/{id}/restore',     [StudentController::class, 'restore']);
            Route::delete('/students/{id}/force',     [StudentController::class, 'forceDelete']);
            Route::post('/teachers/{id}/restore',     [TeacherController::class, 'restore']);
            Route::delete('/teachers/{id}/force',     [TeacherController::class, 'forceDelete']);

            // Export — admin only
            Route::get('/export/students', [ExportController::class, 'exportStudents']);
            Route::get('/export/teachers', [ExportController::class, 'exportTeachers']);
            Route::get('/export/parents',  [ExportController::class, 'exportParents']);

            // Enrollment state-change routes — admin only
            Route::patch('/enrollment/status/{id}',             [EnrollmentController::class, 'updateStatus']);
            Route::post('/enrollment/schedule-interview/{id}',  [EnrollmentController::class, 'scheduleInterview']);
            Route::post('/enrollment/update-interview/{id}',    [EnrollmentController::class, 'updateInterview']);
            Route::get('/enrollment/offer-letter/{id}',         [EnrollmentController::class, 'generateOfferLetter']);
            Route::post('/enrollment/send-offer-email/{id}',    [EnrollmentController::class, 'sendOfferEmail']);
        });
    });
});
