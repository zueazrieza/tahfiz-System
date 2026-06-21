import { useState, useEffect, useRef } from 'react';
import { Brain, TrendingUp, Calendar, RefreshCw, Users, Download } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import axios from 'axios';
import { ScoreKomponen } from '../shared/ScoreKomponen';
import { ConfirmModal } from '../shared/ConfirmModal';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { AKMALLetterhead, AKMALLetterFooter } from '../shared/AKMALLetterhead';

function StudentPredictionCard({ pred, trendColor }: { pred: any; trendColor: (t: string) => string }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 12;
      const imgW = pdf.internal.pageSize.getWidth() - margin * 2;
      const imgH = (canvas.height / canvas.width) * imgW;
      let left = imgH;
      let pos = margin;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, pos, imgW, imgH);
      left -= pdf.internal.pageSize.getHeight() - margin * 2;
      while (left > 0) {
        pdf.addPage();
        pos = pos - pdf.internal.pageSize.getHeight() + margin * 2;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, pos, imgW, imgH);
        left -= pdf.internal.pageSize.getHeight() - margin * 2;
      }
      pdf.save(`Laporan_AI_${pred.studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (e: any) { alert('Gagal: ' + e.message); }
    finally { setDownloading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{pred.studentName}</h4>
          <p className="text-sm text-gray-600">Kemajuan Semasa: {pred.currentProgress}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${trendColor(pred.performanceTrend)}`}>
            {pred.performanceTrend}
          </span>
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            {downloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            PDF
          </button>
        </div>
      </div>

      <ScoreKomponen sabaq={pred.sabaq_score ?? null} sabki={pred.sabki_score ?? null} manzil={pred.manzil_score ?? null} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <Calendar className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', label: 'Anggaran Khatam', value: pred.estimatedCompletion },
          { icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', label: 'Tahap Keyakinan', value: pred.confidence },
          { icon: <Brain className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', label: 'Purata Ayat/Hari', value: pred.avgAyahPerDay },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`p-2 ${item.bg} rounded-lg`}>{item.icon}</div>
            <div><p className="text-xs text-gray-600">{item.label}</p><p className="text-sm font-semibold text-gray-900">{item.value}</p></div>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>📅 Kadar Kehadiran: <strong>{pred.attendanceRate}</strong></span>
          {pred.ponteng_count > 0 && (
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              pred.ponteng_label === 'Kritikal'        ? 'bg-red-100 text-red-700' :
              pred.ponteng_label === 'Membimbangkan'   ? 'bg-orange-100 text-orange-700' :
                                                        'bg-yellow-100 text-yellow-700'
            }`}>
              🚫 Ponteng: {pred.ponteng_count} sesi ({pred.ponteng_rate}%) — {pred.ponteng_label}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          {(pred.recommendation ?? '').split('\n\n').slice(0, 2).map((section: string, i: number) => {
            const lines = section.split('\n');
            return (
              <div key={i}>
                <p className="font-semibold text-gray-700">{lines[0]}</p>
                {lines.slice(1).filter((l: string) => l.trim()).map((l: string, j: number) => (
                  <p key={j} className="pl-2 text-gray-500">{l}</p>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hidden print view — 680px wide, optimised for 1 A4 page */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '680px', opacity: 0, pointerEvents: 'none', zIndex: -9999, overflow: 'hidden', height: '1px' }}>
        <div ref={printRef} style={{ width: '680px', background: '#fff', fontFamily: 'Arial, sans-serif', color: '#1a1a1a', fontSize: '11px' }}>
          <AKMALLetterhead
            docType="Laporan Ramalan AI Pelajar"
            meta={`Pelajar: ${pred.studentName}`}
          />
          <div style={{ padding: '0 18px' }}>

            {/* Student header */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #e5e7eb', padding: '8px 12px', width: '60%' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#0d3d40' }}>{pred.studentName}</div>
                    <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{pred.currentProgress}</div>
                  </td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6d28d9' }}>{pred.performanceTrend}</div>
                    <div style={{ fontSize: '8px', color: '#666', marginTop: '1px', textTransform: 'uppercase' }}>Trend Prestasi</div>
                  </td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>{pred.confidence}</div>
                    <div style={{ fontSize: '8px', color: '#666', marginTop: '1px', textTransform: 'uppercase' }}>Keyakinan AI</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Scores + details */}
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#0d3d40', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '3px solid #6d28d9', paddingLeft: '6px', marginBottom: '6px' }}>
              Analisis Komponen Hafazan
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '10px' }}>
              <thead>
                <tr style={{ background: '#f5f3ff' }}>
                  {['Komponen', 'Skor', 'Komponen', 'Skor'].map((h, i) => (
                    <th key={i} style={{ border: '1px solid #ddd6fe', padding: '4px 8px', textAlign: 'left', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 700, background: '#fafafa' }}>Sabak (Baharu)</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 700, color: '#1d4ed8' }}>{pred.sabaq_score != null ? `${pred.sabaq_score}%` : '—'}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 700, background: '#fafafa' }}>Anggaran Khatam</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px' }}>{pred.estimatedCompletion}</td>
                </tr>
                <tr style={{ background: '#f9fafb' }}>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 700, background: '#fafafa' }}>Sabki (Ulang Kaji)</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 700, color: '#15803d' }}>{pred.sabki_score != null ? `${pred.sabki_score}%` : '—'}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 700, background: '#fafafa' }}>Kadar Kehadiran</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px' }}>{pred.attendanceRate}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 700, background: '#fafafa' }}>Manzil (Penjagaan)</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 700, color: '#b45309' }}>{pred.manzil_score != null ? `${pred.manzil_score}%` : '—'}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', fontWeight: 700, background: '#fafafa' }}>Purata Ayat/Hari</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px' }}>{pred.avgAyahPerDay}</td>
                </tr>
              </tbody>
            </table>

            {/* Recommendation */}
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#0d3d40', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '3px solid #6d28d9', paddingLeft: '6px', marginBottom: '6px' }}>
              Cadangan & Pelan Tindakan AI
            </div>
            <div style={{ background: '#fafafe', border: '1px solid #ddd6fe', borderLeft: '3px solid #6d28d9', padding: '8px 10px', fontSize: '10px', color: '#374151', lineHeight: 1.6 }}>
              {(pred.recommendation ?? '').split('\n\n').map((section: string, i: number) => {
                const lines = section.split('\n');
                return (
                  <div key={i} style={{ marginBottom: i < ((pred.recommendation ?? '').split('\n\n').length - 1) ? '8px' : 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '10px', marginBottom: '3px', color: '#1d4ed8' }}>{lines[0]}</div>
                    {lines.slice(1).filter((l: string) => l.trim()).map((l: string, j: number) => (
                      <div key={j} style={{ paddingLeft: '8px', marginBottom: '2px' }}>{l}</div>
                    ))}
                  </div>
                );
              })}
            </div>

            <AKMALLetterFooter />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeacherAIPrediction() {
  const { state } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [generateResult, setGenerateResult] = useState<{ ok: boolean; msg: string } | null>(null);


  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const teacherId = authUser.linked_id;

  useEffect(() => {
    if (teacherId) fetchPredictions();
  }, [teacherId]);

  const fetchPredictions = async () => {
    setIsGenerating(true);
    try {
      const classesRes = await axios.get('/api/classes');
      const myClasses = Array.isArray(classesRes.data)
        ? classesRes.data.filter((c: any) => String(c.teacherId) === String(teacherId))
        : [];
      const classIds = myClasses.map((c: any) => String(c.id));

      const allPreds: any[] = [];
      for (const cid of classIds) {
        const resp = await axios.get(`/api/ai-predictions/class/${cid}`);
        allPreds.push(...(Array.isArray(resp.data) ? resp.data : []));
      }

      // Build student name index from API
      const nameIndex: Record<string, string> = {};
      try {
        const studRes = await axios.get(`/api/teacher/students?teacherId=${teacherId}`);
        (Array.isArray(studRes.data) ? studRes.data : []).forEach((s: any) => { nameIndex[String(s.id)] = s.name; });
      } catch {}

      const mapped = allPreds.map(p => ({
        id: p.id,
        studentId: p.student_id,
        studentName: nameIndex[String(p.student_id)] || 'Pelajar',
        currentProgress: p.current_progress,
        estimatedCompletion: p.estimated_completion,
        performanceTrend: p.performance_trend,
        confidence: p.confidence,
        recommendation: p.recommendation,
        attendanceRate: p.attendance_rate,
        avgAyahPerDay: p.avg_ayah_per_day,
        sabaq_score: p.sabaq_score,
        sabki_score: p.sabki_score,
        manzil_score: p.manzil_score,
        ponteng_count: p.ponteng_count ?? 0,
        ponteng_rate: p.ponteng_rate ?? 0,
        ponteng_label: p.ponteng_label ?? null,
      }));

      // If no predictions exist yet, auto-generate for all classes
      if (mapped.length === 0 && classIds.length > 0) {
        for (const cid of classIds) {
          await axios.post(`/api/ai-predictions/generate/class/${cid}`).catch(() => {});
        }
        // Re-fetch after generation
        const allPreds2: any[] = [];
        for (const cid of classIds) {
          const r = await axios.get(`/api/ai-predictions/class/${cid}`).catch(() => ({ data: [] }));
          allPreds2.push(...(Array.isArray(r.data) ? r.data : []));
        }
        const mapped2 = allPreds2.map(p => ({
          id: p.id,
          studentId: p.student_id,
          studentName: nameIndex[String(p.student_id)] || 'Pelajar',
          currentProgress: p.current_progress,
          estimatedCompletion: p.estimated_completion,
          performanceTrend: p.performance_trend,
          confidence: p.confidence,
          recommendation: p.recommendation,
          attendanceRate: p.attendance_rate,
          avgAyahPerDay: p.avg_ayah_per_day,
          sabaq_score: p.sabaq_score,
          sabki_score: p.sabki_score,
          manzil_score: p.manzil_score,
          ponteng_count: p.ponteng_count ?? 0,
          ponteng_rate: p.ponteng_rate ?? 0,
          ponteng_label: p.ponteng_label ?? null,
        }));
        setPredictions(mapped2);
      } else {
        setPredictions(mapped);
      }
      setGenerated(true);
    } catch (err) {
      console.error('Failed to fetch AI predictions', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    setShowGenerateConfirm(true);
  };

  const doGenerate = async () => {
    setShowGenerateConfirm(false);
    setIsGenerating(true);
    try {
      const classesRes = await axios.get('/api/classes');
      const myClasses = Array.isArray(classesRes.data)
        ? classesRes.data.filter((c: any) => String(c.teacherId) === String(teacherId))
        : [];
      for (const c of myClasses) {
        await axios.post(`/api/ai-predictions/generate/class/${c.id}`);
      }
      await fetchPredictions();
      setGenerateResult({ ok: true, msg: 'Ramalan AI telah dijana semula dan disimpan ke pangkalan data.' });
    } catch (err: any) {
      console.error('Failed to generate AI predictions', err);
      setGenerateResult({ ok: false, msg: 'Gagal menjana ramalan AI: ' + (err.response?.data?.message || 'Ralat sambungan.') });
    } finally {
      setIsGenerating(false);
    }
  };

  // UI Derived state — use predictions (from API) not local state for accuracy
  const totalStudents = predictions.length;

  const avgConfidence = predictions.length
    ? Math.round(predictions.reduce((sum, p) => sum + parseInt(p.confidence), 0) / predictions.length)
    : 0;

  const avgJuzuk = predictions.length
    ? Math.round(predictions.reduce((sum, p) => {
        const juzuk = parseInt(p.currentProgress || '0') || 0;
        return sum + juzuk;
      }, 0) / predictions.length)
    : 0;

  const trendColor = (t: string) =>
    t === 'Cemerlang' ? 'bg-green-100 text-green-700' :
    t === 'Baik' ? 'bg-blue-100 text-blue-700' :
    'bg-orange-100 text-orange-700';

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={showGenerateConfirm}
        title="Jana Semula Ramalan AI"
        message="Adakah anda pasti ingin menjana semula ramalan AI untuk semua pelajar dalam kelas anda? Proses ini akan mengambil masa beberapa saat."
        confirmLabel="Ya, Jana Sekarang"
        confirmColor="purple"
        onConfirm={doGenerate}
        onCancel={() => setShowGenerateConfirm(false)}
      />

      {generateResult && (
        <div className={`rounded-xl p-4 text-sm font-medium flex items-center justify-between ${generateResult.ok ? 'bg-green-50 border border-green-300 text-green-800' : 'bg-red-50 border border-red-300 text-red-800'}`}>
          <span>{generateResult.ok ? '✅' : '❌'} {generateResult.msg}</span>
          <button onClick={() => setGenerateResult(null)} className="text-xs opacity-60 hover:opacity-100 ml-4">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Ramalan AI — Pelajar Saya</h2>
          <p className="text-gray-600 mt-1">Anggaran khatam dan trend prestasi pelajar dalam kelas anda</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          {isGenerating ? 'Menganalisis...' : 'Jana Semula'}
        </button>
      </div>

      {/* Overview cards */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-white rounded-lg shadow-sm"><Brain className="w-8 h-8 text-purple-600" /></div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enjin Analisis AI — Kelas Anda</h3>
            <p className="text-gray-700 mb-4">
              Sistem AI menganalisis hafazan, kehadiran, dan pembayaran setiap pelajar untuk memberi cadangan peribadi.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Jumlah Pelajar', value: totalStudents, icon: <Users className="w-5 h-5 text-purple-600" /> },
                { label: 'Purata Ketepatan AI', value: `${avgConfidence}%`, icon: <Brain className="w-5 h-5 text-blue-600" /> },
                { label: 'Purata Juzuk Dihafal', value: `${avgJuzuk} / 30`, icon: <TrendingUp className="w-5 h-5 text-green-600" /> },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-lg p-3 flex items-center gap-3">
                  {m.icon}
                  <div>
                    <p className="text-xs text-gray-600">{m.label}</p>
                    <p className="text-lg font-semibold text-purple-600">{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Refresh banner */}
      {generated && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-green-800 text-sm font-medium">
          ✅ Ramalan AI dikemas kini menggunakan rekod hafazan, data kehadiran, dan sejarah pembayaran terkini.
        </div>
      )}

      {/* Individual predictions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Ramalan Individu Pelajar</h3>
        {isGenerating && (
          <div className="flex items-center justify-center py-12 gap-3 text-purple-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-medium text-sm">Menganalisis data pelajar...</span>
          </div>
        )}
        {!isGenerating && predictions.length === 0 && (
          <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-xl p-10 text-center">
            <Brain className="w-10 h-10 text-purple-300 mx-auto mb-3" />
            <p className="font-bold text-purple-800 mb-1">Tiada Ramalan Dijumpai</p>
            <p className="text-sm text-purple-600 mb-4">Klik butang <strong>Jana Semula</strong> di atas untuk menjana ramalan AI berdasarkan rekod hafazan terkini.</p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors"
            >
              Jana Ramalan Sekarang
            </button>
          </div>
        )}
        {!isGenerating && predictions.map((pred, index) => (
          <StudentPredictionCard key={index} pred={pred} trendColor={trendColor} />
        ))}
      </div>
    </div>
  );
}
