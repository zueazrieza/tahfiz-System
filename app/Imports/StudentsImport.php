<?php

namespace App\Imports;

use App\Models\Student;
use App\Models\User;
use App\Models\ClassRoom;
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
                $icRaw = $this->pick($row, ['ic_no', 'ic', 'no_ic', 'ic_number', 'no_mykad', 4, 18]);
                $icNo  = preg_replace('/[^0-9]/', '', $icRaw);

                // ── Matric No ──
                $matricNo = $this->pick($row, ['matric', 'no_matrik', 'matric_no', 11]);

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
                $dobRaw = $this->pick($row, ['birth_date', 'dob', 'tarikh_lahir', 'date_of_birth', 20]);
                $dob = $this->parseDate($dobRaw);
                if (!$dob && $icNo) {
                    $dob = $this->parseIcDob($icNo);
                }
                $ageRaw = $this->pick($row, ['age', 'umur', 'age_semasa']);
                $age = (is_numeric($ageRaw) && (int)$ageRaw > 0) ? (int)$ageRaw : ($dob ? \Carbon\Carbon::parse($dob)->age : 10);

                // ── Class ──
                $className = $this->pick($row, ['class_2026', 'class_2025', 'class', 'kelas', 'halaqah_kelas', 'halaqahkelas', 15]);
                $classId = null;
                if ($className && $className !== '- None -') {
                    $classRoom = ClassRoom::firstOrCreate(['name' => $className]);
                    $classId = $classRoom->id;
                }

                // ── Dates ──
                $enrolledRaw  = $this->pick($row, ['register', 'enrolled_date', 'tarikh_daftar', 'tarikh_masuk', 'registration_date', 22]);
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
                $intakeJuzukRaw = $this->pick($row, ['intake_juzuk', 'juzuk_awal', 'juzuk']);
                $intakeJuzuk = (is_numeric($intakeJuzukRaw) && (int)$intakeJuzukRaw <= 30) ? (int)$intakeJuzukRaw : 0;
                
                if ($intakeJuzuk === 0 && is_numeric($intake) && (int)$intake <= 30) {
                    $intakeJuzuk = (int)$intake;
                }

                $juzukCompletedRaw = $this->pick($row, ['bil_juzuk', 'bilangan_juzuk', 'juzuk_completed', 'juzuk_tamat']);
                $juzukCompleted = (is_numeric($juzukCompletedRaw) && (int)$juzukCompletedRaw <= 30) ? (int)$juzukCompletedRaw : $intakeJuzuk;

                // ── Ranking ──
                $rankingRaw = $this->pick($row, ['ranking', 'ranking_semasa', 'no_ranking']);
                $ranking = (is_numeric($rankingRaw)) ? (int)$rankingRaw : null;

                // ── Parent info ──
                $fatherName = $this->pick($row, ['name__father_', 'name_father', 'nama_bapa', 'father_name', 26]);
                $fatherIcRaw = $this->pick($row, ['ic_no__father_', 'ic_no_father', 'ic_bapa', 'father_ic', 27]);
                $fatherIc = preg_replace('/[^0-9]/', '', $fatherIcRaw);

                $motherName = $this->pick($row, ['name__mother_', 'name_mother', 'nama_ibu', 'mother_name', 35]);
                $motherIcRaw = $this->pick($row, ['ic_no__mother_', 'ic_no_mother', 'ic_ibu', 'mother_ic', 36]);
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
                    'admission_type'   => 'tetap',
                    'ranking'          => $ranking,
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

                // ── Update AI Prediction directly from imported data ──
                $purataSabaqRaw = $this->pick($row, ['purata_sabaq_sehari', 'purata_sabaq', 'sabaq_sehari', 'purata']);
                $targetBilJuzRaw = $this->pick($row, ['target_bil_juz__akhir_jun_', 'target_bil_juz', 'target_juzuk', 'target_bil_juz_akhir_jun_']);
                $juzukSemasaRaw = $this->pick($row, ['juzuk_semasa', 'juzuk_semasa_']);

                if ($purataSabaqRaw || $targetBilJuzRaw || $juzukSemasaRaw) {
                    $avgAyahPerDay = 5; // Default
                    if (!empty($purataSabaqRaw)) {
                        if (preg_match('/([0-9\.]+)/', $purataSabaqRaw, $matches)) {
                            $val = (float)$matches[1];
                            if ($val > 0) {
                                if ($val < 3) {
                                    $avgAyahPerDay = round($val * 15); // assume pages to ayat
                                } else {
                                    $avgAyahPerDay = round($val);
                                }
                            }
                        }
                    }

                    $remainingJuzuk = 30 - $student->juzuk_completed;
                    $remainingAyat = $remainingJuzuk * 208;
                    $effectiveRate = max($avgAyahPerDay, 0.5);
                    $daysLeft = ceil($remainingAyat / $effectiveRate);
                    $completionDate = \Carbon\Carbon::now()->addDays($daysLeft);

                    $recommendation = "Sasaran akhir Jun: " . ($targetBilJuzRaw ?: '—') . " Juzuk. Purata sabaq sehari: " . ($purataSabaqRaw ?: '—') . ".";
                    if ($juzukSemasaRaw) {
                        $recommendation .= " Sedang menghafal: " . $juzukSemasaRaw . ".";
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
