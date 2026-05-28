<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\HafazanRecordController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\ClassRoomController;
use App\Http\Controllers\AIAssessmentController;
use App\Http\Controllers\AIPredictionController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\AchievementController;
use App\Http\Controllers\FinancialAnalyticsController;
use App\Http\Controllers\ChatbotController;

use App\Http\Controllers\MudirEvaluationController;
use App\Http\Controllers\WeeklyReportController;

Route::get('/achievements/student/{studentId}', [AchievementController::class, 'index']);
Route::post('/achievements', [AchievementController::class, 'store']);
Route::delete('/achievements/{id}', [AchievementController::class, 'destroy']);
Route::apiResource('mudir-evaluations', MudirEvaluationController::class)->only(['index', 'store']);
Route::apiResource('reports/weekly', WeeklyReportController::class)->only(['index', 'store']);
Route::post('/students/set-target', [StudentController::class, 'setTarget']);
Route::get('/analytics/financial', [FinancialAnalyticsController::class, 'index']);
Route::post('/chatbot/handle', [ChatbotController::class, 'handle']);
Route::post('/ai/import-alumni', [AIController::class, 'importAlumni']);
Route::get('/ai/benchmarks', [AIController::class, 'getAIBenchmarks']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Student related
Route::post('/students/import', [StudentController::class, 'importFromExcel']);
Route::apiResource('students', StudentController::class);
Route::get('/teacher/students', [StudentController::class, 'getTeacherStudents']);

// Classes
Route::apiResource('classes', ClassRoomController::class);

// Attendance
Route::get('/attendance', [\App\Http\Controllers\AttendanceController::class, 'index']);
Route::post('/attendance/bulk', [\App\Http\Controllers\AttendanceController::class, 'bulkStore']);

// Hafazan Records
Route::get('/hafazan-records', [HafazanRecordController::class, 'index']);
Route::post('/hafazan-records', [HafazanRecordController::class, 'store']);

// Teachers
Route::apiResource('teachers', TeacherController::class);

// AI Assessments
Route::apiResource('ai-assessments', AIAssessmentController::class);

// AI Predictions
Route::post('/ai-predictions/generate', [AIController::class, 'generateForStudent']);
Route::get('/ai-predictions/student/{studentId}', [AIController::class, 'getPrediction']); 
Route::get('/ai-predictions/class/{classId}', [AIController::class, 'getClassPredictions']);

// Parent Portal
Route::get('/parent/children', [\App\Http\Controllers\ParentController::class, 'getChildren']);
Route::get('/parents', [\App\Http\Controllers\ParentController::class, 'index']);

// User & Access Management
Route::get('/users/pending', [\App\Http\Controllers\UserController::class, 'pendingUsers']);
Route::post('/users/{id}/approve', [\App\Http\Controllers\UserController::class, 'approveUser']);
Route::post('/users/{id}/reject', [\App\Http\Controllers\UserController::class, 'rejectUser']);
Route::get('/users/students-no-account', [\App\Http\Controllers\UserController::class, 'studentsWithoutAccounts']);
Route::post('/users/student-account', [\App\Http\Controllers\UserController::class, 'createStudentAccount']);

// Miscellaneous
Route::get('/students/dashboard/{id}', [StudentController::class, 'studentDashboard']);
use App\Http\Controllers\AnnouncementController;

Route::get('/notifications', function() { return response()->json([]); }); // Placeholder for now
Route::apiResource('announcements', AnnouncementController::class)->only(['index', 'store', 'destroy']);

// Profile
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'show']);
    Route::post('/profile', [\App\Http\Controllers\ProfileController::class, 'update']);
});

// Export Routes
Route::get('/export/students', [\App\Http\Controllers\ExportController::class, 'exportStudents']);
Route::get('/export/teachers', [\App\Http\Controllers\ExportController::class, 'exportTeachers']);
Route::get('/export/parents', [\App\Http\Controllers\ExportController::class, 'exportParents']);
