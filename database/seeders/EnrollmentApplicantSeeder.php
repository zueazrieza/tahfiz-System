<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Student;
use App\Models\ParentProfile;

class EnrollmentApplicantSeeder extends Seeder
{
    public function run(): void
    {
        $applicants = [
            [
                'name'         => 'Ahmad Firdaus Bin Azman',
                'ic_no'        => '130215081234',
                'gender'       => 'Lelaki',
                'dob'          => '2013-02-15',
                'age'          => 13,
                'father_name'  => 'Azman Bin Salleh',
                'father_phone' => '0123456789',
                'mother_name'  => 'Noraini Binti Hassan',
                'mother_phone' => '0134567890',
                'email'        => 'azman.salleh@gmail.com',
                'parent_ic'    => '820215081111',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Muhammad Aiman Bin Rahim',
                'ic_no'        => '140721082345',
                'gender'       => 'Lelaki',
                'dob'          => '2014-07-21',
                'age'          => 11,
                'father_name'  => 'Rahim Bin Omar',
                'father_phone' => '0112233445',
                'mother_name'  => 'Siti Hajar Binti Ali',
                'mother_phone' => '0145566778',
                'email'        => 'rahim.omar@yahoo.com',
                'parent_ic'    => '810721082222',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Nur Aisyah Binti Faizal',
                'ic_no'        => '150112083456',
                'gender'       => 'Perempuan',
                'dob'          => '2015-01-12',
                'age'          => 10,
                'father_name'  => 'Faizal Bin Ismail',
                'father_phone' => '0177788990',
                'mother_name'  => 'Rohani Binti Ahmad',
                'mother_phone' => '0181122334',
                'email'        => 'faizal.ismail@gmail.com',
                'parent_ic'    => '800112083333',
                'status'       => 'SCHEDULED',
            ],
            [
                'name'         => 'Adam Hakimi Bin Zulkifli',
                'ic_no'        => '160605084567',
                'gender'       => 'Lelaki',
                'dob'          => '2016-06-05',
                'age'          => 9,
                'father_name'  => 'Zulkifli Bin Karim',
                'father_phone' => '0127788990',
                'mother_name'  => 'Marina Binti Rosli',
                'mother_phone' => '0133344556',
                'email'        => 'zulkifli.karim@gmail.com',
                'parent_ic'    => '820605084444',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Nur Iman Binti Razak',
                'ic_no'        => '140318085678',
                'gender'       => 'Perempuan',
                'dob'          => '2014-03-18',
                'age'          => 12,
                'father_name'  => 'Razak Bin Harun',
                'father_phone' => '0114455667',
                'mother_name'  => 'Salmah Binti Yusof',
                'mother_phone' => '0149988776',
                'email'        => 'razak.harun@hotmail.com',
                'parent_ic'    => '810318085555',
                'status'       => 'SCHEDULED',
            ],
            [
                'name'         => 'Danish Haziq Bin Kamal',
                'ic_no'        => '150911086789',
                'gender'       => 'Lelaki',
                'dob'          => '2015-09-11',
                'age'          => 10,
                'father_name'  => 'Kamal Bin Idris',
                'father_phone' => '0176655443',
                'mother_name'  => 'Suraya Binti Osman',
                'mother_phone' => '0185544332',
                'email'        => 'kamal.idris@gmail.com',
                'parent_ic'    => '810911086666',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Siti Nur Qaseh Binti Rizal',
                'ic_no'        => '130428087890',
                'gender'       => 'Perempuan',
                'dob'          => '2013-04-28',
                'age'          => 12,
                'father_name'  => 'Rizal Bin Hassan',
                'father_phone' => '0128899776',
                'mother_name'  => 'Faridah Binti Karim',
                'mother_phone' => '0131122445',
                'email'        => 'rizal.hassan@gmail.com',
                'parent_ic'    => '800428087777',
                'status'       => 'SCHEDULED',
            ],
            [
                'name'         => 'Muhammad Arif Bin Hafiz',
                'ic_no'        => '140830088901',
                'gender'       => 'Lelaki',
                'dob'          => '2014-08-30',
                'age'          => 11,
                'father_name'  => 'Hafiz Bin Rahman',
                'father_phone' => '0116677889',
                'mother_name'  => 'Zuraidah Binti Salleh',
                'mother_phone' => '0142211334',
                'email'        => 'hafiz.rahman@yahoo.com',
                'parent_ic'    => '810830088888',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Nur Alya Binti Kamarul',
                'ic_no'        => '150504089012',
                'gender'       => 'Perempuan',
                'dob'          => '2015-05-04',
                'age'          => 10,
                'father_name'  => 'Kamarul Bin Daud',
                'father_phone' => '0179988771',
                'mother_name'  => 'Hidayah Binti Musa',
                'mother_phone' => '0186677881',
                'email'        => 'kamarul.daud@gmail.com',
                'parent_ic'    => '810504089999',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Izz Danish Bin Shukri',
                'ic_no'        => '160201081123',
                'gender'       => 'Lelaki',
                'dob'          => '2016-02-01',
                'age'          => 9,
                'father_name'  => 'Shukri Bin Ali',
                'father_phone' => '0121234432',
                'mother_name'  => 'Aisyah Binti Omar',
                'mother_phone' => '0139876543',
                'email'        => 'shukri.ali@gmail.com',
                'parent_ic'    => '820201081010',
                'status'       => 'SCHEDULED',
            ],
            [
                'name'         => 'Puteri Balqis Binti Azhar',
                'ic_no'        => '130917082234',
                'gender'       => 'Perempuan',
                'dob'          => '2013-09-17',
                'age'          => 12,
                'father_name'  => 'Azhar Bin Jalil',
                'father_phone' => '0115566778',
                'mother_name'  => 'Roslina Binti Yasin',
                'mother_phone' => '0143344556',
                'email'        => 'azhar.jalil@hotmail.com',
                'parent_ic'    => '800917081111',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Muhammad Luqman Bin Roslan',
                'ic_no'        => '140104083345',
                'gender'       => 'Lelaki',
                'dob'          => '2014-01-04',
                'age'          => 11,
                'father_name'  => 'Roslan Bin Samad',
                'father_phone' => '0174433221',
                'mother_name'  => 'Maznah Binti Zainal',
                'mother_phone' => '0187766554',
                'email'        => 'roslan.samad@gmail.com',
                'parent_ic'    => '810104081212',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Nur Humaira Binti Fadli',
                'ic_no'        => '150726084456',
                'gender'       => 'Perempuan',
                'dob'          => '2015-07-26',
                'age'          => 10,
                'father_name'  => 'Fadli Bin Hamid',
                'father_phone' => '0125678901',
                'mother_name'  => 'Hafsah Binti Ismail',
                'mother_phone' => '0136789012',
                'email'        => 'fadli.hamid@yahoo.com',
                'parent_ic'    => '810726081313',
                'status'       => 'SCHEDULED',
            ],
            [
                'name'         => 'Aiman Syahmi Bin Rahmat',
                'ic_no'        => '160309085567',
                'gender'       => 'Lelaki',
                'dob'          => '2016-03-09',
                'age'          => 9,
                'father_name'  => 'Rahmat Bin Hashim',
                'father_phone' => '0117890123',
                'mother_name'  => 'Norliza Binti Karim',
                'mother_phone' => '0148901234',
                'email'        => 'rahmat.hashim@gmail.com',
                'parent_ic'    => '820309081414',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Nur Amirah Binti Shahrul',
                'ic_no'        => '130611086678',
                'gender'       => 'Perempuan',
                'dob'          => '2013-06-11',
                'age'          => 12,
                'father_name'  => 'Shahrul Bin Hassan',
                'father_phone' => '0179012345',
                'mother_name'  => 'Siti Mariam Binti Ali',
                'mother_phone' => '0180123456',
                'email'        => 'shahrul.hassan@gmail.com',
                'parent_ic'    => '800611081515',
                'status'       => 'SCHEDULED',
            ],
            [
                'name'         => 'Muhammad Haziq Bin Nizam',
                'ic_no'        => '140925087789',
                'gender'       => 'Lelaki',
                'dob'          => '2014-09-25',
                'age'          => 11,
                'father_name'  => 'Nizam Bin Rashid',
                'father_phone' => '0122345678',
                'mother_name'  => 'Rosnah Binti Daud',
                'mother_phone' => '0133456789',
                'email'        => 'nizam.rashid@hotmail.com',
                'parent_ic'    => '810925081616',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Nur Syafiqah Binti Hafzan',
                'ic_no'        => '150217088890',
                'gender'       => 'Perempuan',
                'dob'          => '2015-02-17',
                'age'          => 10,
                'father_name'  => 'Hafzan Bin Iskandar',
                'father_phone' => '0114567890',
                'mother_name'  => 'Zurina Binti Hamzah',
                'mother_phone' => '0145678901',
                'email'        => 'hafzan.iskandar@gmail.com',
                'parent_ic'    => '810217081717',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Adam Rayyan Bin Fuad',
                'ic_no'        => '160814089901',
                'gender'       => 'Lelaki',
                'dob'          => '2016-08-14',
                'age'          => 9,
                'father_name'  => 'Fuad Bin Salleh',
                'father_phone' => '0176789012',
                'mother_name'  => 'Norsyuhada Binti Rahim',
                'mother_phone' => '0187890123',
                'email'        => 'fuad.salleh@yahoo.com',
                'parent_ic'    => '820814081818',
                'status'       => 'SCHEDULED',
            ],
            [
                'name'         => 'Nur Insyirah Binti Rizwan',
                'ic_no'        => '130123081012',
                'gender'       => 'Perempuan',
                'dob'          => '2013-01-23',
                'age'          => 12,
                'father_name'  => 'Rizwan Bin Kadir',
                'father_phone' => '0128901234',
                'mother_name'  => 'Haslina Binti Osman',
                'mother_phone' => '0139012345',
                'email'        => 'rizwan.kadir@gmail.com',
                'parent_ic'    => '800123081919',
                'status'       => 'PROSPECT',
            ],
            [
                'name'         => 'Muhammad Aqil Bin Zamri',
                'ic_no'        => '140507082123',
                'gender'       => 'Lelaki',
                'dob'          => '2014-05-07',
                'age'          => 11,
                'father_name'  => 'Zamri Bin Yusof',
                'father_phone' => '0110123456',
                'mother_name'  => 'Farah Binti Ibrahim',
                'mother_phone' => '0141234567',
                'email'        => 'zamri.yusof@hotmail.com',
                'parent_ic'    => '810507082020',
                'status'       => 'PROSPECT',
            ],
        ];

        foreach ($applicants as $data) {
            // Skip if student IC already exists
            if (Student::where('ic_no', $data['ic_no'])->exists()) {
                continue;
            }

            // Create or find parent user (by email)
            $parentUser = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'     => $data['father_name'],
                    'password' => Hash::make(substr($data['parent_ic'], 0, 12)),
                    'role'     => 'parent',
                    'status'   => 'pending',
                    'phone'    => $data['father_phone'],
                ]
            );

            // Create or find parent profile
            $parentProfile = ParentProfile::firstOrCreate(
                ['user_id' => $parentUser->id],
                [
                    'ic_no'  => $data['parent_ic'],
                    'phone'  => $data['father_phone'],
                ]
            );

            if (!$parentUser->linked_id) {
                $parentUser->update(['linked_id' => $parentProfile->id]);
            }

            $notes = "Nama Ibu: " . $data['mother_name'] . "\nTelefon Ibu: " . $data['mother_phone'];
            $interviewDate = $data['status'] === 'SCHEDULED' ? now()->addDays(rand(3, 21))->format('Y-m-d') : null;
            $interviewTime = $data['status'] === 'SCHEDULED' ? '09:00' : null;

            Student::create([
                'name'           => $data['name'],
                'ic_no'          => $data['ic_no'],
                'gender'         => $data['gender'],
                'dob'            => $data['dob'],
                'age'            => $data['age'],
                'address'        => 'Terengganu',
                'parent_id'      => $parentProfile->id,
                'parent_name'    => $data['father_name'],
                'parent_phone'   => $data['father_phone'],
                'parent_ic'      => $data['parent_ic'],
                'admission_type' => 'interview',
                'status'         => $data['status'],
                'enrolled_date'  => now()->subDays(rand(1, 30))->format('Y-m-d'),
                'intake_juzuk'   => 0,
                'notes'          => $notes,
                'batch'          => now()->year,
                'interview_date' => $interviewDate,
                'interview_time' => $interviewTime,
            ]);
        }

        $this->command->info('✅ 20 enrollment applicants seeded successfully.');
    }
}
