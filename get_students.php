<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::where('name', 'like', '%ADRA ELZARA%')->get();
echo "=== Matching Users (" . $users->count() . ") ===\n";
foreach ($users as $u) {
    echo "User ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Role: {$u->role} | Linked ID: {$u->linked_id}\n";
}

$students = App\Models\Student::where('name', 'like', '%ADRA ELZARA%')->get();
echo "\n=== Matching Students (" . $students->count() . ") ===\n";
foreach ($students as $s) {
    echo "Student ID: {$s->id} | Name: {$s->name} | Class ID: {$s->class_id} | Juzuk: {$s->juzuk_completed}\n";
}
