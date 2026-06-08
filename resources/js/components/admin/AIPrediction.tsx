import { useState, useRef } from 'react';
import { Brain, TrendingUp, Calendar, Download, RefreshCw } from 'lucide-react';
import { useAppStore, computeAIPrediction } from '../../store/AppContext';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

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

/* ─── Printable AI Prediction Report ───────────────────────────────────────── */
function AIPredictionPrintView({ state, predictions }: { state: any; predictions: any[] }) {
  const now = new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  const avgConfidence = predictions.length
    ? Math.round(predictions.reduce((sum, p) => sum + parseInt(p.confidence), 0) / predictions.length)
    : 0;
  const totalAyahAnalyzed = state.hafazanRecords.reduce((sum: number, r: any) => sum + (r.ayahCount ?? 0), 0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '24px', background: '#fff', color: '#111', width: '780px' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #7c3aed', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/images/logo.png" alt="AKMAL Logo" style={{ height: '56px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#7c3aed', fontWeight: 900 }}>AKMAL — Laporan Ramalan AI</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#555', fontWeight: 'bold' }}>Akademi Al-Quran Amalillah Terengganu</p>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#777' }}>Lot 2123, Kampung Tebakang Bukit Payung, 21400 Marang, Terengganu</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#555' }}>
          <div>Dijana: {now}</div>
          <div>Pelajar Dipantau: {predictions.length}</div>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Titik Data Ayat', value: totalAyahAnalyzed.toLocaleString(), color: '#7c3aed' },
          { label: 'Purata Ketepatan', value: `${avgConfidence}%`, color: '#2563eb' },
          { label: 'Pelajar Dipantau', value: predictions.length, color: '#16a34a' },
        ].map(item => (
          <div key={item.label} style={{ flex: 1, border: '2px solid #e5e7eb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px', borderLeft: '4px solid #7c3aed', paddingLeft: '8px' }}>Analisis & Ramalan Individu</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ background: '#f5f3ff' }}>
              {['Nama Pelajar', 'Kemajuan', 'Anggaran Khatam', 'Kadar Hadir', 'Prestasi', 'Cadangan AI'].map(h => (
                <th key={h} style={{ border: '1px solid #ddd6fe', padding: '7px 8px', textAlign: 'left', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {predictions.map((p, i) => {
              const trendBg = p.performanceTrend === 'Cemerlang' ? '#dcfce7' : p.performanceTrend === 'Baik' ? '#dbeafe' : '#fee2e2';
              const trendColor = p.performanceTrend === 'Cemerlang' ? '#15803d' : p.performanceTrend === 'Baik' ? '#1d4ed8' : '#b91c1c';
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px', fontWeight: 600 }}>{p.studentName}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>{p.currentProgress}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px', fontWeight: 700 }}>{p.estimatedCompletion}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>{p.attendanceRate} (Purata {p.avgAyahPerDay} ayat/hari)</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', background: trendBg, color: trendColor, fontSize: '9px', fontWeight: 700 }}>
                      {p.performanceTrend}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '6px 8px', color: '#444' }}>{p.recommendation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '20px', paddingTop: '10px', fontSize: '10px', color: '#aaa', textAlign: 'center' }}>
        AKMAL Sistem Pengurusan Tahfiz — Laporan AI Rasmi — {now}
      </div>
    </div>
  );
}

export function AIPrediction() {
  const { state } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const predictions = state.students.map(s => computeAIPrediction(state, s.id)).filter(Boolean) as NonNullable<ReturnType<typeof computeAIPrediction>>[];

  const avgConfidence = predictions.length
    ? Math.round(predictions.reduce((sum, p) => sum + parseInt(p!.confidence), 0) / predictions.length)
    : 0;

  const totalAyahAnalyzed = state.hafazanRecords.reduce((sum, r) => sum + (r.ayahCount ?? 0), 0);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => { setIsGenerating(false); setGenerated(true); }, 1500);
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    setGeneratingPDF(true);
    try {
      await captureElementAsPDF(printRef.current, `AKMAL_AI_Predictions_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err: any) {
      console.error('AI PDF Error:', err);
      alert('Gagal menjana PDF Laporan AI: ' + (err.message || err));
    } finally {
      setGeneratingPDF(false);
    }
  };

  const trendColor = (t: string) => {
    if (t === 'Cemerlang') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (t === 'Baik') return 'bg-blue-100 text-blue-800 border border-blue-200';
    return 'bg-rose-100 text-rose-800 border border-rose-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Ringkasan Ramalan AI</h2>
          <p className="text-gray-600 mt-1">Anggaran khatam dan trend prestasi berkuasa AI</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
            {isGenerating ? 'Menganalisis...' : 'Jana Semula'}
          </button>
          <button 
            onClick={downloadPDF} 
            disabled={generatingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {generatingPDF ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {generatingPDF ? 'Menjana PDF...' : 'Muat Turun Laporan'}
          </button>
        </div>
      </div>

      {/* AI Overview */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-white rounded-lg shadow-sm"><Brain className="w-8 h-8 text-purple-600" /></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enjin Analisis AI</h3>
            <p className="text-gray-700 mb-4">Sistem AI kami menganalisis kemajuan hafazan, corak kehadiran, dan konsistensi pembayaran untuk menyediakan anggaran khatam yang tepat dan cadangan peribadi.</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Titik Data Ayat', value: totalAyahAnalyzed.toLocaleString() },
                { label: 'Purata Ketepatan', value: `${avgConfidence}%` },
                { label: 'Pelajar Dipantau', value: state.students.length },
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

      {/* Predictions */}
      {generated && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-green-800 text-sm font-medium">
          ✅ Ramalan AI dikemas kini menggunakan rekod hafazan, data kehadiran, dan sejarah pembayaran terkini.
        </div>
      )}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Ramalan Individu</h3>
        {predictions.map((pred, index) => pred && (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{pred.studentName}</h4>
                <p className="text-sm text-gray-600">Kemajuan Semasa: {pred.currentProgress}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${trendColor(pred.performanceTrend)}`}>{pred.performanceTrend}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { icon: <Calendar className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', label: 'Anggaran Khatam', value: pred.estimatedCompletion },
                { icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', label: 'Tahap Keyakinan', value: pred.confidence },
                { icon: <Brain className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', label: 'Cadangan AI', value: pred.recommendation },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`p-2 ${item.bg} rounded-lg`}>{item.icon}</div>
                  <div><p className="text-xs text-gray-600">{item.label}</p><p className="text-sm font-semibold text-gray-900">{item.value}</p></div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <span>📅 Kadar Kehadiran: <strong>{pred.attendanceRate}</strong></span>
              <span>📖 Purata Ayat/Hari: <strong>{pred.avgAyahPerDay}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Off-screen print containers (invisible, used only for PDF capture) ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '780px', opacity: 0, pointerEvents: 'none', zIndex: -9999, overflow: 'hidden', height: '1px' }}>
        <div ref={printRef} style={{ width: '780px', background: '#ffffff', padding: '24px' }}>
          <AIPredictionPrintView state={state} predictions={predictions} />
        </div>
      </div>
    </div>
  );
}