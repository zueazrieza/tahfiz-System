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
  pages_per_day?: number | null;
  days_to_complete?: number | null;
  milestone_3_months?: string | null;
  progress_percent?: number | null;
}

interface ParentAIPredictionProps {
  childId: string;
}


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
          <p className="text-sm text-gray-600">Kelas: <strong>{childClass?.name ?? '—'}</strong> | Murabbi/Murabbiah: <strong>{teacher?.name ?? '—'}</strong></p>
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
              { icon: <BookOpen className="w-6 h-6 text-green-600" />, bg: 'bg-green-50 border-green-200',    label: 'Kemajuan', value: prediction.progress_percent != null ? `${prediction.progress_percent}%` : prediction.current_progress },
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

          {/* Milestone & pages rate */}
          {(prediction.milestone_3_months || prediction.pages_per_day) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prediction.milestone_3_months && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
                  <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">Pencapaian 3 Bulan</p>
                  <p className="text-xl font-bold text-teal-800">{prediction.milestone_3_months}</p>
                  <p className="text-xs text-teal-600 mt-1">Unjuran berdasarkan kadar hafazan semasa</p>
                </div>
              )}
              {prediction.pages_per_day != null && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Kadar Hafazan</p>
                  <p className="text-xl font-bold text-amber-800">{prediction.pages_per_day} muka surat/hari</p>
                  <p className="text-xs text-amber-600 mt-1">Sasaran: ≥ 1 muka surat sehari</p>
                </div>
              )}
            </div>
          )}

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
            <div className="space-y-3 text-sm leading-relaxed">
              {(prediction.recommendation || prediction.recommendations || '')
                .split('\n\n')
                .filter(Boolean)
                .map((section: string, i: number) => {
                  const lines = section.split('\n');
                  const header = lines[0];
                  const bullets = lines.slice(1).filter((l: string) => l.trim().startsWith('•'));
                  const body = lines.slice(1).filter((l: string) => !l.trim().startsWith('•')).join(' ').trim();
                  return (
                    <div key={i} className="space-y-1">
                      <p className="font-bold text-purple-900">{header}</p>
                      {body && <p className="text-purple-800 opacity-90">{body}</p>}
                      {bullets.length > 0 && (
                        <ul className="space-y-0.5 pl-1">
                          {bullets.map((b: string, j: number) => (
                            <li key={j} className="flex gap-2 text-purple-800">
                              <span className="shrink-0">•</span>
                              <span className="opacity-90">{b.replace(/^•\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      )}
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
