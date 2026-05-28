<?php

use App\Imports\StudentsImport;
use App\Models\Student;
use App\Models\User;
use App\Models\ParentProfile;
use App\Models\ClassRoom;
use App\Models\AIPrediction;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it successfully imports students and registers parents from pendaftaran baharu format', function () {
    // Setup necessary ClassRoom
    $classRoom = ClassRoom::create(['name' => 'Ibnu Sina']);

    // Build sample row conforming to "Pendaftaran Pelajar Baharu" format
    $row = collect([
        'name' => 'Ahmad Daniel',
        'ic_no' => '151101101233',
        'matric' => 'TZ001',
        'm_f' => 'M',
        'class' => 'Ibnu Sina',
        'birth_date' => '2015-11-01',
        'register' => '2026-01-01',
        'name__father_' => 'Mohd Azlan',
        'ic_no__father_' => '750101105431',
        'phone_father' => '0123456789',
        'name__mother_' => 'Siti Aminah',
        'ic_no__mother_' => '780202105432',
        'phone_mother' => '0198765432',
        'status' => 'aktif',
        'intake' => 'Sesi 2026',
        'bil_juzuk' => '5',
    ]);

    $import = new StudentsImport();
    $import->collection(collect([$row]));

    expect($import->imported)->toBe(1);
    expect($import->skipped)->toBe(0);

    // Verify Student in Database
    $student = Student::where('name', 'Ahmad Daniel')->first();
    expect($student)->not->toBeNull();
    expect($student->ic_no)->toBe('151101101233');
    expect($student->matric_no)->toBe('TZ001');
    expect($student->gender)->toBe('M');
    expect($student->class_id)->toBe($classRoom->id);
    expect($student->juzuk_completed)->toBe(5);

    // Verify Father & Mother Accounts & Profiles
    $fatherUser = User::where('email', '750101105431@parent.tahfiz.edu.my')->first();
    expect($fatherUser)->not->toBeNull();
    expect($fatherUser->full_name)->toBe('Mohd Azlan');

    $motherUser = User::where('email', '780202105432@parent.tahfiz.edu.my')->first();
    expect($motherUser)->not->toBeNull();
    expect($motherUser->full_name)->toBe('Siti Aminah');

    // Verify student is linked to both parents
    expect($student->parents)->toHaveCount(2);
});

test('it imports achievement and ai analytics format (Akmal Prima) and links to existing student by name fallback', function () {
    // Create an existing student without an IC or class but with matching name
    $existingStudent = Student::create([
        'name' => 'Fatima Az-Zahra',
        'age' => 12,
        'gender' => 'F',
        'enrolled_date' => '2025-01-01',
        'juzuk_completed' => 2,
    ]);

    // Row conforming to "Akmal Prima" format
    $row = collect([
        'nama_pelajar' => 'Fatima Az-Zahra',
        'umur' => '13',
        'bil_juzuk' => '4',
        'ranking_semasa' => '3',
        'juzuk_semasa' => 'Juzuk 5',
        'purata_sabaq_sehari' => '0.5',
        'target_bil_juz__akhir_jun_' => '6',
        'halaqah_kelas' => 'Mawar',
    ]);

    $import = new StudentsImport();
    $import->collection(collect([$row]));

    expect($import->imported)->toBe(1);

    // Verify existing student was updated, not duplicated
    $allStudents = Student::where('name', 'Fatima Az-Zahra')->get();
    expect($allStudents)->toHaveCount(1);

    $student = $allStudents->first();
    expect($student->juzuk_completed)->toBe(4);
    expect($student->ranking)->toBe(3);

    // Verify Class "Mawar" was auto-created or found
    $mawarClass = ClassRoom::where('name', 'Mawar')->first();
    expect($mawarClass)->not->toBeNull();
    expect($student->class_id)->toBe($mawarClass->id);

    // Verify AIPrediction record was created
    $prediction = AIPrediction::where('student_id', $student->id)->first();
    expect($prediction)->not->toBeNull();
    expect($prediction->performance_trend)->toBe('Baik'); // 0.5 pages = 8 ayat/day which falls in 'Baik' range (5-9)
    expect($prediction->avg_ayah_per_day)->toBe(8); // 0.5 * 15 = 7.5, rounded to 8
    expect($prediction->recommendation)->toContain('Sasaran akhir Jun: 6 Juzuk');
});
