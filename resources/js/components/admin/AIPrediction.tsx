import { useState, useEffect, useRef } from 'react';
import { Brain, TrendingUp, Calendar, Download, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import axios from 'axios';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { ScoreKomponen } from '../shared/ScoreKomponen';

async function captureElementAsPDF(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
  if (!canvas || canvas.width === 0 || canvas.height === 0) throw new Error('Dimensi elemen laporan adalah 0.');
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const imgW = pdfW - margin * 2;
  const imgH = (canvas.height / canvas.width) * imgW;
  let heightLeft = imgH;
  let position = margin;
  pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
  heightLeft -= pdfH - margin * 2;
  while (heightLeft > 0) {
    pdf.addPage();
    position = position - pdfH + margin * 2;
    pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
    heightLeft -= pdfH - margin * 2;
  }
  pdf.save(filename);
}

function PrintView({ predictions }: { predictions: any[] }) {
  const now = new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  const avgConf = predictions.length
    ? Math.round(predictions.reduce((s, p) => s + parseInt(p.confidence ?? '0'), 0) / predictions.length)
    : 0;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '24px', background: '#fff', color: '#111', width: '780px' }}>
      <div style={{ borderBottom: '3px solid #7c3aed', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/images/logo.png" alt="AKMAL Logo" style={{ height: '56px', objectFit: 'contain' }} onError={e => ((e.target as HTMLElement).style.display = 'none')} />
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#7c3aed', fontWeight: 900 }}>AKMAL — Laporan Ramalan AI</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#555', fontWeight: 'bold' }}>Akademi Al-Quran Amalillah Terengganu</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#555' }}>
          <div>Dijana: {now}</div>
          <div>Pelajar Dipantau: {predictions.length}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Purata Ketepatan', value: `${avgConf}%`, color: '#2563eb' },
          { label: 'Pelajar Dipantau', value: predictions.length, color: '#16a34a' },
        ].map(item => (
          <div key={item.label} style={{ flex: 1, border: '2px solid #e5e7eb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{item.label}</div>
          </div>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
        <thead>
          <tr style={{ background: '#f5f3ff' }}>
            {['Nama Pelajar', 'Kemajuan', 'Khatam', 'Sabak', 'Sabki', 'Manzil', 'Trend', 'Keyakinan'].map(h => (
              <th key={h} style={{ border: '1px solid #ddd6fe', padding: '7px 8px', textAlign: 'left', fontWeight: 700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {predictions.map((p, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px', fontWeight: 600 }}>{p.studentName}</td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>{p.current_progress}</td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>{p.estimated_completion}</td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>{p.sabaq_score != null ? `${p.sabaq_score}%` : '—'}</td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>{p.sabki_score != null ? `${p.sabki_score}%` : '—'}</td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>{p.manzil_score != null ? `${p.manzil_score}%` : '—'}</td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>{p.performance_trend}</td>
              <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>{p.confidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '20px', paddingTop: '10px', fontSize: '10px', color: '#aaa', textAlign: 'center' }}>
        AKMAL Sistem Pengurusan Tahfiz — Laporan AI Rasmi — {now}
      </div>
    </div>
  );
}

export function AIPrediction() {
  const { state } = useAppStore();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const classIds = [...new Set(state.classes.map(c => c.id))];
      const all: any[] = [];
      for (const cid of classIds) {
        const resp = await axios.get(`/api/ai-predictions/class/${cid}`);
        all.push(...resp.data);
      }
      const mapped = all.map(p => ({
        ...p,
        studentName: state.students.find(s => String(s.id) === String(p.student_id))?.name ?? 'Pelajar',
      }));
      setPredictions(mapped);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to fetch predictions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const downloadPDF = async () => {
    if (!printRef.current) return;
    setGeneratingPDF(true);
    try {
      await captureElementAsPDF(printRef.current, `AKMAL_AI_Predictions_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      alert('Gagal menjana PDF: ' + (err.message || err));
    } finally {
      setGeneratingPDF(false);
    }
  };

  const avgConfidence = predictions.length
    ? Math.round(predictions.reduce((s, p) => s + parseInt(p.confidence ?? '0'), 0) / predictions.length)
    : 0;

  const trendColor = (t: string) => {
    if (!t) return 'bg-gray-100 text-gray-700';
    const tl = t.toLowerCase();
    if (tl.includes('mumtaz') || tl.includes('cemerlang')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (tl.includes('baik')) return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (tl.includes('sederhana')) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-rose-100 text-rose-800 border border-rose-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Ringkasan Ramalan AI</h2>
          <p className="text-gray-600 mt-1">Analisis kemajuan Sabak–Sabki–Manzil setiap pelajar</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
            {loading ? 'Menganalisis...' : 'Jana Semula'}
          </button>
          <button onClick={downloadPDF} disabled={generatingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
            {generatingPDF ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {generatingPDF ? 'Menjana PDF...' : 'Muat Turun Laporan'}
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-white rounded-lg shadow-sm"><Brain className="w-8 h-8 text-purple-600" /></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enjin Analisis AI — Kaedah Sabak–Sabki–Manzil</h3>
            <p className="text-gray-700 mb-4">Sistem menilai tiga komponen utama: hafalan baharu (Sabak), ulang kaji semasa (Sabki), dan penjagaan hafalan lama (Manzil).</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Purata Ketepatan AI', value: `${avgConfidence}%` },
                { label: 'Pelajar Dipantau', value: predictions.length },
                { label: 'Kelas Dianalisis', value: state.classes.length },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-lg p-3">
                  <p className="text-sm text-gray-600">{m.label}</p>
                  <p className="text-xl font-semibold text-purple-600">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loaded && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-green-800 text-sm font-medium">
          ✅ Ramalan AI dikemas kini menggunakan data Sabak, Sabki, dan Manzil terkini daripada rekod hafazan.
        </div>
      )}

      {/* Individual predictions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Ramalan Individu ({predictions.length} pelajar)</h3>
        {predictions.length === 0 && !loading && (
          <p className="text-gray-400 text-sm">Tiada data untuk dipaparkan.</p>
        )}
        {predictions.map((pred, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{pred.studentName}</h4>
                <p className="text-sm text-gray-500">{pred.current_progress}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${trendColor(pred.performance_trend)}`}>
                {pred.performance_trend}
              </span>
            </div>

            {/* Sabak / Sabki / Manzil score bars */}
            <ScoreKomponen sabaq={pred.sabaq_score} sabki={pred.sabki_score} manzil={pred.manzil_score} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: <Calendar className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', label: 'Anggaran Khatam', value: pred.estimated_completion },
                { icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', label: 'Tahap Keyakinan', value: pred.confidence },
                { icon: <Brain className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', label: 'Purata Halaman/Minggu', value: pred.avg_pages_per_week != null ? `${pred.avg_pages_per_week} hlm` : `${pred.avg_ayah_per_day} ayat/hari` },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`p-2 ${item.bg} rounded-lg`}>{item.icon}</div>
                  <div><p className="text-xs text-gray-600">{item.label}</p><p className="text-sm font-semibold text-gray-900">{item.value}</p></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden print view */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '780px', opacity: 0, pointerEvents: 'none', zIndex: -9999, overflow: 'hidden', height: '1px' }}>
        <div ref={printRef} style={{ width: '780px', background: '#ffffff', padding: '24px' }}>
          <PrintView predictions={predictions} />
        </div>
      </div>
    </div>
  );
}
