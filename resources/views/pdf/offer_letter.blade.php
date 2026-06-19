<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Surat Tawaran Rasmi – AKMAL</title>
    <style>
        @page {
            margin-top: 0;
            margin-bottom: 2cm;
            margin-left: 2cm;
            margin-right: 2cm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #1a1a1a;
            line-height: 1.45;
            margin: 0;
        }

        /* ── Header ── */
        .header-bar {
            background-color: #0d3d40;
            height: 6px;
            margin: 0;
        }
        .header-content {
            padding: 12px 0 10px;
            text-align: center;
            border-bottom: 1px solid #d0d0d0;
            margin-bottom: 10px;
        }
        .header-content img {
            height: 52px;
            display: block;
            margin: 0 auto 5px;
        }
        .org-name {
            font-size: 14px;
            font-weight: 900;
            color: #0d3d40;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .org-sub {
            font-size: 9px;
            color: #555;
            letter-spacing: 0.04em;
        }
        .org-address {
            font-size: 8.5px;
            color: #777;
            margin-top: 3px;
        }

        /* ── Ref row ── */
        .ref-row {
            text-align: right;
            font-size: 9.5px;
            color: #444;
            margin-bottom: 8px;
            line-height: 1.6;
        }

        /* ── Bismillah ── */
        .bismillah {
            text-align: center;
            font-size: 10px;
            font-style: italic;
            color: #555;
            margin-bottom: 6px;
            letter-spacing: 0.05em;
        }

        /* ── Document title ── */
        .doc-title {
            text-align: center;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            text-decoration: underline;
            color: #0d3d40;
            letter-spacing: 0.06em;
            margin-bottom: 12px;
        }

        /* ── Body ── */
        p {
            margin: 0 0 7px 0;
            text-align: justify;
        }

        .salutation {
            font-weight: bold;
            margin-bottom: 6px;
        }

        .per-line {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 8px;
        }

        /* ── Details box ── */
        .details-box {
            border: 1px solid #ccc;
            border-left: 4px solid #0d3d40;
            margin: 10px 0;
            padding: 0;
        }
        .details-box table {
            width: 100%;
            border-collapse: collapse;
        }
        .details-box td {
            padding: 8px 12px;
            vertical-align: top;
            width: 50%;
        }
        .details-box td + td {
            border-left: 1px solid #e0e0e0;
        }
        .detail-label {
            font-size: 8px;
            color: #888;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 2px;
        }
        .detail-value {
            font-size: 12px;
            font-weight: 900;
            color: #0d3d40;
        }

        /* ── Signatory ── */
        .signatory {
            margin-top: 18px;
        }
        .sign-line {
            border-top: 1px solid #333;
            width: 180px;
            margin: 28px 0 3px;
        }

        /* ── Footer ── */
        .footer {
            position: fixed;
            bottom: -1.6cm;
            left: -2cm;
            right: -2cm;
            background-color: #0d3d40;
            padding: 7px 20px;
            font-size: 8px;
        }
        .footer-inner {
            display: table;
            width: 100%;
        }
        .footer-left {
            display: table-cell;
            color: #a8d8db;
            font-style: italic;
        }
        .footer-right {
            display: table-cell;
            text-align: right;
            color: #a8d8db;
        }
    </style>
</head>
<body>

    <div class="header-bar"></div>

    <!-- ── Letterhead ── -->
    <div class="header-content">
        @if($logo)
            <img src="{{ $logo }}" alt="Logo AKMAL">
        @endif
        <div class="org-name">Akademi Al-Quran Amalillah (AKMAL)</div>
        <div class="org-sub">Pusat Pengajian Tahfiz Al-Quran</div>
        <div class="org-address">
            Lot 2121, Jalan Tebakang, Kampung Tebakang, 21400 Bukit Payong, Terengganu
            &nbsp;|&nbsp; Tel: 013-9482698 &nbsp;|&nbsp; E-mel: akademiakmal@gmail.com
        </div>
    </div>

    <!-- ── Ref & Date ── -->
    <div class="ref-row">
        Ruj. Kami: <strong>AKMAL/HQ/AM/AD/02/{{ date('y') }}/{{ str_pad($applicantId, 4, '0', STR_PAD_LEFT) }}</strong><br>
        Tarikh: <strong>{{ date('d/m/Y') }}</strong>
    </div>

    <!-- ── Bismillah & Title ── -->
    <div class="bismillah">Dengan Nama Allah Yang Maha Pemurah Lagi Maha Mengasihani</div>
    <div class="doc-title">Surat Tawaran Rasmi Kemasukan Pelajar</div>

    <!-- ── Recipient ── -->
    <p class="salutation">Kepada Tn/Puan <span style="text-transform:uppercase;">{{ $parentName }}</span>,</p>

    <p class="per-line">PER: TAWARAN KEMASUKAN PELAJAR BAHARU — AKADEMI AL-QURAN AMALILLAH (AKMAL)</p>

    <p>Dengan segala hormatnya, perkara di atas adalah dirujuk.</p>

    <p>2.&nbsp; Pihak <strong>Akademi Al-Quran Amalillah (AKMAL)</strong> dengan sukacitanya memaklumkan bahawa anak Tuan/Puan iaitu <strong style="text-transform:uppercase;">{{ $applicantName }}</strong> telah berjaya dalam sesi temuduga dan ditawarkan tempat untuk mengikuti program pengajian hafazan di akademi kami.</p>

    <p>3.&nbsp; Sehubungan dengan itu, pihak AKMAL berharap agar Tuan/Puan dapat hadir pada tarikh yang ditetapkan bersama dokumen-dokumen asal untuk tujuan pendaftaran.</p>

    <!-- ── Details ── -->
    <div class="details-box">
        <table>
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
    </div>

    <p>4.&nbsp; Walau bagaimanapun, segala maklumat berkaitan pelajar hendaklah dianggap sebagai <strong>maklumat sulit dan terhad</strong> serta tidak boleh didedahkan kepada pihak ketiga tanpa kebenaran bertulis daripada AKMAL.</p>

    <p>5.&nbsp; Pihak AKMAL amat berharap agar penyertaan ini menjadi permulaan yang baik bagi perjalanan tahfiz anak Tuan/Puan. Sebarang pertanyaan bolehlah menghubungi pejabat kami di nombor yang tertera di atas.</p>

    <p>Sekian, terima kasih.</p>

    <!-- ── Signatory ── -->
    <div class="signatory">
        <p>Yang benar,</p>
        <div class="sign-line"></div>
        <strong>Pihak Pengurusan</strong><br>
        Akademi Al-Quran Amalillah (AKMAL)<br>
        <span style="font-size:9px; color:#666;">013-9482698 &nbsp;|&nbsp; akademiakmal@gmail.com</span>
    </div>

    <!-- ── Footer ── -->
    <div class="footer">
        <div class="footer-inner">
            <div class="footer-left">Setahun Menempa Sejarah — AKMAL {{ date('Y') }}</div>
            <div class="footer-right">Dokumen ini dijana secara elektronik dan sah &nbsp;|&nbsp; AKMAL Sistem Pengurusan Tahfiz</div>
        </div>
    </div>

</body>
</html>
