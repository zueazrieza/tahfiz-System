import { useRef, useState, useEffect } from 'react';
import { FileText, Download, BarChart, Loader2 } from 'lucide-react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { useAppStore, getStudentAttendanceRate } from '../../store/AppContext';
import { AKMALLetterhead, AKMALLetterFooter } from '../shared/AKMALLetterhead';

/* ─── helper: render a hidden "print-ready" div, capture it as PDF ─────────── */
async function captureElementAsPDF(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('Dimensi elemen laporan adalah 0. Pastikan elemen tidak disembunyikan menggunakan display: none.');
  }
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  
  const margin = 12; // 12mm margins on all sides for balanced spacing
  const imgW = pdfW - (margin * 2);
  const imgH = (canvas.height / canvas.width) * imgW;
  
  let heightLeft = imgH;
  let position = margin;
  
  pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
  heightLeft -= (pdfH - (margin * 2));
  
  while (heightLeft > 0) {
    pdf.addPage();
    position = position - pdfH + (margin * 2);
    pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
    heightLeft -= (pdfH - (margin * 2));
  }
  pdf.save(filename);
}

/* ─── Normalize legacy letter grades (A/B/C/D) to descriptive grades ─────── */
function normalizeGrade(grade: string): string {
  const map: Record<string, string> = { A: 'Mumtaz', B: 'Jayyid Jiddan', C: 'Jayyid', D: 'Maqbul', 'Perlu Penambahbaikan': 'Maqbul' };
  return map[grade] ?? grade;
}

/* ─── Printable Hafazan Report ─────────────────────────────────────────────── */
function HafazanPrintView({ state, hafazanData }: { state: any; hafazanData: any[] }) {
  const activeStudents = state.students.filter((s: any) => s.status === 'Aktif').length;
  const records = [...state.hafazanRecords].sort((a: any, b: any) => b.date.localeCompare(a.date));

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#fff', color: '#1a1a1a', width: '780px', fontSize: '11px' }}>
      <AKMALLetterhead docType="Laporan Rekod Hafazan" meta={`Jumlah Rekod: ${state.hafazanRecords.length} | Pelajar Aktif: ${activeStudents}`} />

      <div style={{ padding: '0 20px' }}>

        {/* Summary row */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
          <tbody>
            <tr>
              {[
                { label: 'Jumlah Sesi', value: state.hafazanRecords.length, color: '#15803d' },
                { label: 'Pelajar Aktif', value: activeStudents, color: '#1d4ed8' },
                { label: 'Jumlah Kelas', value: state.classes.length, color: '#6d28d9' },
              ].map(item => (
                <td key={item.label} style={{ border: '1px solid #e5e7eb', padding: '8px 12px', textAlign: 'center', width: '33%' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '9px', color: '#666', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Monthly Trend */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#0d3d40', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '3px solid #15803d', paddingLeft: '7px', marginBottom: '6px' }}>
            Trend Sesi Hafazan (5 Bulan Terkini)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#f0fdf4' }}>
                {['Bulan', 'Sesi Direkod', 'Kadar'].map(h => (
                  <th key={h} style={{ border: '1px solid #d1fae5', padding: '5px 8px', textAlign: 'left', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hafazanData.map((row, i) => {
                const max = Math.max(...hafazanData.map(d => d.sessions), 1);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 600 }}>{row.name}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px' }}>{row.sessions} sesi</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', width: '200px' }}>
                      <div style={{ background: '#e5e7eb', borderRadius: '3px', height: '6px', width: '100%' }}>
                        <div style={{ background: '#15803d', borderRadius: '3px', height: '6px', width: `${Math.round((row.sessions / max) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Records Detail */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#0d3d40', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '3px solid #15803d', paddingLeft: '7px', marginBottom: '6px' }}>
            Butiran Rekod Hafazan Terkini
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#f0fdf4' }}>
                {['Tarikh', 'Pelajar', 'Surah (Sabak)', 'Ayat', 'Gred', 'Catatan'].map(h => (
                  <th key={h} style={{ border: '1px solid #d1fae5', padding: '5px 7px', textAlign: 'left', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 25).map((r: any, i: number) => {
                const student = state.students.find((s: any) => s.id === r.studentId);
                const grade = normalizeGrade(r.sabaq?.grade ?? '—');
                const gradeBg = grade === 'Mumtaz' ? '#dcfce7' : grade === 'Jayyid Jiddan' ? '#ccfbf1' : grade === 'Jayyid' ? '#dbeafe' : '#fef9c3';
                const gradeColor = grade === 'Mumtaz' ? '#15803d' : grade === 'Jayyid Jiddan' ? '#0f766e' : grade === 'Jayyid' ? '#1d4ed8' : '#854d0e';
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px', whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px', fontWeight: 600 }}>{student?.name ?? '—'}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px' }}>{r.sabaq?.surah ?? '—'} ({r.sabaq?.from ?? ''}–{r.sabaq?.to ?? ''})</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px', textAlign: 'center' }}>{r.ayahCount ?? '—'}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px' }}>
                      <span style={{ padding: '1px 5px', borderRadius: '9999px', background: gradeBg, color: gradeColor, fontSize: '9px', fontWeight: 700 }}>{grade}</span>
                    </td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px', color: '#555' }}>{r.remarks || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {records.length > 25 && (
            <div style={{ fontSize: '9px', color: '#888', marginTop: '5px', fontStyle: 'italic' }}>
              * Menunjukkan 25 rekod terkini daripada {records.length} rekod keseluruhan.
            </div>
          )}
        </div>

        <AKMALLetterFooter />
      </div>
    </div>
  );
}

/* ─── Printable Payment Report ─────────────────────────────────────────────── */
function PaymentPrintView({ state }: { state: any }) {
  const total   = state.payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const paid    = state.payments.filter((p: any) => p.status === 'Dibayar').reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const pending = total - paid;
  const sorted  = [...state.payments].sort((a: any, b: any) =>
    `${b.year}-${String(b.month).padStart(2,'0')}`.localeCompare(`${a.year}-${String(a.month).padStart(2,'0')}`)
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#fff', color: '#1a1a1a', width: '780px', fontSize: '11px' }}>
      <AKMALLetterhead docType="Laporan Pembayaran" meta={`Jumlah Invois: ${state.payments.length}`} />

      <div style={{ padding: '0 20px' }}>

        {/* Summary */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
          <tbody>
            <tr>
              {[
                { label: 'Jumlah Bil', value: `RM ${total.toLocaleString()}`, color: '#1a1a1a' },
                { label: 'Terkumpul', value: `RM ${paid.toLocaleString()}`, color: '#15803d' },
                { label: 'Belum Bayar', value: `RM ${pending.toLocaleString()}`, color: '#dc2626' },
                { label: 'Kadar Kutipan', value: total > 0 ? `${Math.round((paid / total) * 100)}%` : '0%', color: '#1d4ed8' },
              ].map(item => (
                <td key={item.label} style={{ border: '1px solid #e5e7eb', padding: '8px 10px', textAlign: 'center', width: '25%' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '9px', color: '#666', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Lejar */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#0d3d40', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '3px solid #1d4ed8', paddingLeft: '7px', marginBottom: '6px' }}>
            Lejar Pembayaran
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#eff6ff' }}>
                {['Pelajar', 'Bulan / Tahun', 'Jumlah (RM)', 'Status', 'Tarikh Akhir', 'Tarikh Bayar'].map(h => (
                  <th key={h} style={{ border: '1px solid #bfdbfe', padding: '5px 7px', textAlign: 'left', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p: any, i: number) => {
                const student  = state.students.find((s: any) => s.id === p.studentId);
                const monthName = new Date(p.year, p.month - 1).toLocaleString('ms-MY', { month: 'long', year: 'numeric' });
                const isPaid    = p.status === 'Dibayar';
                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px', fontWeight: 600 }}>{student?.name ?? '—'}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px' }}>{monthName}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px', fontWeight: 700 }}>{Number(p.amount).toLocaleString()}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px' }}>
                      <span style={{ padding: '1px 6px', borderRadius: '9999px', background: isPaid ? '#dcfce7' : '#fee2e2', color: isPaid ? '#15803d' : '#dc2626', fontSize: '9px', fontWeight: 700 }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px', color: '#555' }}>{p.dueDate ?? '—'}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 7px', color: '#555' }}>{p.paidDate ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#eff6ff', fontWeight: 700, fontSize: '10px' }}>
                <td colSpan={2} style={{ border: '1px solid #bfdbfe', padding: '5px 7px' }}>JUMLAH KESELURUHAN</td>
                <td style={{ border: '1px solid #bfdbfe', padding: '5px 7px' }}>RM {total.toLocaleString()}</td>
                <td colSpan={3} style={{ border: '1px solid #bfdbfe', padding: '5px 7px', color: '#15803d' }}>RM {paid.toLocaleString()} dikutip</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <AKMALLetterFooter />
      </div>
    </div>
  );
}

/* ─── Main ViewReports component ────────────────────────────────────────────── */
export function ViewReports() {
  const { state, dispatch } = useAppStore();
  const hafazanPrintRef = useRef<HTMLDivElement>(null);
  const paymentPrintRef = useRef<HTMLDivElement>(null);
  const [generatingHafazan, setGeneratingHafazan] = useState(false);
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, studentsRes, paymentsRes, classesRes, hafazanRes, attendanceRes] = await Promise.all([
          axios.get('/api/reports/weekly'),
          axios.get('/api/students'),
          axios.get('/api/payments'),
          axios.get('/api/classes'),
          axios.get('/api/hafazan-records'),
          axios.get('/api/attendance')
        ]);
        if (Array.isArray(reportsRes.data)) setWeeklyReports(reportsRes.data);
        if (Array.isArray(studentsRes.data)) dispatch({ type: 'SET_STUDENTS', payload: studentsRes.data });
        if (Array.isArray(paymentsRes.data)) dispatch({ type: 'SET_PAYMENTS', payload: paymentsRes.data });
        if (Array.isArray(classesRes.data)) dispatch({ type: 'SET_CLASSES', payload: classesRes.data });
        if (Array.isArray(hafazanRes.data)) dispatch({ type: 'SET_HAFAZAN_RECORDS', payload: hafazanRes.data });
        if (Array.isArray(attendanceRes.data)) dispatch({ type: 'SET_ATTENDANCE', payload: attendanceRes.data });
      } catch (err) {
        console.error('Failed to fetch reports data', err);
      }
    };
    fetchData();
  }, [dispatch]);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();

  const hafazanData = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 4 + i, 1);
    const m = d.getMonth(); const y = d.getFullYear();
    const sessions = (state.hafazanRecords ?? [])
      .filter((r: any) => { const rd = new Date(r.date); return rd.getMonth() === m && rd.getFullYear() === y; })
      .length;
    return { name: monthNames[m], sessions };
  });

  const attendanceData = (state.classes ?? []).map((cls: any) => {
    // API returns { students: [{id,name,...}] }, MockData uses { studentIds: ['1','2'] }
    const studentIds: string[] = cls.studentIds
      ?? (cls.students ?? []).map((s: any) => String(s.id));
    if (!studentIds.length) return { class: cls.name, rate: 0 };
    const rate = Math.round(
      studentIds.reduce((sum: number, sid: string) => sum + getStudentAttendanceRate(state, sid), 0) / studentIds.length
    );
    return { class: cls.name, rate };
  });

  const downloadHafazanPDF = async () => {
    if (!hafazanPrintRef.current) return;
    setGeneratingHafazan(true);
    try {
      await captureElementAsPDF(hafazanPrintRef.current, `AKMAL_Hafazan_Report_${now.toISOString().slice(0,10)}.pdf`);
    } catch (err: any) {
      console.error('Hafazan PDF Error:', err);
      alert('Gagal menjana PDF Hafazan: ' + (err.message || err));
    } finally {
      setGeneratingHafazan(false);
    }
  };

  const downloadPaymentPDF = async () => {
    if (!paymentPrintRef.current) return;
    setGeneratingPayment(true);
    try {
      await captureElementAsPDF(paymentPrintRef.current, `AKMAL_Payment_Report_${now.toISOString().slice(0,10)}.pdf`);
    } catch (err: any) {
      console.error('Payment PDF Error:', err);
      alert('Gagal menjana PDF Pembayaran: ' + (err.message || err));
    } finally {
      setGeneratingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Lihat Laporan</h2>
          <p className="text-gray-600 mt-1">Analitik daripada data sistem langsung — eksport sebagai PDF</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadHafazanPDF}
            disabled={generatingHafazan}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generatingHafazan
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Menjana…</>
              : <><Download className="w-4 h-4" /> PDF Hafazan</>}
          </button>
          <button
            onClick={downloadPaymentPDF}
            disabled={generatingPayment}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generatingPayment
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Menjana…</>
              : <><Download className="w-4 h-4" /> PDF Pembayaran</>}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Jumlah Rekod Hafazan',    value: state.hafazanRecords.length, color: 'text-green-600', bg: 'bg-green-50', icon: <FileText className="w-6 h-6 text-green-600" /> },
          { label: 'Jumlah Rekod Kehadiran',  value: state.attendance.length,    color: 'text-blue-600',  bg: 'bg-blue-50',  icon: <BarChart className="w-6 h-6 text-blue-600" /> },
          { label: 'Jumlah Laporan Kelas',    value: state.reports.length,       color: 'text-purple-600', bg: 'bg-purple-50', icon: <FileText className="w-6 h-6 text-purple-600" /> },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${c.bg} rounded-lg`}>{c.icon}</div>
              <div>
                <p className="text-sm text-gray-600">{c.label}</p>
                <p className={`text-2xl font-semibold ${c.color}`}>{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hafazan sessions trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sesi Rekod Hafazan (Bulanan)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hafazanData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance by class */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kadar Kehadiran Mengikut Kelas (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="class" stroke="#6b7280" />
            <YAxis domain={[0, 100]} stroke="#6b7280" />
            <Tooltip formatter={(v) => `${Number(v)}%`} />
            <Bar dataKey="rate" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent class reports & Weekly Wins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Laporan Mingguan Terkini
          </h3>
          <div className="space-y-3">
            {weeklyReports.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm text-gray-900">
                      {r.teacher?.name || 'Murabbi/Murabbiah'}
                    </p>
                    <span className="text-xs text-gray-500">{r.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.content}</p>
                  <p className="text-xs text-teal-600 font-bold mt-1">Markah: {r.weekly_score}%</p>
                </div>
              </div>
            ))}
            {weeklyReports.length === 0 && <p className="text-gray-400 text-sm">Tiada laporan mingguan diserahkan lagi.</p>}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 shadow-sm">
          <h3 className="text-lg font-black text-amber-900 mb-4 flex items-center gap-2">
            🏆 Weekly Wins (Minggu Ini)
          </h3>
          {weeklyReports.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-amber-800 mb-4">Murabbi/Murabbiah dengan laporan dan markah KPI tertinggi minggu ini.</p>
              {weeklyReports
                .sort((a, b) => b.weekly_score - a.weekly_score)
                .slice(0, 3)
                .map((r, i) => (
                  <div key={r.id} className="bg-white p-4 rounded-xl border border-amber-100 flex items-center gap-4 shadow-sm">
                    <div className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{r.teacher?.name || 'Murabbi/Murabbiah'}</p>
                      <p className="text-xs text-gray-500">{r.date}</p>
                    </div>
                    <div className="text-xl font-black text-amber-600">{r.weekly_score}%</div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-amber-700 text-sm">Belum ada pemenang minggu ini.</p>
          )}
        </div>
      </div>

      {/* ── Off-screen print containers (invisible, used only for PDF capture) ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '780px', opacity: 0, pointerEvents: 'none', zIndex: -9999, overflow: 'hidden', height: '1px' }}>
        <div ref={hafazanPrintRef} style={{ width: '780px', background: '#ffffff', padding: '24px' }}>
          <HafazanPrintView state={state} hafazanData={hafazanData} />
        </div>
        <div ref={paymentPrintRef} style={{ width: '780px', background: '#ffffff', padding: '24px' }}>
          <PaymentPrintView state={state} />
        </div>
      </div>
    </div>
  );
}
