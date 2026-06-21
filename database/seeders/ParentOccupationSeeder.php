<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ParentOccupationSeeder extends Seeder
{
    private function randomPhone(): string
    {
        $prefixes = ['012', '013', '014', '016', '017', '018', '019'];
        $prefix   = $prefixes[array_rand($prefixes)];
        return $prefix . '-' . rand(1000000, 9999999);
    }

    public function run(): void
    {
        $fatherOcc = [
            'Penjawat Awam', 'Guru', 'Doktor', 'Jurutera', 'Polis', 'Tentera',
            'Pengurus', 'Akauntan', 'Usahawan', 'Pemandu', 'Teknisyen',
            'Pegawai Bank', 'Arkitek', 'Peguam', 'Peruncit', 'Juruteknik',
            'Pegawai IT', 'Penolong Pengurus', 'Jurujual', 'Kontraktor',
        ];
        $motherOcc = [
            'Guru', 'Jururawat', 'Penjawat Awam', 'Usahawan', 'Surirumah',
            'Doktor', 'Akauntan', 'Pekerja Swasta', 'Pengurus', 'Farmasis',
            'Pentadbir', 'Pensyarah', 'Peniaga', 'Pembantu Tadbir',
            'Juru Audit', 'Jurupulih Carakerja',
        ];
        $fatherInc = [2500, 3000, 3200, 3500, 4000, 4500, 5000, 5500, 6000, 7000, 8000, 9000, 10000, 12000];
        $motherInc = [0, 1500, 2000, 2500, 3000, 3200, 3500, 4000, 4500, 5000, 6000];
        $sectors   = ['Awam', 'Swasta', 'Sendiri', 'GLC', 'Badan Berkanun', 'NGO'];
        $cities    = ['Kuala Lumpur', 'Shah Alam', 'Subang Jaya', 'Petaling Jaya', 'Klang', 'Ampang',
                      'Seremban', 'Johor Bahru', 'Ipoh', 'Alor Setar', 'Kota Bharu', 'Kuantan',
                      'Kuala Terengganu', 'Georgetown', 'Kota Kinabalu', 'Kuching'];
        $states    = ['SELANGOR', 'KUALA LUMPUR', 'JOHOR', 'PERAK', 'KEDAH', 'KELANTAN',
                      'PAHANG', 'TERENGGANU', 'PULAU PINANG', 'SABAH', 'SARAWAK', 'NEGERI SEMBILAN'];

        // Fill new fathers/mothers with no occupation yet
        $fathers = DB::table('parents')->where('relationship_type', 'father')->whereNull('occupation')->get();
        foreach ($fathers as $f) {
            DB::table('parents')->where('id', $f->id)->update([
                'occupation' => $fatherOcc[array_rand($fatherOcc)],
                'income'     => $fatherInc[array_rand($fatherInc)],
                'sector'     => $sectors[array_rand($sectors)],
                'city'       => $cities[array_rand($cities)],
                'state_name' => $states[array_rand($states)],
                'country'    => 'MAL',
                'phone'      => $this->randomPhone(),
            ]);
        }

        $mothers = DB::table('parents')->where('relationship_type', 'mother')->whereNull('occupation')->get();
        foreach ($mothers as $m) {
            DB::table('parents')->where('id', $m->id)->update([
                'occupation' => $motherOcc[array_rand($motherOcc)],
                'income'     => $motherInc[array_rand($motherInc)],
                'sector'     => $sectors[array_rand($sectors)],
                'city'       => $cities[array_rand($cities)],
                'state_name' => $states[array_rand($states)],
                'country'    => 'MAL',
                'phone'      => $this->randomPhone(),
            ]);
        }

        // Fix empty phone strings (seeded records had phone = "")
        $emptyPhone = DB::table('parents')->where('phone', '')->get();
        foreach ($emptyPhone as $p) {
            DB::table('parents')->where('id', $p->id)->update([
                'phone' => $this->randomPhone(),
            ]);
        }

        // Fill sector/city/state gaps for already-seeded records
        $missing = DB::table('parents')->whereNotNull('occupation')->whereNull('city')->get();
        foreach ($missing as $p) {
            DB::table('parents')->where('id', $p->id)->update([
                'sector'     => $sectors[array_rand($sectors)],
                'city'       => $cities[array_rand($cities)],
                'state_name' => $states[array_rand($states)],
                'country'    => 'MAL',
            ]);
        }

        $this->command->info(
            'Fathers: ' . count($fathers) . ', Mothers: ' . count($mothers) .
            ', Phone fixed: ' . count($emptyPhone) . ', City gaps filled: ' . count($missing)
        );
    }
}
