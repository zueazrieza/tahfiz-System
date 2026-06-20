<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\ParentProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\EnrollmentSuccessMail;

class EnrollmentController extends Controller
{
    /**
     * Resolve the parent User account from a student record.
     * Handles two storage patterns:
     *   (A) student.parent_id = parents.id  →  lookup via users.linked_id
     *   (B) student.parent_id = users.id    →  old enrollment-flow direct FK
     */
    private function getParentUser(Student $student): ?User
    {
        if ($student->parent_id) {
            // Pattern A: parent_id points to parents table (regular enrolled students)
            $user = User::where('role', 'parent')
                        ->where('linked_id', $student->parent_id)
                        ->first();
            if ($user) return $user;

            // Pattern B: parent_id points directly to users.id (enrollment flow)
            $user = User::where('id', $student->parent_id)
                        ->where('role', 'parent')
                        ->first();
            if ($user) return $user;
        }

        // Pattern C: parent_id is null — match by name or phone stored on student record
        if ($student->parent_name || $student->parent_phone) {
            return User::where('role', 'parent')
                ->where(function ($q) use ($student) {
                    if ($student->parent_name)  $q->orWhere('name',  $student->parent_name);
                    if ($student->parent_phone) $q->orWhere('phone', $student->parent_phone);
                })
                ->first();
        }

        return null;
    }

    /**
     * Send an email safely — log on failure, never crash the request.
     */
    private function sendMail(string $to, $mailable): void
    {
        try {
            Mail::to($to)->send($mailable);
        } catch (\Exception $e) {
            Log::error('Mail send failed to ' . $to . ': ' . $e->getMessage());
        }
    }

    public function getInterviewSchedules()
    {
        $schedules = Student::where('status', 'SCHEDULED')
            ->whereNotNull('interview_date')
            ->orderBy('interview_date', 'asc')
            ->orderBy('interview_time', 'asc')
            ->get();

        return response()->json($schedules);
    }

    /**
     * Admin manually creates a new applicant (without going through public form).
     */
    public function adminCreate(Request $request)
    {
        $validated = $request->validate([
            'studentName'    => 'required|string|max:255',
            'studentIc'      => 'required|string|max:20',
            'studentGender'  => 'required|in:Lelaki,Perempuan',
            'studentDob'     => 'required|date',
            'studentAge'     => 'required|integer|min:1|max:99',
            'studentAddress' => 'required|string',
            'parentName'     => 'required|string|max:255',
            'parentEmail'    => 'required|email',
            'parentPhone'    => 'required|string|max:20',
            'parentIc'       => 'nullable|string|max:20',
            'parentJob'      => 'nullable|string|max:255',
            'quranLevel'     => 'nullable|string|max:255',
            'notes'          => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                // Find or create parent User account
                $parentUser = User::firstOrCreate(
                    ['email' => $validated['parentEmail']],
                    [
                        'name'     => $validated['parentName'],
                        'password' => Hash::make(substr(str_replace(['-', ' '], '', $validated['parentIc'] ?? $validated['parentPhone']), 0, 12)),
                        'role'     => 'parent',
                        'status'   => 'pending',
                        'phone'    => $validated['parentPhone'],
                        'job'      => $validated['parentJob'] ?? '',
                    ]
                );

                // Ensure a parents profile record exists and linked_id is set
                $parentProfile = ParentProfile::firstOrCreate(
                    ['user_id' => $parentUser->id],
                    [
                        'ic_no'        => $validated['parentIc'] ?? null,
                        'occupation'   => $validated['parentJob'] ?? null,
                        'phone'        => $validated['parentPhone'],
                    ]
                );
                if (!$parentUser->linked_id) {
                    $parentUser->update(['linked_id' => $parentProfile->id]);
                }

                $notes = "Didaftarkan oleh Admin.\n"
                       . "Tahap Bacaan Al-Quran: " . ($validated['quranLevel'] ?? 'N/A') . "\n"
                       . ($validated['notes'] ? "Catatan: " . $validated['notes'] : '');

                $student = Student::create([
                    'name'          => $validated['studentName'],
                    'ic_no'         => $validated['studentIc'],
                    'gender'        => $validated['studentGender'],
                    'dob'           => $validated['studentDob'],
                    'age'           => $validated['studentAge'],
                    'address'       => $validated['studentAddress'],
                    'parent_id'     => $parentProfile->id,
                    'parent_name'   => $validated['parentName'],
                    'parent_phone'  => $validated['parentPhone'],
                    'parent_ic'     => $validated['parentIc'] ?? '',
                    'admission_type'=> 'interview',
                    'status'        => 'PROSPECT',
                    'enrolled_date' => now()->format('Y-m-d'),
                    'intake_juzuk'  => 0,
                    'notes'         => $notes,
                    'batch'         => now()->year,
                ]);

                $this->sendMail($parentUser->email, new EnrollmentSuccessMail($parentUser, $student));

                return response()->json([
                    'success' => true,
                    'message' => 'Pelajar berjaya didaftarkan. Emel pengesahan dihantar ke ' . $parentUser->email,
                    'student' => $student,
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendaftarkan pelajar: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List all applicants for the Enrollment Hub.
     */
    public function index()
    {
        $applicants = Student::whereIn('status', [
            'PROSPECT', 'SCHEDULED', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'OFFERED', 'WAITING_PAYMENT', 'ENROLLED', 'Pending'
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($applicants->map(function ($s) {
            $parentUser = $this->getParentUser($s);
            return array_merge($s->toArray(), [
                'parent_email' => $parentUser?->email,
            ]);
        }));
    }

    /**
     * Update applicant status.
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string'
        ]);

        $student = Student::findOrFail($id);

        $updateData = ['status' => $request->status];
        if ($request->status === 'ENROLLED') {
            $updateData['admission_type'] = 'tetap';
            $updateData['status'] = 'Aktif';
            $updateData['enrolled_date'] = now();
        }

        $student->update($updateData);
        $student->refresh();

        // When activated, create student login account if it doesn't exist
        if ($student->status === 'Aktif') {
            $existingUser = User::where('linked_id', $student->id)->where('role', 'student')->first();
            if (!$existingUser) {
                // Use matric number if available (e.g. 25-ABB-00299@tahfiz.com), else fallback to first name
                if (!empty($student->matric_no)) {
                    $emailSlug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', trim($student->matric_no)));
                } else {
                    $nameParts = preg_split('/\s+/', trim($student->name));
                    $emailSlug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '', $nameParts[0]));
                }
                $email = $emailSlug . '@tahfiz.com';
                $base = $email;
                $counter = 1;
                while (User::where('email', $email)->exists()) {
                    $email = str_replace('@', $counter . '@', $base);
                    $counter++;
                }
                User::create([
                    'name'      => $student->name,
                    'email'     => $email,
                    'password'  => Hash::make($student->ic_no ?? 'password'),
                    'role'      => 'student',
                    'linked_id' => $student->id,
                ]);
            }

            $parentUser = $this->getParentUser($student);
            if ($parentUser) {
                $this->sendMail($parentUser->email, new \App\Mail\StatusNotificationMail($student, 'Aktif', 'Pendaftaran anda telah disahkan dan diaktifkan.'));
            }
        }

        return response()->json(['success' => true, 'student' => $student]);
    }

    public function scheduleInterview(Request $request, $id)
    {
        $validated = $request->validate([
            'interview_date'     => 'required|date',
            'interview_time'     => 'required',
            'interview_type'     => 'required|string',
            'interview_location' => 'required|string',
        ]);

        $student = Student::findOrFail($id);

        $student->update([
            'interview_date'     => $validated['interview_date'],
            'interview_time'     => $validated['interview_time'],
            'interview_type'     => $validated['interview_type'],
            'interview_location' => $validated['interview_location'],
            'status'             => 'SCHEDULED',
        ]);

        $parentUser = $this->getParentUser($student);
        if ($parentUser) {
            $this->sendMail($parentUser->email, new \App\Mail\InterviewInvitationMail($student));
        }

        return response()->json([
            'success' => true,
            'message' => 'Temuduga telah dijadualkan' . ($parentUser ? ' dan emel jemputan telah dihantar ke ' . $parentUser->email : ' (emel penjaga tidak dijumpai).'),
            'student' => $student,
        ]);
    }

    public function parentDecide(Request $request, $id)
    {
        $validated = $request->validate([
            'decision' => 'required|in:ACCEPT,REJECT',
            'notes'    => 'nullable|string',
        ]);

        $student = Student::findOrFail($id);

        if ($validated['decision'] === 'ACCEPT') {
            $student->update([
                'status'        => 'Aktif',
                'admission_type'=> 'tetap',
                'enrolled_date' => now(),
                'notes'         => $student->notes . "\n[Penjaga]: Setuju dengan tawaran. Pendaftaran disahkan secara automatik.",
            ]);

            $parentUser = $this->getParentUser($student);
            if ($parentUser) {
                $this->sendMail($parentUser->email, new \App\Mail\StatusNotificationMail($student, 'Aktif', 'Pendaftaran anda telah disahkan dan diaktifkan.'));
            }
        } else {
            $student->update([
                'status' => 'REJECTED',
                'notes'  => $student->notes . "\n[Penjaga]: Menolak tawaran. Sebab: " . ($validated['notes'] ?? ''),
            ]);

            $parentUser = $this->getParentUser($student);
            if ($parentUser) {
                $this->sendMail($parentUser->email, new \App\Mail\StatusNotificationMail($student, 'REJECTED', 'Menolak tawaran.'));
            }
        }

        return response()->json([
            'success' => true,
            'message' => $validated['decision'] === 'ACCEPT' ? 'Tawaran diterima.' : 'Tawaran ditolak.',
            'student' => $student,
        ]);
    }

    /**
     * Update interview marks and final decision.
     */
    public function updateInterview(Request $request, $id)
    {
        $validated = $request->validate([
            'hafazan_mark' => 'required|integer|min:0|max:500',
            'tajwid_mark'  => 'required|integer|min:0|max:500',
            'akhlaq_mark'  => 'required|integer|min:0|max:500',
            'notes'        => 'nullable|string',
            'status'       => 'required|in:ACCEPTED,REJECTED',
        ]);

        $student = Student::findOrFail($id);
        $student->update($validated);

        $parentUser = $this->getParentUser($student);
        if ($parentUser) {
            $this->sendMail($parentUser->email, new \App\Mail\StatusNotificationMail($student, $student->status, $student->notes ?? ''));
        }

        return response()->json(['success' => true, 'student' => $student]);
    }

    /**
     * Generate a professional PDF offer letter for the applicant.
     */
    public function generateOfferLetter($id)
    {
        $applicant = Student::findOrFail($id);

        $logoPath = public_path('images/logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        }

        $data = [
            'logo'          => $logoBase64,
            'applicantId'   => $applicant->id,
            'applicantName' => $applicant->name,
            'parentName'    => $applicant->parent_name,
            'gender'        => $applicant->gender,
            'icNo'          => $applicant->ic_no,
            'dateApplied'   => $applicant->created_at?->format('d/m/Y') ?? '—',
            'marks'         => [
                'hafazan' => $applicant->hafazan_mark,
                'tajwid'  => $applicant->tajwid_mark,
                'akhlaq'  => $applicant->akhlaq_mark,
                'average' => ($applicant->hafazan_mark !== null && $applicant->tajwid_mark !== null && $applicant->akhlaq_mark !== null)
                    ? round(($applicant->hafazan_mark + $applicant->tajwid_mark + $applicant->akhlaq_mark) / 3)
                    : null,
            ],
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.offer_letter', $data);
        return $pdf->download('Surat_Tawaran_' . str_replace(' ', '_', $applicant->name) . '.pdf');
    }

    /**
     * Send official offer letter to parent email with PDF attachment.
     */
    public function sendOfferEmail($id)
    {
        $applicant = Student::findOrFail($id);

        $parentUser = $this->getParentUser($applicant);
        if (!$parentUser || !$parentUser->email) {
            return response()->json(['success' => false, 'message' => 'E-mel penjaga tidak dijumpai. Pastikan penjaga mempunyai akaun pengguna.'], 404);
        }

        $logoPath = public_path('images/logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        }

        $data = [
            'logo'          => $logoBase64,
            'applicantId'   => $applicant->id,
            'applicantName' => $applicant->name,
            'parentName'    => $applicant->parent_name,
            'gender'        => $applicant->gender,
            'icNo'          => $applicant->ic_no,
            'dateApplied'   => $applicant->created_at?->format('d/m/Y') ?? '—',
            'marks'         => [
                'hafazan' => $applicant->hafazan_mark,
                'tajwid'  => $applicant->tajwid_mark,
                'akhlaq'  => $applicant->akhlaq_mark,
                'average' => ($applicant->hafazan_mark !== null && $applicant->tajwid_mark !== null && $applicant->akhlaq_mark !== null)
                    ? round(($applicant->hafazan_mark + $applicant->tajwid_mark + $applicant->akhlaq_mark) / 3)
                    : null,
            ],
        ];

        try {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.offer_letter', $data);
            $pdfDataBase64 = base64_encode($pdf->output());

            Mail::to($parentUser->email)->send(new \App\Mail\OfferLetterMail($applicant, $pdfDataBase64));
            $applicant->update(['status' => 'OFFERED']);

            return response()->json([
                'success' => true,
                'message' => 'Surat tawaran telah dihantar ke e-mel: ' . $parentUser->email,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ralat sistem: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle guest student enrollment process.
     * Creates both a Parent User + parents profile record + Student record.
     */
    public function publicRegister(Request $request)
    {
        $validated = $request->validate([
            'parentName'        => 'required|string|max:255',
            'parentEmail'       => 'required|email|unique:users,email',
            'parentPhone'       => 'required|string|max:20',
            'parentJob'         => 'required|string',
            'parentIncome'      => 'required|string',
            'parentIc'          => 'required|string',
            'parentSpousePhone' => 'nullable|string',
            'password'          => 'required|string|min:8',
            'studentName'       => 'required|string|max:255',
            'studentIc'         => 'required|string',
            'studentGender'     => 'required|string',
            'studentDob'        => 'required|date',
            'studentAge'        => 'required|integer',
            'studentAddress'    => 'required|string',
            'referrer'          => 'nullable|string',
            'state'             => 'nullable|string',
            'applyYear'         => 'nullable|string',
            'applyLocation'     => 'nullable|string',
            'agreeOtherBranch'  => 'nullable|string',
            'interviewDate'     => 'nullable|string',
            'quranLevel'        => 'nullable|string',
            'infoSource'        => 'nullable|string',
            'successReason'     => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated, $request) {
                $incomeText = $validated['parentIncome'];
                $numericWage = 2000.00;
                if (str_contains($incomeText, '2,001') || str_contains($incomeText, '4,000')) {
                    $numericWage = 3000.00;
                } elseif (str_contains($incomeText, '4,001') || str_contains($incomeText, '8,000')) {
                    $numericWage = 6000.00;
                } elseif (str_contains($incomeText, '8,001') || str_contains($incomeText, 'atas')) {
                    $numericWage = 10000.00;
                }

                $gender = in_array(strtolower($validated['studentGender']), ['m', 'lelaki']) ? 'Lelaki' : 'Perempuan';

                // 1. Create Parent User account
                $parentUser = User::create([
                    'name'     => $validated['parentName'],
                    'email'    => $validated['parentEmail'],
                    'password' => Hash::make($validated['password']),
                    'role'     => 'parent',
                    'status'   => 'pending',
                    'phone'    => $validated['parentPhone'],
                    'job'      => $validated['parentJob'],
                    'wage'     => $numericWage,
                ]);

                // 2. Create parents profile record
                $parentProfile = ParentProfile::create([
                    'user_id'  => $parentUser->id,
                    'ic_no'    => $validated['parentIc'],
                    'occupation' => $validated['parentJob'],
                    'income'   => $numericWage,
                    'phone'    => $validated['parentPhone'],
                ]);

                // 3. Link user to parent profile
                $parentUser->update(['linked_id' => $parentProfile->id]);

                $notes = "Referrer: " . ($request->referrer ?? 'N/A') . "\n"
                       . "Negeri: " . ($request->state ?? 'N/A') . "\n"
                       . "No Tel Pasangan: " . ($request->parentSpousePhone ?? 'Tiada') . "\n"
                       . "Lokasi Memohon: " . ($request->applyLocation ?? 'N/A') . "\n"
                       . "Setuju Cawangan Lain: " . ($request->agreeOtherBranch ?? 'N/A') . "\n"
                       . "Pilihan Tarikh Temuduga: " . ($request->interviewDate ?? 'N/A') . "\n"
                       . "Tahap Bacaan Al-Quran: " . ($request->quranLevel ?? 'N/A') . "\n"
                       . "Sumber Maklumat: " . ($request->infoSource ?? 'N/A') . "\n"
                       . "Kenapa Ingin Berjaya: " . ($request->successReason ?? 'N/A');

                // 4. Create Student Record
                $student = Student::create([
                    'name'          => $validated['studentName'],
                    'gender'        => $gender,
                    'dob'           => $validated['studentDob'],
                    'age'           => $validated['studentAge'],
                    'address'       => $validated['studentAddress'],
                    'ic_no'         => $validated['studentIc'],
                    'parent_id'     => $parentProfile->id,
                    'parent_name'   => $validated['parentName'],
                    'parent_phone'  => $validated['parentPhone'],
                    'parent_ic'     => $validated['parentIc'],
                    'family_income' => $incomeText,
                    'batch'         => $request->applyYear ?? '2026',
                    'admission_type'=> 'interview',
                    'status'        => 'PROSPECT',
                    'enrolled_date' => now()->format('Y-m-d'),
                    'intake_juzuk'  => 0,
                    'notes'         => $notes,
                ]);

                // 5. Send confirmation email
                $this->sendMail($parentUser->email, new EnrollmentSuccessMail($parentUser, $student));

                return response()->json([
                    'success' => true,
                    'message' => 'Permohonan pendaftaran telah dihantar.',
                    'parent'  => $parentUser->id,
                    'student' => $student->id,
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses permohonan: ' . $e->getMessage(),
            ], 500);
        }
    }
}
