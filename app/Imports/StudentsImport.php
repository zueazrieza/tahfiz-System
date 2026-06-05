<?php

namespace App\Imports;

use App\Models\Student;
use App\Models\User;
use App\Models\ClassRoom;
use App\Models\Teacher;
use App\Models\ParentProfile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class StudentsImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    public array $errors   = [];
    public int   $imported = 0;
    public int   $skipped  = 0;

    /** Try multiple heading-key variants and return first non-empty value */
    private function pick($row, array $keys, string $default = ''): string
    {
        foreach ($keys as $key) {
            $val = $row[$key] ?? null;
            if ($val !== null && trim((string) $val) !== '') {
                return trim((string) $val);
            }
        }
        return $default;
    }

    /** Parse a date cell — handles Excel serial numbers, "dd-mm-yyyy", "dd/mm/yyyy", "yyyy-mm-dd" etc. */
    private function parseDate($raw): ?string
    {
        $raw = trim((string) $raw);
        if ($raw === '' || $raw === '0' || $raw === '0000-00-00' || str_starts_with($raw, '0000') || $raw === '00-00-0000') {
            return null;
        }

        try {
            if (is_numeric($raw) && (int)$raw > 0) {
                $dateObj = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject((float)$raw);
                return $dateObj->format('Y-m-d');
            }
            if (preg_match('/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/', $raw, $m)) {
                $raw = "{$m[3]}-{$m[2]}-{$m[1]}";
            }
            $parsed = \Carbon\Carbon::parse($raw);
            // Ignore extremely old dates (SQL min date is usually 1000-01-01)
            if ($parsed->year < 1000) return null;
            
            return $parsed->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /** Extract DOB from Malaysian IC number (YYMMDD-PB-###G) */
    private function parseIcDob($ic): ?string
    {
        if (strlen($ic) < 6) return null;
        $yy = substr($ic, 0, 2);
        $mm = substr($ic, 2, 2);
        $dd = substr($ic, 4, 2);

        // Assume if YY > 30, it's 19YY, else 20YY (Adjustable based on student age range)
        $yearPrefix = ((int)$yy > 30) ? '19' : '20';
        $fullYear = $yearPrefix . $yy;

        try {
            $dob = \Carbon\Carbon::createFromDate($fullYear, $mm, $dd);
            return $dob->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    public function collection(Collection $rows)
    {
        // ── 1. Smart Heading Detection (Fallback if WithHeadingRow fails) ──
        if ($rows->isNotEmpty()) {
            $first = $rows->first();
            $keys  = $first->keys()->toArray();
            
            // If all keys are numeric, it means WithHeadingRow didn't find/use headers
            if (count($keys) > 0 && is_numeric($keys[0])) {
                // Try to find the actual header row in the first few rows
                $headerRowIndex = -1;
                $headerMap = [];

                foreach ($rows as $index => $row) {
                    if ($index > 5) break; // Only check first 5 rows
                    
                    $rowValues = array_map(fn($v) => strtoupper(trim((string)$v)), $row->toArray());
                    // Look for common keywords
                    if (in_array('NAMA', $rowValues) || in_array('NAME', $rowValues) || in_array('NO. IC', $rowValues) || in_array('MYKAD', $rowValues)) {
                        $headerRowIndex = $index;
                        // Build a map of slugified-header => numeric-index
                        foreach ($row as $colIdx => $colVal) {
                            $slug = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', trim((string)$colVal)));
                            if ($slug) $headerMap[$slug] = $colIdx;
                        }
                        break;
                    }
                }

                if ($headerRowIndex !== -1) {
                    // Remove rows before and including the header row
                    $rows = $rows->slice($headerRowIndex + 1);
                    
                    // Re-wrap rows so pick() can find them via the new keys
                    $rows = $rows->map(function($row) use ($headerMap) {
                        $newRow = [];
                        foreach ($headerMap as $slug => $idx) {
                            $newRow[$slug] = $row[$idx] ?? null;
                        }
                        // Keep numeric indices as fallback
                        foreach ($row as $idx => $val) {
                            $newRow[$idx] = $val;
                        }
                        return collect($newRow);
                    });
                }
            }
        }

        // DEBUG: show the keys we ended up with
        if ($rows->isNotEmpty()) {
            $this->errors[] = '[DEBUG] Final Keys: ' . implode(' | ', $rows->first()->keys()->filter(fn($k) => !is_numeric($k))->toArray());
        }

        foreach ($rows as $index => $row) {
            $rowNum = $index + 2;

            try {
                // ── Name ──
                unset($fProfile, $mProfile);
                $name = $this->pick($row, ['name', 'nama', 'nama_pelajar', 'student_name', 0, 1]);
                if (empty($name) || $name === 'NAME' || $name === 'NAMA') {
                    $this->skipped++;
                    continue;
                }

                // ── IC No ──
                $icRaw = $this->pick($row, ['no_ic_pelajar', 'ic_no', 'ic', 'no_ic', 'ic_number', 'no_mykad', 4, 18]);
                $icNo  = preg_replace('/[^0-9]/', '', $icRaw);

                // ── Matric No ──
                $matricNo = $this->pick($row, ['no_matrik', 'matric', 'matric_no', 11]);

                // ── Gender ──
                $genderRaw = strtoupper($this->pick($row, ['m_f', 'gender', 'jantina', 'sex', 13], ''));
                if (strlen($genderRaw) === 1) {
                    $gender = in_array($genderRaw, ['F', 'P']) ? 'F' : 'M';
                } else {
                    $nameUpper = strtoupper($name);
                    if (str_contains($nameUpper, 'BINTI') || str_contains($nameUpper, 'BT ') || str_contains($nameUpper, ' BT.')) {
                        $gender = 'F';
                    } elseif (str_contains($nameUpper, 'BIN ') || str_contains($nameUpper, ' B.') || str_contains($nameUpper, ' BN ')) {
                        $gender = 'M';
                    } else {
                        $gender = 'M';
                    }
                }

                // ── DOB & Age ──
                $dobRaw = $this->pick($row, ['tarikh_lahir', 'birth_date', 'dob', 'date_of_birth', 20]);
                $dob = $this->parseDate($dobRaw);
                if (!$dob && $icNo) {
                    $dob = $this->parseIcDob($icNo);
                }
                $ageRaw = $this->pick($row, ['umur', 'age', 'age_semasa']);
                $age = (is_numeric($ageRaw) && (int)$ageRaw > 0) ? (int)$ageRaw : ($dob ? \Carbon\Carbon::parse($dob)->age : 10);

                // ── Class & Teacher (auto-create) ──
                // HALAQAH KELAS is primary, fallback to KELAS 2026
                $className = $this->pick($row, ['halaqah_kelas', 'halaqahkelas', 'kelas_2026', 'class_2026', 'class_2025', 'class', 'kelas', 15]);
                $classId = null;
                if ($className && $className !== '- None -') {
                    // Extract teacher name from "HALAQAH <nama>" pattern
                    $teacher = null;
                    if (str_starts_with(strtoupper($className), 'HALAQAH ')) {
                        $teacherName = trim(substr($className, strlen('HALAQAH ')));
                        if ($teacherName) {
                            $teacher = Teacher::firstOrCreate(
                                ['name' => $teacherName],
                                ['status' => 'Aktif']
                            );
                        }
                    }

                    // If NAMA MURABBI column is present, use it to create/find teacher too
                    $murabbName = $this->pick($row, ['nama_murabbi', 'murabbi', 'nama_guru']);
                    if (!$teacher && $murabbName) {
                        $teacher = Teacher::firstOrCreate(
                            ['name' => $murabbName],
                            ['status' => 'Aktif']
                        );
                    }

                    $classRoom = ClassRoom::firstOrCreate(
                        ['name' => $className],
                        ['teacher_id' => $teacher?->id]
                    );

                    // Assign teacher to existing class if not yet set
                    if ($teacher && !$classRoom->teacher_id) {
                        $classRoom->update(['teacher_id' => $teacher->id]);
                    }

                    $classId = $classRoom->id;
                }

                // ── Dates ──
                $enrolledRaw  = $this->pick($row, ['tarikh_daftar', 'register', 'enrolled_date', 'tarikh_masuk', 'registration_date', 22]);
                $enrolledDate = $this->parseDate($enrolledRaw) ?? now()->format('Y-m-d');

                // ── Status ──
                $statusRaw = $this->pick($row, ['status', 44], 'Aktif');
                $statusMap = [
                    'aktif'    => 'Aktif',
                    'active'   => 'Aktif',
                    'pelajar'  => 'Aktif',
                    'student'  => 'Aktif',
                    'berhenti' => 'Berhenti',
                    'cuti'     => 'Cuti',
                    'hadir'    => 'Aktif',
                ];
                $status = $statusMap[strtolower($statusRaw)] ?? 'Aktif';

                // ── Intake (Session/Year) ──
                $intake = $this->pick($row, ['intake', 'session', 'sesi', 13, 46]);

                // ── Intake Juzuk & Juzuk Completed ──
                $intakeJuzukRaw = $this->pick($row, ['intake_juzuk', 'juzuk_awal']);
                $intakeJuzuk = (is_numeric($intakeJuzukRaw) && (int)$intakeJuzukRaw <= 30) ? (int)$intakeJuzukRaw : 0;

                $juzukCompletedRaw = $this->pick($row, ['bil_juzuk', 'bilangan_juzuk', 'juzuk_completed', 'juzuk_tamat']);
                $juzukCompleted = (is_numeric($juzukCompletedRaw) && (int)$juzukCompletedRaw <= 30) ? (int)$juzukCompletedRaw : $intakeJuzuk;

                // ── Ranking ──
                $rankingRaw = $this->pick($row, ['ranking', 'ranking_semasa', 'no_ranking']);
                if (is_numeric($rankingRaw)) {
                    $ranking = (int)$rankingRaw;
                } else {
                    $rankingMap = [
                        'elite'       => 1,
                        'warrior'     => 2,
                        'challenger'  => 3,
                        'apprentice'  => 4,
                        'beginner'    => 5,
                    ];
                    $ranking = $rankingMap[strtolower($rankingRaw)] ?? null;
                }

                // ── Hafazan fields ──
                $juzukSemasaRaw = $this->pick($row, ['juzuk_semasa']);
                $juzukSemasa = (is_numeric($juzukSemasaRaw) && (int)$juzukSemasaRaw <= 30) ? (int)$juzukSemasaRaw : null;

                $purataSabaqRaw = $this->pick($row, ['purata_sabaq_hari', 'purata_sabaq_sehari', 'purata_sabaq']);
                $purataSabaq = is_numeric($purataSabaqRaw) ? (float)$purataSabaqRaw : null;

                $jenisBacaan = $this->pick($row, ['jenis_bacaan']) ?: null;

                $targetBilJuzRaw = $this->pick($row, ['target_juzuk', 'target_bil_juzuk']);
                $targetBilJuzuk = (is_numeric($targetBilJuzRaw) && (int)$targetBilJuzRaw <= 30) ? (int)$targetBilJuzRaw : null;

                $targetRankingRaw = $this->pick($row, ['target_ranking']);
                $targetRanking = is_numeric($targetRankingRaw) ? (int)$targetRankingRaw : null;

                // ── New fields ──
                $tarikhTamatRaw = $this->pick($row, ['tarikh_tamat', 'tarikh_tamat_2']);
                $tarikhTamat = $this->parseDate($tarikhTamatRaw);

                $batch = $this->pick($row, ['batch']) ?: null;

                $statusKhatam = $this->pick($row, ['status_khatam', 'status khatam']) ?: null;

                // ── Parent info ──
                $fatherName = $this->pick($row, ['nama_bapa', 'name__father_', 'name_father', 'father_name', 26]);
                $fatherIcRaw = $this->pick($row, ['no_ic_bapa', 'ic_no__father_', 'ic_no_father', 'ic_bapa', 'father_ic', 27]);
                $fatherIc = preg_replace('/[^0-9]/', '', $fatherIcRaw);

                $motherName = $this->pick($row, ['nama_ibu', 'name__mother_', 'name_mother', 'mother_name', 35]);
                $motherIcRaw = $this->pick($row, ['no_ic_ibu', 'ic_no__mother_', 'ic_no_mother', 'ic_ibu', 'mother_ic', 36]);
                $motherIc = preg_replace('/[^0-9]/', '', $motherIcRaw);

                // Phone numbers (if available in excel, using common indices)
                $fatherPhone = $this->pick($row, ['phone_father', 'tel_bapa', 28]);
                $motherPhone = $this->pick($row, ['phone_mother', 'tel_ibu', 37]);

                $primaryParentId = null;
                $primaryParentName = null;
                $primaryParentIc = null;
                $primaryParentPhone = null;

                // Handle Father Profile
                if ($fatherIc && strlen($fatherIc) >= 6) {
                    $fUser = User::updateOrCreate(
                        ['email' => $fatherIc . '@parent.tahfiz.edu.my'],
                        [
                            'name'      => $fatherIc,
                            'full_name' => $fatherName ?: 'Bapa ' . $name,
                            'password'  => Hash::make($fatherIc),
                            'role'      => 'parent',
                            'status'    => 'active',
                        ]
                    );
                    $fProfile = ParentProfile::updateOrCreate(
                        ['user_id' => $fUser->id],
                        [
                            'ic_no' => $fatherIc,
                            'phone' => $fatherPhone,
                            'relationship_type' => 'father',
                        ]
                    );
                    $primaryParentId = $fProfile->id;
                    $primaryParentName = $fatherName;
                    $primaryParentIc = $fatherIc;
                    $primaryParentPhone = $fatherPhone;
                }

                // Handle Mother Profile
                if ($motherIc && strlen($motherIc) >= 6) {
                    $mUser = User::updateOrCreate(
                        ['email' => $motherIc . '@parent.tahfiz.edu.my'],
                        [
                            'name'      => $motherIc,
                            'full_name' => $motherName ?: 'Ibu ' . $name,
                            'password'  => Hash::make($motherIc),
                            'role'      => 'parent',
                            'status'    => 'active',
                        ]
                    );
                    $mProfile = ParentProfile::updateOrCreate(
                        ['user_id' => $mUser->id],
                        [
                            'ic_no' => $motherIc,
                            'phone' => $motherPhone,
                            'relationship_type' => 'mother',
                        ]
                    );
                    
                    // If no father was found, set mother as primary
                    if (!$primaryParentId) {
                        $primaryParentId = $mProfile->id;
                        $primaryParentName = $motherName;
                        $primaryParentIc = $motherIc;
                        $primaryParentPhone = $motherPhone;
                    }
                }

                // ── Create/Update Student ──
                $studentData = [
                    'name'             => $name,
                    'ic_no'            => $icNo ?: null,
                    'matric_no'        => $matricNo ?: null,
                    'intake'           => $intake ?: null,
                    'gender'           => $gender,
                    'dob'              => $dob,
                    'age'              => $age,
                    'class_id'         => $classId,
                    'enrolled_date'    => $enrolledDate,
                    'intake_juzuk'     => $intakeJuzuk,
                    'juzuk_completed'  => $juzukCompleted,
                    'status'           => $status,
                    'parent_id'        => $primaryParentId, // Keep for legacy/primary contact
                    'parent_name'      => $primaryParentName ?: null,
                    'parent_ic'        => $primaryParentIc ?: null,
                    'parent_phone'     => $primaryParentPhone ?: null,
                    'admission_type'      => 'tetap',
                    'ranking'             => $ranking,
                    'juzuk_semasa'        => $juzukSemasa,
                    'purata_sabaq_sehari' => $purataSabaq,
                    'jenis_bacaan'        => $jenisBacaan,
                    'target_bil_juzuk'    => $targetBilJuzuk,
                    'target_ranking'      => $targetRanking,
                    'tarikh_tamat'        => $tarikhTamat,
                    'batch'               => $batch,
                    'status_khatam'       => $statusKhatam,
                ];

                $existingStudent = null;
                if ($icNo) {
                    $existingStudent = Student::where('ic_no', $icNo)->first();
                }
                if (!$existingStudent && $name) {
                    $existingStudent = Student::where('name', 'like', trim($name))->first();
                    if (!$existingStudent) {
                        $normalizedName = preg_replace('/\s+/', ' ', trim($name));
                        $existingStudent = Student::whereRaw("LOWER(REPLACE(name, ' ', '')) = LOWER(?)", [str_replace(' ', '', $normalizedName)])->first();
                    }
                }

                if ($existingStudent) {
                    // Don't overwrite some fields if they are null in row but exist in DB
                    if (!$primaryParentId) unset($studentData['parent_id']);
                    if (!$classId) unset($studentData['class_id']);
                    if ($ranking === null) unset($studentData['ranking']);
                    $existingStudent->update($studentData);
                    $student = $existingStudent;
                } else {
                    $student = Student::create($studentData);
                }

                // Link parents in pivot table
                $parentIds = [];
                if (isset($fProfile)) $parentIds[] = $fProfile->id;
                if (isset($mProfile)) $parentIds[] = $mProfile->id;
                
                // If neither found in this row but we have a legacy parent_id from db
                if (empty($parentIds) && $primaryParentId) {
                    $parentIds[] = $primaryParentId;
                }

                $student->parents()->sync($parentIds);

                // ── Update AI Prediction from imported hafazan data ──
                if ($purataSabaq || $targetBilJuzuk || $juzukSemasa) {
                    $avgAyahPerDay = 5;
                    if ($purataSabaq !== null && $purataSabaq > 0) {
                        $avgAyahPerDay = $purataSabaq < 3
                            ? round($purataSabaq * 15)  // pages → ayat
                            : round($purataSabaq);
                    }

                    $remainingJuzuk = 30 - $student->juzuk_completed;
                    $daysLeft = ceil(($remainingJuzuk * 208) / max($avgAyahPerDay, 0.5));
                    $completionDate = \Carbon\Carbon::now()->addDays($daysLeft);

                    $recommendation = "Sasaran: " . ($targetBilJuzuk ?? '—') . " Juzuk. Purata sabaq sehari: " . ($purataSabaq ?? '—') . ".";
                    if ($juzukSemasa) {
                        $recommendation .= " Sedang menghafal: Juzuk {$juzukSemasa}.";
                    }
                    $recommendation .= " Kekalkan momentum untuk mencapai sasaran!";

                    \App\Models\AIPrediction::updateOrCreate(
                        ['student_id' => $student->id],
                        [
                            'current_progress'     => "{$student->juzuk_completed} Juzuk (" . round(($student->juzuk_completed / 30) * 100) . "%)",
                            'estimated_completion' => $completionDate->format('Y-m-d'),
                            'performance_trend'    => $avgAyahPerDay >= 10 ? 'Cemerlang' : ($avgAyahPerDay >= 5 ? 'Baik' : 'Perlu Perhatian'),
                            'confidence'           => '85%',
                            'recommendation'       => $recommendation,
                            'attendance_rate'      => '90%',
                            'avg_ayah_per_day'     => $avgAyahPerDay,
                        ]
                    );
                }

                $this->imported++;
            } catch (\Exception $e) {
                $this->errors[] = "Baris {$rowNum}: " . $e->getMessage();
                $this->skipped++;
            }
        }

        if ($this->imported > 0 && isset($this->errors[0]) && str_starts_with($this->errors[0], '[DEBUG]')) {
            array_shift($this->errors);
        }
    }
}
