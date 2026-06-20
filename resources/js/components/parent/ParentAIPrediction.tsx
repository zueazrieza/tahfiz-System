import { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, TrendingUp, Calendar, Star, BookOpen, Users } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { ScoreKomponen } from '../shared/ScoreKomponen';

interface AIPredictionData {
  id: number;
  student_id: number;
  current_progress: string;
  estimated_completion: string;
  performance_trend: string;
  confidence: string;
  recommendations: string;
  attendance_rate: string;
  avg_ayah_per_day: string;
  recommendation?: string;
  sabaq_score?: number | null;
  sabki_score?: number | null;
  manzil_score?: number | null;
}

interface ParentAIPredictionProps {
  childId: string;
}

const JOURNEY_STEPS = [
  { num: 1, title: 'User Interaction (Interaksi)', desc: 'Pelajar berinteraksi dengan kuiz, talaqqi, dan hafazan AI secara aktif.', status: 'Aktif' },
  { num: 2, title: 'Data Collection (Kutipan Data)', desc: 'Sistem merakam audio bacaan, masa tasmik, dan skor kelancaran.', status: 'Aktif' },
  { num: 3, title: 'Preprocessing (Pra-pemprosesan)', desc: 'Enjin NLP & Pembersihan Arab memproses teks serta audio bacaan.', status: 'Selesai' },
  { num: 4, title: 'Weak Point Detection (Ralat Bayesian)', desc: 'Model Bayesian menjejaki perkataan dan hukum tajwid yang sering salah.', status: 'Selesai' },
  { num: 5, title: 'Forgetting Curve Modeling (LSTM)', desc: 'Rangkaian saraf LSTM meramal keluk lupa dan tahap kelancaran ayat.', status: 'Selesai' },
  { num: 6, title: 'RL Scheduling (Penjadualan)', desc: 'Ejen Q-learning mengira selang masa ulangan terbaik bagi setiap surah.', status: 'Selesai' },
  { num: 7, title: 'Personalized Delivery (Hantaran)', desc: 'AI melaras cadangan gaya belajar VARK pada dashboard murid.', status: 'Aktif' },
  { num: 8, title: 'Continuous Tracking (Analitis)', desc: 'Modul analitis merekod dan mengelas trend prestasi tasmik.', status: 'Aktif' },
];

export function ParentAIPrediction({ childId }: ParentAIPredictionProps) {
  const { state } = useAppStore();
  const [prediction, setPrediction] = useState<AIPredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [childProfile, setChildProfile] = useState<any | null>(null);

  // state.students is only populated by admin routes; fall back to API for parent logins
  const child = state.students.find(s => String(s.id) === String(childId)) ?? childProfile;
  const childClass = state.classes.find(c => c.id === child?.classId);
  const teacher = state.teachers.find(t => t.id === child?.teacherId);

  useEffect(() => {
    if (!childId) return;
    fetchPrediction();
    if (!state.students.find(s => String(s.id) === String(childId))) {
      axios.get(`/api/students/${childId}`)
        .then(res => setChildProfile(res.data))
        .catch(console.error);
    }
  }, [childId]);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`/api/ai-predictions/student/${childId}`);
      setPrediction(resp.data);
    } catch (err) {
      console.error('Failed to fetch AI prediction', err);
    } finally {
      setLoading(false);
    }
  };

  const trendColor = (t: string) => {
      const trend = t.toLowerCase();
      if (trend.includes('cemerlang') || trend === 'mumtaz') return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
      if (trend.includes('baik') || trend === 'jayyid') return { bg: 'bg-blue-100',  text: 'text-blue-700',  border: 'border-blue-300'  };
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
  };

  if (loading) return <div className="p-8 text-slate-500">Menjana analisis AI...</div>;

  const tc = prediction ? trendColor(prediction.performance_trend) : { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Ramalan AI — {child?.name ?? 'Anak Anda'}</h2>
        <p className="text-gray-600 mt-1">Anggaran khatam Al-Quran dan cadangan peribadi untuk anak anda</p>
      </div>

      {/* Child info banner */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5 border border-green-200 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {child?.name?.charAt(0) ?? '?'}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">{child?.name ?? '—'}</p>
          <p className="text-sm text-gray-600">Kelas: <strong>{childClass?.name ?? '—'}</strong> · Murabbi/Murabbiah: <strong>{teacher?.name ?? '—'}</strong></p>
          <p className="text-sm text-green-700 font-semibold mt-0.5">{child?.juzukCompleted ?? 0} / 30 Juzuk Dihafal</p>
        </div>
      </div>

      {!prediction ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
          <Brain className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>Tiada data hafazan yang mencukupi untuk menjana ramalan.</p>
        </div>
      ) : (
        <>
          {/* Performance trend card */}
          <div className={`rounded-xl p-6 border-2 ${tc.bg} ${tc.border}`}>
            <div className="flex items-center gap-3 mb-2">
              <Star className={`w-6 h-6 ${tc.text}`} />
              <h3 className={`text-lg font-bold ${tc.text}`}>Trend Prestasi: {prediction.performance_trend}</h3>
            </div>
            <p className="text-gray-700 text-sm">
                Analisis data menunjukkan perkembangan <strong>{prediction.performance_trend}</strong>. 
                {prediction.performance_trend.toLowerCase().includes('cemerlang') 
                  ? ' 🌟 Prestasi cemerlang! Teruskan usaha dan sokongan.' 
                  : ' Konsistensi hafazan adalah kunci kejayaan.'}
            </p>
          </div>

          {/* Sabak / Sabki / Manzil scores */}
          <ScoreKomponen
            sabaq={prediction.sabaq_score ?? null}
            sabki={prediction.sabki_score ?? null}
            manzil={prediction.manzil_score ?? null}
          />

          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Calendar className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50 border-purple-200', label: 'Anggaran Khatam', value: prediction.estimated_completion },
              { icon: <TrendingUp className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50 border-blue-200',     label: 'Tahap Keyakinan AI', value: prediction.confidence },
              { icon: <BookOpen className="w-6 h-6 text-green-600" />, bg: 'bg-green-50 border-green-200',    label: 'Purata Ayat/Hari', value: prediction.avg_ayah_per_day },
            ].map(item => (
              <div key={item.label} className={`rounded-xl border p-5 ${item.bg} flex items-center gap-4`}>
                <div className="p-2 bg-white rounded-lg shadow-sm">{item.icon}</div>
                <div>
                  <p className="text-xs text-gray-600">{item.label}</p>
                  <p className="text-lg font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Attendance & Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Pembelajaran</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-xs text-gray-600">Kadar Kehadiran</p>
                  <p className="text-xl font-bold text-blue-600">{prediction.attendance_rate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-lg"><BookOpen className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="text-xs text-gray-600">Kemajuan Semasa</p>
                  <p className="text-xl font-bold text-green-600">{prediction.current_progress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
              <h3 className="font-bold text-purple-900 text-base uppercase tracking-tight">Cadangan AI (Metodologi Pengulangan)</h3>
            </div>
            <p className="text-purple-800 text-sm whitespace-pre-line leading-relaxed font-semibold">{prediction.recommendation || prediction.recommendations}</p>
          </div>

          {/* AI Journey Visualizer (Figure 3 Integration) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                Visualisasi Alur Pembelajaran Pintar AI (8-Step Journey)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pemetaan pemprosesan data dan analisis ingatan pelajar secara masa nyata berdasarkan Model Kognitif Sistem Tahfiz AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {JOURNEY_STEPS.map((step) => {
                const isActive = step.status === 'Aktif';
                return (
                  <div 
                    key={step.num} 
                    className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                      isActive 
                        ? 'bg-teal-50/40 border-teal-200 shadow-xs' 
                        : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isActive 
                        ? 'bg-teal-500 text-white shadow-sm' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      0{step.num}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-xs font-bold ${isActive ? 'text-teal-900' : 'text-slate-700'}`}>
                          {step.title}
                        </h4>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-wider uppercase ${
                          isActive 
                            ? 'bg-teal-100 text-teal-700 border border-teal-200' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
