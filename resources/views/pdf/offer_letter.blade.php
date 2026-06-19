<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Surat Tawaran Rasmi – AKMAL</title>
    <style>
        @page { margin: 0cm 0cm; }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            color: #333;
            line-height: 1.6;
            font-size: 13px;
        }

        /* ── Letterhead header ── */
        .lh-header {
            background: linear-gradient(135deg, #0d3d40 0%, #1a5c60 60%, #0d4548 100%);
            padding: 14px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .lh-org-name {
            color: #ffffff;
            font-size: 17px;
            font-weight: 900;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .lh-address {
            color: #a8d8db;
            font-size: 9px;
            line-height: 1.9;
        }
        .lh-logo-col {
            text-align: center;
            min-width: 90px;
        }
        .lh-logo-col img {
            height: 60px;
            object-fit: contain;
            display: block;
            margin: 0 auto 3px;
        }
        .lh-logo-name {
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            line-height: 1.5;
        }
        .lh-reg {
            color: #a8d8db;
            font-size: 8px;
        }

        /* ── Gradient separator ── */
        .lh-separator {
            height: 4px;
            background: linear-gradient(to right, #6FC7CB, #1a5c60, #16a34a);
        }

        /* ── Ref / date row ── */
        .lh-ref-row {
            text-align: right;
            padding: 8px 24px 2px;
            font-size: 10px;
            color: #444;
        }

        /* ── Bismillah ── */
        .lh-bismillah {
            text-align: center;
            font-size: 13px;
            padding: 8px 0 4px;
            font-style: italic;
            color: #444;
            letter-spacing: 0.06em;
        }

        /* ── Document title ── */
        .lh-doc-title {
            text-align: center;
            padding: 4px 24px 6px;
            font-size: 12px;
            font-weight: 800;
            text-decoration: underline;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #0d3d40;
        }

        /* ── Divider ── */
        .lh-rule {
            border-top: 1.5px solid #dde1e4;
            margin: 0 24px 14px;
        }

        /* ── Body content ── */
        .content {
            padding: 0 2.5cm 2.5cm;
        }

        .salutation { font-weight: bold; margin-bottom: 20px; }

        .details-table {
            width: 100%;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            padding: 16px 0;
            margin: 24px 0;
        }
        .details-table td { vertical-align: top; width: 50%; }
        .detail-label { font-size: 10px; color: #999; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
        .detail-value { font-weight: bold; font-size: 15px; color: #1a1a1a; }

        .signatory { margin-top: 48px; }

        /* ── Footer ── */
        .lh-footer {
            position: fixed;
            bottom: 0; left: 0; right: 0;
        }
        .lh-footer-bar {
            background: linear-gradient(135deg, #0d3d40, #1a5c60);
            padding: 10px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .lh-footer-tagline {
            color: #9fd8db;
            font-style: italic;
            font-size: 12px;
            font-weight: 600;
        }
        .lh-footer-brand {
            color: #a8d8db;
            font-size: 9px;
            text-align: right;
        }
    </style>
</head>
<body>

    <!-- ── AKMAL Letterhead ── -->
    <div class="lh-header">
        <div>
            <div class="lh-org-name">AKADEMI AL-QURAN AMALILLAH</div>
            <div class="lh-address">
                Lot 2121, Jalan Tebakang, Kampung Tebakang, 21400 Bukit Payong, Terengganu<br>
                Tel: 013-9482698 &nbsp;&nbsp; E-mel: akademiakmal@gmail.com
            </div>
        </div>
        <div class="lh-logo-col">
            @if($logo)
                <img src="{{ $logo }}" alt="AKMAL Logo">
            @endif
            <div class="lh-logo-name">AKMAL<br>AKADEMI AL-QURAN<br>AMALILLAH</div>
            <div class="lh-reg">202101039561<br>(1439861-X)</div>
        </div>
    </div>
    <div class="lh-separator"></div>

    <div class="lh-ref-row">
        Ruj. Kami: <strong>AKMAL/HQ/AM/AD/02/{{ date('y') }}/{{ str_pad($applicantId, 4, '0', STR_PAD_LEFT) }}</strong><br>
        Tarikh: <strong>{{ date('j') }} {{ config('app.hijri_months', ['', 'Muharam','Safar','Rabiulawal','Rabiulakhir','Jamadilawal','Jamadilakhir','Rejab','Syaaban','Ramadan','Syawal','Zulkaedah','Zulhijah'])[intval(date('n'))] ?? date('F') }} {{ date('Y') }}H / {{ date('j M Y') }}</strong>
    </div>

    <div class="lh-bismillah">- Bismillahirrahmanirrahim -</div>
    <div class="lh-doc-title">Surat Tawaran Rasmi Kemasukan Pelajar</div>
    <div class="lh-rule"></div>

    <!-- ── Body ── -->
    <div class="content">
        <p class="salutation">Kepada Tn/Puan {{ $parentName }},</p>

        <p><strong>PER: TAWARAN KEMASUKAN PELAJAR BAHARU — AKADEMI AL-QURAN AMALILLAH (AKMAL)</strong></p>

        <p>Dengan segala hormatnya, perkara di atas adalah dirujuk.</p>

        <p>2. Pihak <strong>Akademi Al-Quran Amalillah (AKMAL)</strong> dengan sukacitanya memaklumkan bahawa anak Tuan/Puan iaitu <strong>{{ $applicantName }}</strong> telah berjaya dalam sesi temuduga dan ditawarkan tempat untuk mengikuti program pengajian hafazan di akademi kami.</p>

        <p>3. Sehubungan dengan itu, pihak AKMAL berharap agar Tuan/Puan dapat hadir pada tarikh yang ditetapkan bersama dokumen-dokumen asal untuk tujuan pendaftaran.</p>

        <table class="details-table">
            <tr>
                <td>
                    <div class="detail-label">Tarikh Pendaftaran</div>
                    <div class="detail-value">15 JUN 2026</div>
                </td>
                <td>
                    <div class="detail-label">Lokasi</div>
                    <div class="detail-value">KAMPUS AKMAL TERENGGANU</div>
                </td>
            </tr>
        </table>

        <p>4. Walau bagaimanapun, segala maklumat berkaitan pelajar hendaklah dianggap sebagai <strong>maklumat sulit dan terhad</strong> serta tidak boleh didedahkan kepada pihak ketiga tanpa kebenaran bertulis daripada AKMAL.</p>

        <p>5. Pihak AKMAL amat berharap agar penyertaan ini menjadi permulaan yang baik bagi perjalanan tahfiz anak Tuan/Puan. Sebarang pertanyaan bolehlah menghubungi pejabat kami di nombor yang tertera di atas.</p>

        <div class="signatory">
            Yang benar,<br><br><br>
            ___________________________<br>
            <strong>Pihak Pengurusan</strong><br>
            Akademi Al-Quran Amalillah (AKMAL)<br>
            <span style="font-size: 11px; color: #666;">013-9482698 | akademiakmal@gmail.com</span>
        </div>
    </div>

    <!-- ── Footer ── -->
    <div class="lh-footer">
        <div class="lh-footer-bar">
            <div class="lh-footer-tagline">Setahun Menempa Sejarah *</div>
            <div class="lh-footer-brand">
                <strong>AKMAL — Sistem Pengurusan Tahfiz</strong><br>
                Dokumen ini dijana secara elektronik dan sah.
            </div>
        </div>
    </div>

</body>
</html>
