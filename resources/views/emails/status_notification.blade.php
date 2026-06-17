<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kemaskini Status Permohonan</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #6FC7CB 0%, #5FB3B7 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.025em;
            text-transform: uppercase;
        }
        .content {
            padding: 40px;
        }
        .content h2 {
            color: #1e293b;
            font-size: 20px;
            font-weight: 700;
            margin-top: 0;
        }
        .details {
            background-color: #f1f5f9;
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
        }
        .details-item {
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
        }
        .details-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .details-value {
            font-weight: 700;
            color: #334155;
            font-size: 14px;
        }
        .footer {
            padding: 30px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            background-color: #fdfdfd;
            border-top: 1px solid #f1f5f9;
        }
        .badge {
            display: inline-block;
            padding: 6px 12px;
            background-color: #ffffff;
            color: #5FB3B7;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 11px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #6FC7CB;
            color: #ffffff;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="badge">Sistem Tahfiz Amalillah</div>
            @if($statusType === 'ACCEPTED')
                <h1>Permohonan Diterima</h1>
            @elseif($statusType === 'REJECTED')
                <h1>Keputusan Permohonan</h1>
            @elseif($statusType === 'ENROLLED' || $statusType === 'Aktif')
                <h1>Pendaftaran Pelajar Aktif</h1>
            @else
                <h1>Kemaskini Permohonan</h1>
            @endif
        </div>
        <div class="content">
            <h2>Assalamu'alaikum Wr. Wb.</h2>
            
            @if($statusType === 'ACCEPTED')
                <p>Tahniah! Permohonan pendaftaran anak anda untuk menyertai <strong>Akademi Al-Quran Amalillah</strong> telah diluluskan selepas sesi temuduga penilaian.</p>
            @elseif($statusType === 'REJECTED')
                <p>Terima kasih kerana memohon kemasukan ke <strong>Akademi Al-Quran Amalillah</strong>. Dukacita dimaklumkan bahawa permohonan anak anda belum berjaya buat masa ini.</p>
            @elseif($statusType === 'ENROLLED' || $statusType === 'Aktif')
                <p>Tahniah! Akaun dan status pendaftaran anak anda telah diaktifkan sepenuhnya. Sesi pembelajaran dan halaqah kini telah dijadualkan.</p>
            @else
                <p>Status permohonan anak anda telah dikemaskini dalam sistem kami.</p>
            @endif

            <div class="details">
                <div class="details-item">
                    <span class="details-label">Nama Pelajar:</span>
                    <span class="details-value">{{ $student->name }}</span>
                </div>
                <div class="details-item">
                    <span class="details-label">Status Terkini:</span>
                    <span class="details-value" style="color: #5FB3B7;">
                        @if($statusType === 'ACCEPTED')
                            LULUS TEMUDUGA
                        @elseif($statusType === 'REJECTED')
                            TIDAK BERJAYA
                        @elseif($statusType === 'ENROLLED' || $statusType === 'Aktif')
                            AKTIF / BERDAFTAR
                        @else
                            {{ $statusType }}
                        @endif
                    </span>
                </div>
            </div>

            @if($customMessage)
                <p><strong>Ulasan / Catatan Murabbi:</strong></p>
                <blockquote style="border-left: 4px solid #6FC7CB; padding-left: 16px; font-style: italic; color: #475569; margin: 16px 0;">
                    {{ $customMessage }}
                </blockquote>
            @endif

            @if($statusType === 'ACCEPTED')
                <p>Pihak pentadbiran akan menjana dan menghantar Surat Tawaran rasmi berserta butiran yuran pendaftaran tidak lama lagi. Sila pastikan anda log masuk ke portal untuk menyemak maklumat lanjut.</p>
            @endif

            <center>
                <a href="{{ config('app.url') }}" class="button" style="color: #ffffff;">Log Masuk Portal Penjaga</a>
            </center>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Akademi Al-Quran Amalillah. Hak Cipta Terpelihara.<br>
            Pusat Tahfiz Swasta, Selangor, Malaysia.
        </div>
    </div>
</body>
</html>
