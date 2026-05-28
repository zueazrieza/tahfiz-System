<?php
use App\Models\User;
use App\Models\Student;
use App\Models\ParentProfile;
use App\Models\Teacher;
use App\Models\ClassRoom;
use App\Models\HafazanRecord;
use App\Models\Attendance;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

echo "Memulakan pembersihan data akademik...\n";

try {
    // Disable foreign key checks for clean truncation
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    echo "Memadam rekod transaksi (Hafazan, Kehadiran, Bayaran)...\n";
    HafazanRecord::truncate();
    Attendance::truncate();
    Payment::truncate();

    echo "Memadam rekod akademik (Pelajar, Kelas)...\n";
    Student::truncate();
    ClassRoom::truncate();

    echo "Memadam profil (Guru, Penjaga)...\n";
    Teacher::truncate();
    ParentProfile::truncate();

    echo "Memadam akaun pengguna (Kecuali Admin)...\n";
    User::where('role', '!=', 'admin')->delete();

    // Enable foreign key checks
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    echo "PEMBERSIHAN SELESAI. Sistem kini kosong dan sedia untuk data baharu.\n";
} catch (\Exception $e) {
    echo "RALAT: " . $e->getMessage() . "\n";
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');
}
