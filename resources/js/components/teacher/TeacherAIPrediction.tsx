import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Calendar, RefreshCw, Users } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import axios from 'axios';

export function TeacherAIPrediction() {
  const { state } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);

  // Resolve teacher
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const teacher = state.teachers.find(t => 
    t.email === authUser.email || 
    (authUser.name && t.name.toLowerCase().includes(authUser.name.toLowerCase().split(' ').slice(-1)[0]))
  ) ?? state.teachers[0];

  useEffect(() => {
    if (teacher?.id) {
      fetchPredictions();
    }
  }, [teacher]);

  const fetchPredictions = async () => {
    setIsGenerating(true);
    try {
      const allPreds: any[] = [];
      const classIds = (teacher?.classIds || []).map(id => String(id));
      
      for (const cid of classIds) {
        const resp = await axios.get(`/api/ai-predictions/class/${cid}`);
        allPreds.push(...resp.data);
      }

      const mapped = allPreds.map(p => ({
        id: p.id,
        studentId: p.student_id,
        studentName: state.students.find(s => String(s.id) === String(p.student_id))?.name || 'Pelajar',
        currentProgress: p.current_progress,
        estimatedCompletion: p.estimated_completion,
        performanceTrend: p.performance_trend,
        confidence: p.confidence,
        recommendation: p.recommendation,
        attendanceRate: p.attendance_rate,
        avgAyahPerDay: p.avg_ayah_per_day
      }));

      setPredictions(mapped);
      setGenerated(true);
    } catch (err) {
      console.error('Failed to fetch AI predictions', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!confirm('Adakah anda pasti ingin menjana semula ramalan AI untuk kelas anda?')) {
      return;
    }
    setIsGenerating(true);

    try {
      const classIds = (teacher?.classIds || []).map(id => String(id));
      
      for (const cid of classIds) {
        await axios.post(`/api/ai-predictions/generate/class/${cid}`);
      }
      
      // After generating, fetch updated results
      await fetchPredictions();
      alert('Ramalan AI telah dijana semula dan disimpan ke pangkalan data.');
    } catch (err: any) {
      console.error('Failed to generate AI predictions', err);
      alert('Gagal menjana ramalan AI: ' + (err.response?.data?.message || 'Ralat sambungan.'));
    } finally {
      setIsGenerating(false);
    }
  };

  // UI Derived state
  const myStudents = state.students.filter(s => String(s.teacherId) === String(teacher?.id));
  const avgConfidence = predictions.length
    ? Math.round(predictions.reduce((sum, p) => sum + parseInt(p.confidence), 0) / predictions.length)
    : 0;

  const avgJuzuk = myStudents.length
    ? Math.round(myStudents.reduce((sum, s) => sum + (s.juzukCompleted ?? 0), 0) / myStudents.length)
    : 0;

  const trendColor = (t: string) =>
    t === 'Cemerlang' ? 'bg-green-100 text-green-700' :
    t === 'Baik' ? 'bg-blue-100 text-blue-700' :
    'bg-orange-100 text-orange-700';

  return (
    <div className="space-y-6">
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
                { label: 'Jumlah Pelajar', value: myStudents.length, icon: <Users className="w-5 h-5 text-purple-600" /> },
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
        {predictions.length === 0 && (
          <p className="text-gray-400 text-sm">Tiada data pelajar untuk dianalisis.</p>
        )}
        {predictions.map((pred, index) => pred && (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{pred.studentName}</h4>
                <p className="text-sm text-gray-600">Kemajuan Semasa: {pred.currentProgress}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${trendColor(pred.performanceTrend)}`}>
                {pred.performanceTrend}
              </span>
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
    </div>
  );
}
