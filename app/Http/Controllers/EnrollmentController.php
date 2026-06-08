<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\EnrollmentSuccessMail;
// use Barryvdh\DomPDF\Facade\Pdf;

class EnrollmentController extends Controller
{
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
     * List all applicants for the Enrollment Hub.
     */
    public function index()
    {
        $applicants = Student::whereIn('status', [
            'PROSPECT', 'SCHEDULED', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'OFFERED', 'WAITING_PAYMENT', 'ENROLLED', 'Pending'
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($applicants);
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
            $updateData['status'] = 'Aktif'; // Match default status in StudentController
            $updateData['enrolled_date'] = now();
            
            // Simple Matric Generation: AKM-YEAR-ID
            $matricNo = 'AKM-' . date('Y') . '-' . str_pad($student->id, 4, '0', STR_PAD_LEFT);
            // Assuming we use 'phone' as a fallback for some unique ID or just rely on DB ID
            // For now, let's just update the status and admission_type
        }

        $student->update($updateData);

        return response()->json(['success' => true, 'student' => $student]);
    }

    public function scheduleInterview(Request $request, $id)
    {
        $validated = $request->validate([
            'interview_date' => 'required|date',
            'interview_time' => 'required',
            'interview_type' => 'required|string', // Online / Bersemuka
            'interview_location' => 'required|string',
        ]);

        $student = Student::findOrFail($id);
        
        $student->update([
            'interview_date' => $validated['interview_date'],
            'interview_time' => $validated['interview_time'],
            'interview_type' => $validated['interview_type'],
            'interview_location' => $validated['interview_location'],
            'status' => 'SCHEDULED'
        ]);

        // Fetch parent email
        $parent = \App\Models\User::find($student->parent_id);
        if ($parent && $parent->email) {
            Mail::to($parent->email)->queue(new \App\Mail\InterviewInvitationMail($student));
        }

        return response()->json([
            'success' => true,
            'message' => 'Temuduga telah dijadualkan dan emel jemputan telah dihantar.',
            'student' => $student
        ]);
    }

    public function parentDecide(Request $request, $id)
    {
        $validated = $request->validate([
            'decision' => 'required|in:ACCEPT,REJECT',
            'notes' => 'nullable|string'
        ]);

        $student = Student::findOrFail($id);
        
        if ($validated['decision'] === 'ACCEPT') {
            $student->update([
                'status' => 'Aktif',
                'admission_type' => 'tetap',
                'enrolled_date' => now(),
                'notes' => $student->notes . "\n[Penjaga]: Setuju dengan tawaran. Pendaftaran disahkan secara automatik."
            ]);
        } else {
            $student->update([
                'status' => 'REJECTED',
                'notes' => $student->notes . "\n[Penjaga]: Menolak tawaran. Sebab: " . ($validated['notes'] ?? '')
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $validated['decision'] === 'ACCEPT' ? 'Tawaran diterima. Sila teruskan dengan pembayaran.' : 'Tawaran ditolak.',
            'student' => $student
        ]);
    }

    /**
     * Update interview marks and final decision.
     */
    public function updateInterview(Request $request, $id)
    {
        $validated = $request->validate([
            'hafazan_mark' => 'required|integer|min:0|max:500',
            'tajwid_mark' => 'required|integer|min:0|max:500',
            'akhlaq_mark' => 'required|integer|min:0|max:500',
            'notes' => 'nullable|string',
            'status' => 'required|in:ACCEPTED,REJECTED'
        ]);

        $student = Student::findOrFail($id);
        $student->update($validated);

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
            $logoData = base64_encode(file_get_contents($logoPath));
            $logoBase64 = 'data:image/png;base64,' . $logoData;
        }

        $data = [
            'logo' => $logoBase64,
            'applicantId' => $applicant->id,
            'applicantName' => $applicant->name,
            'parentName' => $applicant->parent_name,
            'gender' => $applicant->gender,
            'icNo' => $applicant->ic_no,
            'dateApplied' => $applicant->created_at->format('d/m/Y'),
            'marks' => [
                'hafazan' => $applicant->hafazan_mark,
                'tajwid' => $applicant->tajwid_mark,
                'akhlaq' => $applicant->akhlaq_mark,
                'average' => round(($applicant->hafazan_mark + $applicant->tajwid_mark + $applicant->akhlaq_mark) / 3)
            ]
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
        
        // 1. Fetch parent email (user)
        $parent = User::find($applicant->parent_id);
        if (!$parent || !$parent->email) {
            return response()->json(['success' => false, 'message' => 'E-mel penjaga tidak dijumpai.'], 404);
        }

        // 2. Generate PDF data
        $logoPath = public_path('images/logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoData = base64_encode(file_get_contents($logoPath));
            $logoBase64 = 'data:image/png;base64,' . $logoData;
        }

        $data = [
            'logo' => $logoBase64,
            'applicantId' => $applicant->id,
            'applicantName' => $applicant->name,
            'parentName' => $applicant->parent_name,
            'gender' => $applicant->gender,
            'icNo' => $applicant->ic_no,
            'dateApplied' => $applicant->created_at->format('d/m/Y'),
            'marks' => [
                'hafazan' => $applicant->hafazan_mark,
                'tajwid' => $applicant->tajwid_mark,
                'akhlaq' => $applicant->akhlaq_mark,
                'average' => round(($applicant->hafazan_mark + $applicant->tajwid_mark + $applicant->akhlaq_mark) / 3)
            ]
        ];

        try {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.offer_letter', $data);
            $pdfData = $pdf->output();

            // 3. Send Email
            Mail::to($parent->email)->queue(new \App\Mail\OfferLetterMail($applicant, $pdfData));

            // 4. Update status to OFFERED
            $applicant->update(['status' => 'OFFERED']);

            return response()->json([
                'success' => true,
                'message' => 'Surat tawaran telah dihantar ke e-mel: ' . $parent->email
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ralat sistem: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle the guest student enrollment process.
     * Creates both a Parent User and a Student record.
     */
    public function publicRegister(Request $request)
    {
        $validated = $request->validate([
            // Parent Data
            'parentName' => 'required|string|max:255',
            'parentEmail' => 'required|email|unique:users,email',
            'parentPhone' => 'required|string|max:20',
            'parentJob' => 'required|string',
            'parentIncome' => 'required|numeric',
            'password' => 'required|string|min:8',
            // Student Data
            'studentName' => 'required|string|max:255',
            'studentGender' => 'required|in:M,F',
            'studentDob' => 'required|date',
            'studentAge' => 'required|integer',
            'tajwidLevel' => 'nullable|string',
            'hafazanLevel' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated, $request) {
                // 1. Create Parent User
                $parent = User::create([
                    'name' => $validated['parentName'],
                    'email' => $validated['parentEmail'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'parent',
                    'status' => 'pending', // Requires Mudir approval
                    'phone' => $validated['parentPhone'],
                    'job' => $validated['parentJob'],
                    'wage' => $validated['parentIncome'],
                ]);

                // 2. Create Student Record (Interview Phase)
                $student = Student::create([
                    'name' => $validated['studentName'],
                    'gender' => $request->studentGender == 'M' ? 'Lelaki' : 'Perempuan',
                    'dob' => $request->studentDob,
                    'age' => $request->studentAge,
                    'address' => $request->studentAddress,
                    'medical_history' => $request->medicalHistory,
                    'parent_id' => $parent->id, // Link to User.id
                    'parent_name' => $validated['parentName'],
                    'parent_phone' => $validated['parentPhone'],
                    'admission_type' => 'interview',
                    'status' => 'PROSPECT', // Start as Prospect
                    'enrolled_date' => now()->format('Y-m-d'),
                    'intake_juzuk' => 0, // Guest students usually start at 0
                    'notes' => "[Registration] Level: " . ($request->hafazanLevel ?? '0 Juzuk') . " | Tajwid: " . ($request->tajwidLevel ?? 'Asas')
                ]);

                // 3. Send Email berjaya didaftar, menunggu kelulusan mudir
                Mail::to($parent->email)->queue(new EnrollmentSuccessMail($parent, $student));

                return response()->json([
                    'success' => true,
                    'message' => 'Permohonan pendaftaran telah dihantar.',
                    'parent' => $parent->id,
                    'student' => $student->id
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses permohonan: ' . $e->getMessage()
            ], 500);
        }
    }
}
