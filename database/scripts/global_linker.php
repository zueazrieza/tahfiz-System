<?php
use App\Models\User;
use App\Models\Student;

echo "Memulakan Penyelarasan Global untuk Ibu Bapa...\n";

// 1. Dapatkan semua pelajar yang belum ada parent_id yang sah (atau mahu disahkan semula)
$students = Student::all();
$linkedCount = 0;

foreach ($students as $student) {
    // Cari IC bapa/ibu daripada maklumat yang ada (jika parent_ic kosong, kita cuba teka atau biarkan)
    // Dalam kes ini, kita mahu pastikan parent_id adalah ID User yang betul.
    
    if (!$student->parent_ic) {
        // Jika parent_ic belum ada (data lama), kita biarkan buat masa ini atau guna logik nama
        // Tapi Ali Uzair kita dah handle tadi.
        continue;
    }

    $parentUser = User::where('name', $student->parent_ic)
                    ->orWhere('email', $student->parent_ic . '@parent.tahfiz.edu.my')
                    ->first();

    if ($parentUser) {
        $student->parent_id = $parentUser->id;
        $student->save();
        $linkedCount++;
    }
}

echo "Berjaya menghubungkan $linkedCount pelajar kepada akaun penjaga mereka.\n";
echo "Selesai.\n";
