<?php

namespace AppHttpControllers;

use AppModelsStudent;
use AppModelsHafazanRecord;
use IlluminateHttpRequest;
use IlluminateSupportCarbon;

/**
 * Chatbot Controller - Ustaz AI Persona
 *
 * Fully integrated with the Tahfiz Management System database, providing:
 * - Dynamic context injection
 * - Spontaneous Quiz generation (Kuiz Spontan)
 * - Multi-level Explanations (Penjelasan Berperingkat: Asas & Mendalam)
 * - Strict off-topic guardrails
 * - JAKIM/QUL standard Tajweed syllabus
 */
class ChatbotController extends Controller
{
    public function handle(Request $request)
    {
        $query = strtolower(trim($request->input('query')));
        $studentId = $request->input('student_id');
        
        $student = Student::with(['classRoom'])->find($studentId);

        if (!$student) {
            return response()->json([
                'response' => "Assalamualaikum! Maaf, Ustaz tidak menjumpai rekod pelajar anda dalam sistem. Sila hubungi pentadbir Maahad."
            ]);
        }

        $firstName = explode(' ', $student->name)[0];
        $juzukCount = $student->juzuk_completed ?? 0;
        $ranking = $student->ranking ?? 'Pemula';
        $lastRecord = HafazanRecord::where('student_id', $studentId)->latest('date')->first();

        // ── Feature: Generate Kuiz Spontan (Spontaneous Quiz) ──
        if (str_contains($query, 'kuiz') || str_contains($query, 'quiz') || str_contains($query, 'uji') || str_contains($query, 'soalan') || str_contains($query, 'test')) {
            $quizzes = [
                "Boleh anakku berikan **satu contoh potongan ayat** bagi hukum **Idgham Bila Ghunnah** (tanpa dengung) dalam Surah Al-Baqarah? Cuba jawab, nanti Ustaz semak! 😉",
                "Dalam Surah Al-Mulk ayat 3, terdapat potongan ayat *طِبَاقًا مَّا*. Bolehkah anakku teka apakah **hukum tajwid** bagi potongan ayat tersebut? A) Izhar Halqi, B) Idgham Maal Ghunnah, C) Iqlab. Pilih satu!",
                "Huruf-huruf Qalqalah dikumpulkan dalam kalimah *قُطْبُ جَدٍ*. Antara berikut, yang manakah contoh **Qalqalah Sughra** (lantunan di tengah kalimah)? A) *سَبْعَ*, B) *أَحَدٌ*, C) *الْفَلَقِ*.",
                "Hukum **Iqlab** hanya mempunyai **satu sahaja huruf**. Bolehkah anakku nyatakan apakah huruf tersebut? Ustaz nak tengok anakku ingat atau tidak! 😊"
            ];
            
            // Pick a random quiz based on the user's student ID or date
            $quizIndex = (intval($studentId) + Carbon::now()->second) % count($quizzes);
            $selectedQuiz = $quizzes[$quizIndex];

            return response()->json([
                'response' => "Subhanallah, suka betul Ustaz melihat anakku **{$firstName}** rajin mencuba! 

" .
                              "Mari kita uji kefahaman tajwid anakku dengan **Kuiz Spontan Ustaz AI** hari ini:

" .
                              "📝 **SOALAN KUIZ:**
" .
                              "{$selectedQuiz}

" .
                              "*(Taip jawapan anda di bawah, Ustaz sedia menanti!)*"
            ]);
        }

        // ── Dynamic Context & Greeting Injection ──
        if (empty($query) || $query === 'salam' || $query === 'assalamualaikum' || str_contains($query, 'hello') || str_contains($query, 'hai')) {
            $recentMsg = "";
            if ($lastRecord) {
                $recentMsg = " Ustaz sangat gembira melihat perkembangan hafazan **Surah {$lastRecord->sabaq_surah}** (ayat {$lastRecord->sabaq_from}-{$lastRecord->sabaq_to}) anakku pada tarikh **" . Carbon::parse($lastRecord->date)->format('d/m/Y') . "** yang lalu berjalan lancar! ";
            }

            return response()->json([
                'response' => "Waalaikumussalam w.b.t w.b.t, anakku **{$firstName}**! {$recentMsg}Ustaz bersyukur melihat anakku aktif dalam halaqah hari ini. 

" .
                              "Untuk pengetahuan anakku, setakat ini anda berada di tahap **{$juzukCount} Juzuk** dengan pangkat **{$ranking}**. 

" .
                              "Ada sebarang hukum **tajwid**, **jadual kelas**, atau **motivasi** Al-Quran yang ingin anakku tanyakan kepada Ustaz hari ini? 😊"
            ]);
        }

        // ── Feature: Penjelasan Berperingkat (Multi-level explanation: Asas vs Mendalam)
        $isMendalam = str_contains($query, 'mendalam') || str_contains($query, 'advanced') || str_contains($query, 'terperinci') || str_contains($query, 'detail');
        $isAsas = str_contains($query, 'asas') || str_contains($query, 'basic') || str_contains($query, 'mudah') || str_contains($query, 'simple');

        // ── 1. Check for Hafazan Progress / Personalization
        if (str_contains($query, 'hafazan') || str_contains($query, 'kemajuan') || str_contains($query, 'juzuk') || str_contains($query, 'rekod') || str_contains($query, 'sabaq')) {
            $recentMsg = "tiada rekod tasmik berdaftar lagi";
            if ($lastRecord) {
                $recentMsg = "**Surah {$lastRecord->sabaq_surah}** (Ayat {$lastRecord->sabaq_from} hingga {$lastRecord->sabaq_to}) dengan gred kelancaran **{$lastRecord->sabaq_grade}**";
            }

            return response()->json([
                'response' => "Alhamdulillah, anakku **{$firstName}**, Ustaz telah menyemak rekod pangkalan data TMS anda:

" .
                              "• **Jumlah Juzuk Dihafal:** {$juzukCount} / 30 Juzuk
" .
                              "• **Pangkat Semasa:** {$ranking}
" .
                              "• **Tasmik Terakhir (Sabaq):** {$recentMsg}

" .
                              "Ustaz doakan keluk ingatan anakku sentiasa segar dan diredhai Allah. Kekalkan semangat muraja'ah harian ya!"
            ]);
        }

        // ── 2. Check for Schedule / Classes
        if (str_contains($query, 'jadual') || str_contains($query, 'kelas') || str_contains($query, 'pukul berapa') || str_contains($query, 'slot')) {
            $className = $student->classRoom->name ?? 'Tiada Kelas';
            return response()->json([
                'response' => "Anakku **{$firstName}**, anda kini berdaftar di bawah halaqah **{$className}**.

" .
                              "📅 **Jadual Pembelajaran Halaqah:**
" .
                              "Sila rujuk menu **'Jadual Pelajaran'** pada portal anakku untuk melihat butiran slot masa tasmik, muraja'ah, dan talaqqi bersama Murabbi anda secara terperinci."
            ]);
        }

        // ── 3. Check for Attendance
        if (str_contains($query, 'kehadiran') || str_contains($query, 'ponteng') || str_contains($query, 'hadir')) {
            return response()->json([
                'response' => "Rekod kehadiran kelas halaqah anakku **{$firstName}** dipantau secara rapi di dalam pangkalan data. Anakku boleh menyemak butiran peratusan kehadiran bulanan terus pada menu **'Profil Saya'**."
            ]);
        }

        // ── 4. Detailed Tajweed Rules (Strict Rules of Engagement: Definition, Letters, Quranic Verse Example)
        // Ikhfa' Haqiqi
        if (str_contains($query, 'ikhfa haqiqi') || (str_contains($query, 'ikhfa') && !str_contains($query, 'syafawi') && !str_contains($query, 'mim'))) {
            if ($isMendalam) {
                return response()->json([
                    'response' => "MashaAllah, anakku berminat mendalami hukum **Ikhfa' Haqiqi** secara terperinci! Berikut adalah **Penjelasan Mendalam (Advanced)**:

" .
                                  "Hukum Ikhfa' Haqiqi dibahagikan kepada **3 Peringkat Kelonggaran Makhraj**:
" .
                                  "1. **Ikhfa' Aqrab (Paling Dekat):** Apabila Nun Mati/Tanwin bertemu huruf **ت, د, ط**. Bunyinya hampir lenyap sepenuhnya dan dengung lebih dekat dengan makhraj huruf (dengung tebal pada *ط*). *Contoh:* *مِنْ تَحْتِهَا*.
" .
                                  "2. **Ikhfa' Ab'ad (Paling Jauh):** Apabila bertemu huruf **ق, ك**. Bunyi Nun Mati sangat samar dan makhraj beralih ke pangkal lidah. *Contoh:* *شَيْءٍ قَدِيرٌ*.
" .
                                  "3. **Ikhfa' Ausat (Sederhana):** Melibatkan **10 huruf** selebihnya. Sebutan berada di antara dekat dan jauh (sederhana). *Contoh:* *أَنْفُسَكُمْ*."
                ]);
            }

            return response()->json([
                'response' => "Berikut adalah penjelasan hukum **Ikhfa' Haqiqi** (Tahap: **Asas**) buat anakku:

" .
                              "• **Definisi Ringkas:** Menyembunyikan sebutan *Nun Sakinah (نْ)* atau *Tanwin (ــًــٍــٌ)* di antara Izhar dan Idgham tanpa sabdu berserta dengung (2 harakat) apabila bertemu huruf Ikhfa'.
" .
                              "• **Huruf-Huruf Terlibat (15 Huruf):** 
" .
                              "  **ت (Ta), ث (Tha), ج (Jim), د (Dal), ذ (Dhal), z (Zai), س (Sin), ش (Shin), ص (Sad), ض (Dad), ط (Ta), ظ (Za), ف (Fa), ق (Qaf), ك (Kaf)**.
" .
                              "• **Contoh Potongan Ayat Al-Quran:**
" .
                              "  1. *شَيْءٍ قَدِيرٌ* (Surah Al-Mulk: 1) - Tanwin bertemu huruf *Qaf*
" .
                              "  2. *مِنْ تَحْتِهَا* (Surah Al-Bayyinah: 8) - Nun mati bertemu huruf *Ta*

" .
                              "*(Taip 'ikhfa mendalam' jika anakku mahu penerangan peringkat tinggi!)*"
            ]);
        }

        // Izhar Halqi
        if (str_contains($query, 'izhar halqi') || (str_contains($query, 'izhar') && !str_contains($query, 'syafawi') && !str_contains($query, 'mim'))) {
            if ($isMendalam) {
                return response()->json([
                    'response' => "MashaAllah! Berikut adalah **Penjelasan Mendalam (Advanced)** untuk hukum **Izhar Halqi**:

" .
                                  "Izhar bermaksud 'jelas' dari segi bahasa. Dari segi makhraj, 6 huruf Halqi dibahagikan kepada 3 bahagian kerongkong:
" .
                                  "1. **Pangkal Kerongkong (Aqsal Halq):** Huruf **Hamzah (أ) dan Ha (هـ)**.
" .
                                  "2. **Tengah Kerongkong (Wastul Halq):** Huruf **Ain (ع) dan Ha (ح)**.
" .
                                  "3. **Ujung Kerongkong (Adnal Halq):** Huruf **Ghayn (غ) dan Kha (خ)**.

" .
                                  "Sebutan Nun Mati mestilah dibunyikan dengan jelas dan mantap tanpa dengung tambahan. *Contoh:* *مِنْ خَوْفٍ*."
                ]);
            }

            return response()->json([
                'response' => "Berikut adalah penjelasan hukum **Izhar Halqi** (Tahap: **Asas**) buat anakku:

" .
                              "• **Definisi Ringkas:** Menyebut bunyi *Nun Sakinah (نْ)* atau *Tanwin (ــًــٍــٌ)* dengan jelas, terang dan nyata tanpa dengung apabila bertemu huruf halqi.
" .
                              "• **Huruf-Huruf Terlibat (6 Huruf Halqi):** 
" .
                              "  **أ (Alif/Hamzah), هـ (Ha), ع (Ain), ح (Ha), غ (Ghayn), خ (Kha)**.
" .
                              "• **Contoh Potongan Ayat Al-Quran:**
" .
                              "  1. *أَنْعَمْتَ* (Surah Al-Fatihah: 7) - Nun mati bertemu huruf *Ain*
" .
                              "  2. *مِنْ خَوْفٍ* (Surah Quraysh: 4) - Nun mati bertemu huruf *Kha*

" .
                              "*(Taip 'izhar mendalam' jika anakku mahu penerangan peringkat tinggi!)*"
            ]);
        }

        // Idgham Maal Ghunnah
        if (str_contains($query, 'idgham maal ghunnah') || (str_contains($query, 'idgham') && str_contains($query, 'dengung'))) {
            return response()->json([
                'response' => "Berikut adalah penjelasan hukum **Idgham Maal Ghunnah** buat anakku:

" .
                              "• **Definisi Ringkas:** Memasukkan sebutan *Nun Sakinah (نْ)* atau *Tanwin (ــًــٍــٌ)* ke dalam huruf berikutnya berserta dengung (2 harakat).
" .
                              "• **Huruf-Huruf Terlibat (4 Huruf):** 
" .
                              "  **ي (Ya),  ن (Nun), م (Mim), و (Waw)** (dikumpulkan dalam perkataan *يَنْمُو*).
" .
                              "• **Contoh Potongan Ayat Al-Quran:**
" .
                              "  1. *طِبَاقًا مَّا* (Surah Al-Mulk: 3) - Tanwin bertemu huruf *Mim*
" .
                              "  2. *مَن يَقُولُ* (Surah Al-Baqarah: 8) - Nun mati bertemu huruf *Ya*"
            ]);
        }

        // Idgham Bila Ghunnah
        if (str_contains($query, 'idgham bila ghunnah') || (str_contains($query, 'idgham') && str_contains($query, 'tanpa dengung'))) {
            return response()->json([
                'response' => "Berikut adalah penjelasan hukum **Idgham Bila Ghunnah** buat anakku:

" .
                              "• **Definisi Ringkas:** Memasukkan sebutan *Nun Sakinah (نْ)* atau *Tanwin (ــًــٍــٌ)* ke dalam huruf berikutnya secara sempurna tanpa suara dengung.
" .
                              "• **Huruf-Huruf Terlibat (2 Huruf):** 
" .
                              "  **ل (Lam) dan ر (Ra)**.
" .
                              "• **Contoh Potongan Ayat Al-Quran:**
" .
                              "  1. *غَفُورٌ Rَّحِيمٌ* (Surah Al-Baqarah: 173) - Tanwin bertemu huruf *Ra*
" .
                              "  2. *مِن Lَّdُنْهُ* (Surah Al-Kahfi: 2) - Nun mati bertemu huruf *Lam*"
            ]);
        }

        // Iqlab
        if (str_contains($query, 'iqlab')) {
            return response()->json([
                'response' => "Berikut adalah penjelasan hukum **Iqlab** buat anakku:

" .
                              "• **Definisi Ringkas:** Menukarkan sebutan bunyi *Nun Sakinah (نْ)* atau *Tanwin (ــًــٍــٌ)* menjadi sebutan bunyi huruf *Mim (م)* berserta dengung (2 harakat) apabila bertemu huruf Iqlab.
" .
                              "• **Huruf-Huruf Terlibat (1 Huruf):** 
" .
                              "  **ب (Ba)**.
" .
                              "• **Contoh Potongan Ayat Al-Quran:**
" .
                              "  1. *مِنْ بَعْدِ* (Surah Al-Baqarah: 213) - Nun mati bertemu huruf *Ba*
" .
                              "  2. *سَمِيعٌ بَصِيرٌ* (Surah Al-Isra': 1) - Tanwin bertemu huruf *Ba*"
            ]);
        }

        // Qalqalah
        if (str_contains($query, 'qalqalah')) {
            if ($isMendalam) {
                return response()->json([
                    'response' => "MashaAllah! Mari kita teliti hukum **Qalqalah** secara **Mendalam (Advanced)**:

" .
                                  "Qalqalah (lantunan) dari segi hukum dibahagikan kepada **3 peringkat utama**:
" .
                                  "1. **Qalqalah Sughra (Kecil):** Lantunan paling nipis apabila huruf qalqalah mati asli di tengah ayat. *Contoh:* *سَبْعَ*.
" .
                                  "2. **Qalqalah Kubra (Besar):** Lantunan kuat apabila huruf qalqalah di hujung perkataan dibaca mati kerana waqaf (tiada sabdu). *Contoh:* *خَلَقَ* ketika waqaf.
" .
                                  "3. **Qalqalah Akbar (Paling Besar):** Lantunan paling kuat/berat apabila huruf qalqalah bersabdu di hujung perkataan mati kerana waqaf. *Contoh:* *تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ* (pada perkataan *وَتَبَّ*)."
                ]);
            }

            return response()->json([
                'response' => "Berikut adalah penjelasan hukum **Qalqalah** (Tahap: **Asas**) buat anakku:

" .
                              "• **Definisi Ringkas:** Melantunkan bunyi sebutan apabila huruf Qalqalah mati secara asli (*Sukun*) atau mati kerana dihentikan (*Waqaf*).
" .
                              "• **Huruf-Huruf Terlibat (5 Huruf):** 
" .
                              "  **ق (Qaf), ط (Ta), ب (Ba), ج (Jim), د (Dal)** (dikumpulkan dalam perkataan *قُطْبُ جَدٍ*).
" .
                              "• **Contoh Potongan Ayat Al-Quran:**
" .
                              "  1. *سَبْعَ* (Surah Al-Mulk: 3) - Huruf *Ba* sukun di tengah kalimah (*Qalqalah Sughra*)
" .
                              "  2. *قُلْ هُوَ اللَّهُ أَحَدٌ* (Surah Al-Ikhlas: 1) - Huruf *Dal* di hujung ayat ketika waqaf (*Qalqalah Kubra*)

" .
                              "*(Taip 'qalqalah mendalam' jika anakku mahu penerangan peringkat tinggi!)*"
            ]);
        }

        // Ghunnah
        if (str_contains($query, 'ghunnah') || str_contains($query, 'dengung')) {
            return response()->json([
                'response' => "Berikut adalah penjelasan hukum **Ghunnah Musyaddadah** buat anakku:

" .
                              "• **Definisi Ringkas:** Wajib mendengungkan sebutan (kadar 2 harakat) pada huruf Nun atau Mim yang bersabdu/bersyaddah.
" .
                              "• **Huruf-Huruf Terlibat (2 Huruf):** 
" .
                              "  **نّ (Nun bersabdu) dan مّ (Mim bersabdu)**.
" .
                              "• **Contoh Potongan Ayat Al-Quran:**
" .
                              "  1. *إِنَّ اللَّهَ* (Surah Al-Baqarah: 20) - Nun bersabdu
" .
                              "  2. *ثُمَّ* (Surah Al-Mulk: 4) - Mim bersabdu"
            ]);
        }

        // General Tajweed Dictionary
        if (str_contains($query, 'tajwid') || str_contains($query, 'hukum') || str_contains($query, 'qul') || str_contains($query, 'belajar')) {
            return response()->json([
                'response' => "Ustaz bersedia membantu mengajar anakku **{$firstName}**! 

" .
                              "Sila taip hukum tajwid spesifik yang ingin anakku pelajari:
" .
                              "• **Ikhfa Haqiqi** *(Taip 'ikhfa mendalam' untuk tahap tinggi)*
" .
                              "• **Izhar Halqi**
" .
                              "• **Idgham Maal Ghunnah**
" .
                              "• **Idgham Bila Ghunnah**
" .
                              "• **Iqlab**
" .
                              "• **Qalqalah** *(Taip 'qalqalah mendalam' untuk tahap tinggi)*
" .
                              "• **Ghunnah**

" .
                              "Atau taip **'Kuiz'** jika anakku ingin mencuba kuiz spontan tajwid! 📝"
            ]);
        }

        // ── 5. Islamic Motivation
        if (str_contains($query, 'motivasi') || str_contains($query, 'semangat') || str_contains($query, 'nasihat') || str_contains($query, 'malas') || str_contains($query, 'letih')) {
            return response()->json([
                'response' => "MashaAllah, anakku **{$firstName}** yang disayangi Allah. 

" .
                              "Ingatlah, setiap baris ayat Al-Quran yang anakku baca dan hafal dipenuhi jutaan keberkatan. Rasulullah (ﷺ) bersabda:
" .
                              "*"Sebaik-baik kamu ialah orang yang mempelajari Al-Quran dan mengajarkannya."* (HR Bukhari).

" .
                              "Lelah di dunia ini hanya sementara, mahkota cahaya di syurga menanti anakku dan kedua-dua ibu bapa tersayang di akhirat kelak. Bangunlah dan marilah mulakan muraja'ah dengan memohon perlindungan Allah. Ustaz sentiasa di sini mendoakan anakku! 🌿"
            ]);
        }

        // ── 6. Off-Topic Guardrails (Strict Rule Blocker)
        return response()->json([
            'response' => "Maafkan Ustaz, anakku **{$firstName}**. Ustaz AI hanya boleh membimbing anda dalam hal-hal berkaitan **Al-Quran, hukum tajwid (asas/mendalam), kuiz tajwid, jadual kelas, atau memberikan motivasi Islamik** yang bermanfaat. 

" .
                          "Mari kita kembali fokus kepada keindahan kalam Allah. Sila tanya Ustaz tentang hafazan anda, sebarang hukum tajwid (seperti *Ikhfa* atau *Izhar*), atau taip **'Kuiz'** untuk mencuba soalan tajwid yang menyeronokkan! 😊"
        ]);
    }
}
