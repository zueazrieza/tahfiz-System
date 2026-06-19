<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rekod Hafazan</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1A4D50 0%, #6FC7CB 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }
        .content { padding: 36px 40px; }
        .greeting { font-size: 16px; color: #334155; margin-bottom: 20px; }
        .student-card { background: linear-gradient(135deg, #f0fdf4, #eff6ff); border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; border: 1px solid #bbf7d0; }
        .student-card .name { font-size: 18px; font-weight: 800; color: #111; margin: 0 0 4px; }
        .student-card .meta { font-size: 13px; color: #6b7280; margin: 0; }
        .session-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 0 0; margin-bottom: 24px; }
        .session-row { display: table-row; }
        .session-cell { display: table-cell; padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        .session-cell:first-child { width: 30%; font-weight: 700; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .badge-mumtaz { background: #dcfce7; color: #16a34a; }
        .badge-jayyid { background: #dbeafe; color: #1d4ed8; }
        .badge-maqbul { background: #fef9c3; color: #a16207; }
        .badge-dhoif  { background: #fee2e2; color: #b91c1c; }
        .badge-none   { background: #f3f4f6; color: #9ca3af; }
        .surah-text { font-size: 14px; font-weight: 600; color: #111; margin-bottom: 4px; }
        .surah-sub  { font-size: 12px; color: #9ca3af; }
        .remarks-box { background: #f8fafc; border-left: 4px solid #6FC7CB; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; color: #334155; font-style: italic; }
        .footer-note { background: #f0fdf4; border-radius: 12px; padding: 16px 20px; font-size: 13px; color: #16a34a; margin-bottom: 24px; }
        .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 0; font-size: 12px; color: #94a3b8; }
        .logo-text { font-weight: 800; color: #1A4D50; font-size: 14px; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>📖 Rekod Hafazan Harian</h1>
        <p>Akademi Al-Quran Amalillah (AKMAL) · {{ \Carbon\Carbon::parse($record->date)->translatedFormat('d F Y') }}</p>
    </div>
    <div class="content">
        <p class="greeting">Assalamualaikum, <strong>{{ $parentName }}</strong>,</p>
        <p style="font-size:14px; color:#6b7280; margin-bottom:20px;">Berikut adalah rekod sesi hafazan anak anda pada hari ini:</p>

        <div class="student-card">
            <p class="name">{{ $student->name }}</p>
            <p class="meta">Matrik: {{ $student->matric_no ?? '—' }} · Jumlah Ayat Hari Ini: <strong>{{ $record->ayah_count ?? 0 }} ayat</strong></p>
        </div>

        <div class="session-grid">
            @php
                $sessions = [
                    ['label' => 'Sabak', 'surah' => $record->sabaq_surah, 'from' => $record->sabaq_from, 'to' => $record->sabaq_to, 'grade' => $record->sabaq_grade],
                    ['label' => 'Sabki', 'surah' => $record->sabaqi_surah, 'from' => $record->sabaqi_from, 'to' => $record->sabaqi_to, 'grade' => $record->sabaqi_grade],
                    ['label' => 'Manzil', 'surah' => $record->manzil_surah, 'from' => $record->manzil_from, 'to' => $record->manzil_to, 'grade' => $record->manzil_grade],
                ];
                $gradeClass = fn($g) => match(true) {
                    in_array($g, ['Mumtaz','Sangat Baik']) => 'badge-mumtaz',
                    in_array($g, ['Jayyid Jiddan','Jayyid','Baik']) => 'badge-jayyid',
                    in_array($g, ['Maqbul','Sederhana']) => 'badge-maqbul',
                    in_array($g, ['Dhoif','Lemah']) => 'badge-dhoif',
                    default => 'badge-none',
                };
            @endphp
            @foreach($sessions as $s)
            <div class="session-row">
                <div class="session-cell">{{ $s['label'] }}</div>
                <div class="session-cell">
                    @if($s['surah'])
                        <div class="surah-text">{{ $s['surah'] }}</div>
                        @if($s['from'] && $s['to'])
                        <div class="surah-sub">Ayat {{ $s['from'] }} – {{ $s['to'] }}</div>
                        @endif
                    @else
                        <div class="surah-sub">—</div>
                    @endif
                    @if($s['grade'])
                    <span class="badge {{ $gradeClass($s['grade']) }}" style="margin-top:6px;">{{ $s['grade'] }}</span>
                    @endif
                </div>
            </div>
            @endforeach
        </div>

        @if($record->remarks)
        <div class="remarks-box">
            💬 <strong>Catatan Murabbi/Murabbiah:</strong> {{ $record->remarks }}
        </div>
        @endif

        <div class="footer-note">
            🌿 Teruskan menyokong anak anda dalam perjalanan hafazan mereka. Doa dan sokongan ibu bapa adalah kekuatan terbesar bagi seorang hafiz/hafizah.
        </div>
    </div>
    <div class="footer">
        <p class="logo-text">AKADEMI AL-QURAN AMALILLAH (AKMAL)</p>
        <p style="margin-top:4px;">E-mel ini dijana secara automatik. Sila hubungi pihak akademi untuk sebarang pertanyaan.</p>
    </div>
</div>
</body>
</html>
