<?php
use App\Models\User;
use App\Models\ParentProfile;
use App\Models\Student;

echo "Memulakan migrasi data profil penjaga...\n";

// 1. Dapatkan semua user dengan role 'parent'
$parentUsers = User::where('role', 'parent')->get();
$migratedCount = 0;

foreach ($parentUsers as $user) {
    // Cari maklumat tambahan daripada rekod pelajar jika ada
    $student = Student::where('parent_id', $user->id)
                    ->orWhere('parent_name', 'like', '%' . $user->full_name . '%')
                    ->first();
    
    // Cipta profil penjaga
    $profile = ParentProfile::updateOrCreate(
        ['user_id' => $user->id],
        [
            'ic_no' => $user->name, // Username kita set sebagai IC
            'phone' => $user->phone ?: ($student->parent_phone ?? null),
            'address' => $user->address ?? ($student->address ?? null),
            'relationship_type' => 'parent'
        ]
    );
    
    // Kemaskini semua anak untuk merujuk kepada ID profil ini (bukan ID user)
    $affected = Student::where('parent_id', $user->id)->update(['parent_id' => $profile->id]);
    
    $migratedCount++;
    echo "Migrasi profil untuk User ID: {$user->id} -> Parent Profile ID: {$profile->id} ($affected anak dihubungkan)\n";
}

echo "Migrasi data selesai. $migratedCount profil berjaya dicipta.\n";
