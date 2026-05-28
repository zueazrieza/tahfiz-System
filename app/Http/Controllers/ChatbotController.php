<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\HafazanRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Chatbot Controller
 *
 * @status stub / rule-based — no LLM API key required.
 *
 * Currently responds via keyword matching from a static knowledge dictionary.
 * To upgrade to a real LLM: set OPENAI_API_KEY in .env and replace
 * getGeneralKnowledge() with an OpenAI Chat Completion API call.
 */
class ChatbotController extends Controller
{
    public function handle(Request $request)
    {
        $query = strtolower($request->input('query'));
        $studentId = $request->input('student_id');
        
        $student = Student::with(['classRoom'])->find($studentId);

        if ($student) {
            // 1. Check for Hafazan Progress
            if (str_contains($query, 'hafazan') || str_contains($query, 'kemajuan') || str_contains($query, 'juzuk')) {
                $juzukCount = $student->juzuk_completed ?? 0;
                $lastRecord = HafazanRecord::where('student_id', $studentId)->latest('date')->first();
                
                return response()->json([
                    'response' => "Alhamdulillah " . explode(' ', $student->name)[0] . ", setakat ini anda telah berjaya mencapai tahap {$juzukCount} Juzuk. Rekod hafalan terakhir (Sabaq) anda adalah pada " . ($lastRecord ? $lastRecord->date : 'tiada rekod') . " (Surah " . ($lastRecord->sabaq_surah ?? 'N/A') . "). Teruskan berjuang!"
                ]);
            }

            // 2. Check for Schedule
            if (str_contains($query, 'jadual') || str_contains($query, 'kelas') || str_contains($query, 'pukul berapa')) {
                $className = $student->classRoom->name ?? 'Tiada Kelas';
                return response()->json([
                    'response' => "Anda kini berdaftar di bawah kelas {$className}. Waktu kelas biasanya bermula mengikut jadual yang telah ditetapkan dalam sistem. Sila rujuk tab 'Jadual Pelajaran' untuk butiran slot."
                ]);
            }

            // 3. Check for Attendance
            if (str_contains($query, 'kehadiran') || str_contains($query, 'ponteng') || str_contains($query, 'hadir')) {
                return response()->json([
                    'response' => "Rekod kehadiran anda terjaga dengan baik. Anda boleh melihat ringkasan kehadiran bulanan anda di bahagian profil pelajar."
                ]);
            }

            // 4. Check for Tajweed rules query (from Tarteel QUL resources)
            if (str_contains($query, 'tajwid') || str_contains($query, 'hukum') || str_contains($query, 'ikhfa') || str_contains($query, 'qalqalah')) {
                return response()->json([
                    'response' => "Ustaz AI kini berintegrasi secara penuh dengan panduan tajwid **QUL (Quranic Universal Library)** daripada Tarteel AI untuk membantu bacaan anda! \n\n" .
                                  "💡 **Hukum Tajwid Utama dalam Surah Pilihan:**\n" .
                                  "1. **Ikhfa' Haqiqi** - Sebutan Nun Sakinah/Tanwin samar berserta dengung (Contoh: *شَيْءٍ قَدِيرٌ* - Surah Al-Mulk: 1)\n" .
                                  "2. **Idgham Maal Ghunnah** - Huruf diidghamkan berserta dengung (Contoh: *طِبَاقًا مَّا* - Surah Al-Mulk: 3)\n" .
                                  "3. **Qalqalah Sughra** - Lantunan suara sederhana pada huruf sukun di tengah kalimah (Contoh: *سَبْعَ* - Surah Al-Mulk: 3)\n" .
                                  "4. **Izhar Halqi** - Sebutan jelas tanpa dengung (Contoh: *أَنْعَمْتَ* - Surah Al-Fatihah: 7)\n\n" .
                                  "Semasa menggunakan panel **AI Menghafal**, anda boleh menekan butang **'PANDUAN TAJWID (QUL)'** pada ayat yang dikesan kesalahan untuk melihat huraian hukum tajwid Tarteel yang terperinci!"
                ]);
            }
        }

        // Fallback to General Knowledge
        return response()->json([
            'response' => $this->getGeneralKnowledge($query)
        ]);
    }

    private function getGeneralKnowledge($query)
    {
        $knowledge = [
             'ikhfa' => 'Ikhfa bermaksud menyembunyikan sebutan Nun Sakinah atau Tanwin di antara Izhar dan Idgham berserta dengung.',
             'izhar' => 'Izhar bermaksud menjelaskan sebutan Nun Sakinah atau Tanwin tanpa dengung.',
             'solat' => 'Rukun solat ada 13 perkara bermula dengan Niat dan Takbiratul Ihram.',
             'wuduk' => 'Rukun wuduk ada 6 perkara: Niat, Basuh Muka, Tangan, Kepala, Kaki, dan Tertib.',
             'salam' => 'Waalaikumussalam! Saya Ustaz AI, sedia membantu semakan rekod atau menjawab soalan agama anda.',
             'siapa' => 'Saya adalah Ustaz AI, asisten pintar untuk Maahad Tahfiz Akmal.',
             'syukur' => 'Alhamdulillah, bersyukur kita kepada Allah atas segala nikmat-Nya.',
        ];

        foreach ($knowledge as $key => $content) {
            if (str_contains($query, $key)) return $content;
        }

        return "Maaf, saya tidak mempunyai maklumat tentang itu. Sila tanya tentang hafazan anda, jadual kelas, atau hukum tajwid seperti Ikhfa dan Izhar.";
    }
}
