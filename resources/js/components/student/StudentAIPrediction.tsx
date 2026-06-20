import { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, TrendingUp, Calendar, Star, Zap, BookOpen, RefreshCw, Award, Target, HelpCircle } from 'lucide-react';
import { useAppStore, getStudentStreak } from '../../store/AppContext';
import { ScoreKomponen } from '../shared/ScoreKomponen';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

import type { StudentView } from './StudentDashboard';

interface Props {
  onNavigate?: (view: StudentView) => void;
}

export function StudentAIPrediction({ onNavigate }: Props) {
  const { state } = useAppStore();
  const [prediction, setPrediction] = useState<AIPredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [classRank, setClassRank] = useState<{ rank: number; total: number } | null>(null);
  const [studentProfile, setStudentProfile] = useState<{ id: string | number; classId?: string | number; juzukCompleted?: number } | null>(null);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const studentId = authUser.linked_id;
  // state.students is only populated when an admin visits ManageStudents/ManageTeachers.
  // For student logins, fall back to a direct API fetch.
  const student = state.students?.find(s => String(s.id) === String(studentId)) ?? studentProfile;

  const streak = student ? getStudentStreak(state, String(student.id)) : 0;

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    if (state.students?.find(s => String(s.id) === String(studentId))) return;
    axios.get(`/api/students/${studentId}`)
      .then(res => setStudentProfile(res.data))
      .catch(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    if (student?.id) {
      fetchPrediction(String(student.id));
      fetchRecords(String(student.id));
      if (student.classId) fetchClassRank(String(student.id), String(student.classId));
    }
  }, [student?.id]);

  const fetchRecords = async (id: string) => {
    try {
      const resp = await axios.get(`/api/hafazan-records?student_id=${id}&limit=7`);
      setRecords(resp.data);
    } catch {}
  };

  const fetchClassRank = async (studentId: string, classId: string) => {
    try {
      const resp = await axios.get(`/api/students/leaderboard/${classId}`);
      const list: any[] = resp.data;
      const pos = list.findIndex((s: any) => String(s.id) === studentId);
      if (pos !== -1) setClassRank({ rank: pos + 1, total: list.length });
    } catch {}
  };

  const fetchPrediction = async (id: string | number) => {
    try {
      setLoading(true);
      const resp = await axios.get(`/api/ai-predictions/student/${id}`);
      setPrediction(resp.data);
    } catch (err: any) {
      // No prediction exists yet — auto-generate one
      if (err.response?.status === 404) {
        try {
          const genResp = await axios.post('/api/ai-predictions/generate', { student_id: id });
          setPrediction(genResp.data);
        } catch (genErr) {
          console.error('Failed to auto-generate AI prediction', genErr);
        }
      } else {
        console.error('Failed to fetch AI prediction', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!student?.id) return;
    if (!confirm('Adakah anda pasti ingin menjana semula ramalan AI anda?')) {
      return;
    }
    try {
      setLoading(true);

      const resp = await axios.post('/api/ai-predictions/generate', { student_id: student.id });
      setPrediction(resp.data);
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      const msg = err.response?.data?.message || 'Sila pastikan anda mempunyai rekod hafazan yang mencukupi untuk dianalisis.';
      alert('Gagal menjana ramalan AI: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const trendColor = (t: string) => {
    if (!t) return 'from-slate-400 to-slate-600';
    const trend = t.toLowerCase();
    if (trend.includes('cemerlang') || trend === 'mumtaz') return 'from-green-400 to-emerald-600';
    if (trend.includes('baik') || trend === 'jayyid') return 'from-blue-400 to-blue-600';
    return 'from-orange-400 to-orange-600';
  }

  const trendBg = (t: string) => {
    if (!t) return 'bg-slate-50 border-slate-300 text-slate-800';
    const trend = t.toLowerCase();
    if (trend.includes('cemerlang') || trend === 'mumtaz') return 'bg-green-50 border-green-300 text-green-800';
    if (trend.includes('baik') || trend === 'jayyid') return 'bg-blue-50 border-blue-300 text-blue-800';
    return 'bg-orange-50 border-orange-300 text-orange-800';
  }

  if (loading) return <div className="p-8 text-slate-500 text-center">Menjana analisis AI anda...</div>;
  if (!student) return <div className="p-8 text-slate-500 text-center">Maklumat profil pelajar tidak dijumpai.</div>;

  if (!prediction && (!student.juzukCompleted || student.juzukCompleted < 1)) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Ramalan AI Saya</h2>
          <p className="text-slate-500 font-medium mt-1">Analisis pintar berdasarkan rekod hafazan dan disiplin anda</p>
        </div>
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-10 text-center gap-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 mb-1">Belum Ada Rekod Hafazan</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Ramalan AI memerlukan sekurang-kurangnya <strong>1 juzuk</strong> yang telah dihafal.
              Mulakan perjalanan hafazan anda sekarang!
            </p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 p-4 text-sm text-slate-600 text-left w-full max-w-sm">
            <p className="font-bold text-slate-700 mb-2">📋 Langkah untuk bermula:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Pergi ke <strong>Sasaran Hafazan</strong></li>
              <li>Tetapkan sasaran juzuk anda</li>
              <li>Rekodkan hafazan harian anda</li>
              <li>Kembali ke sini untuk lihat ramalan AI!</li>
            </ol>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('target')}
              className="flex items-center gap-2 px-6 py-3 bg-[#1A4D50] text-white rounded-2xl font-black hover:bg-slate-900 shadow-xl transition-all active:scale-95"
            >
              <Target className="w-5 h-5" />
              Mulakan Hafazan Sekarang
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Ramalan AI Saya</h2>
          <p className="text-slate-500 font-medium mt-1">Analisis pintar berdasarkan rekod hafazan dan disiplin anda</p>
        </div>
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-[#1A4D50] text-white rounded-2xl font-black hover:bg-slate-900 shadow-xl transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="size-5 animate-spin" /> : <Brain className="size-5" />}
          {prediction ? 'KEMASKINI ANALISIS' : 'JANA RAMALAN'}
        </button>
      </div>

      {!prediction ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
          <Brain className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>Mula merekod hafazan untuk menjana ramalan AI anda!</p>
        </div>
      ) : (
        <>
          {/* Hero prediction card */}
          <div className={`rounded-2xl p-6 text-white bg-gradient-to-br ${trendColor(prediction.performance_trend)} shadow-lg`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Trend Prestasi Anda</p>
                <h3 className="text-3xl font-bold">{prediction.performance_trend}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-white/80 text-xs mb-1">🎯 Anggaran Khatam</p>
                <p className="text-white font-bold text-lg">{prediction.estimated_completion}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-white/80 text-xs mb-1">🔥 Hari Berturutan</p>
                <p className="text-white font-bold text-lg">{streak} hari</p>
              </div>
            </div>
          </div>

          {/* Sabak / Sabki / Manzil scores */}
          <ScoreKomponen
            sabaq={prediction.sabaq_score ?? null}
            sabki={prediction.sabki_score ?? null}
            manzil={prediction.manzil_score ?? null}
          />

          {/* Progress overview */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Calendar className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', label: 'Kemajuan Semasa', value: prediction.current_progress },
              { icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', label: 'Keyakinan AI', value: prediction.confidence },
              { icon: <BookOpen className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', label: 'Purata Ayat/Hari', value: prediction.avg_ayah_per_day },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center mb-3`}>{item.icon}</div>
                <p className="text-xs text-gray-600">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Attendance rate bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">📅 Kadar Kehadiran</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                  style={{ width: prediction.attendance_rate }}
                />
              </div>
              <span className="text-lg font-bold text-green-600">{prediction.attendance_rate}</span>
            </div>
          </div>

          {/* Trend Chart + Class Rank */}
          {records.length > 0 && (() => {
            const gradeToScore = (g: string | null) => {
              if (!g) return null;
              const map: Record<string, number> = { 'Mumtaz': 95, 'Jayyid Jiddan': 87, 'Jayyid': 80, 'Maqbul': 67, 'Perlu Penambahbaikan': 45, 'Sangat Baik': 92, 'Baik': 80, 'Sederhana': 67, 'Lemah': 45 };
              return map[g] ?? null;
            };
            const chartData = [...records].reverse().map((r, i) => ({
              name: `R${i + 1}`,
              Sabak:  gradeToScore(r.sabaq?.grade),
              Sabki:  gradeToScore(r.sabaqi?.grade),
              Manzil: gradeToScore(r.manzil?.grade),
            }));
            return (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">📊 Trend Sabak–Sabki–Manzil (7 Rekod Terkini)</h3>
                  {classRank && (
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                      🏆 #{classRank.rank} / {classRank.total} dalam kelas
                    </span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any, n: string) => [`${v}%`, n]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Sabak"  fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="Sabki"  fill="#3b82f6" radius={[4,4,0,0]} />
                    <Bar dataKey="Manzil" fill="#8b5cf6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {/* AI Recommendation */}
          <div className={`rounded-xl border-2 p-6 ${trendBg(prediction.performance_trend)}`}>
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-6 h-6" />
              <h3 className="font-bold text-lg">Cadangan AI Untuk Anda</h3>
            </div>
            <div className="space-y-3 text-sm leading-relaxed">
              {(prediction.recommendation || prediction.recommendations || '')
                .split('\n\n')
                .filter(Boolean)
                .map((section, i) => {
                  const lines = section.split('\n');
                  const header = lines[0];
                  const bullets = lines.slice(1).filter(l => l.trim().startsWith('•'));
                  const body = lines.slice(1).filter(l => !l.trim().startsWith('•')).join(' ').trim();
                  return (
                    <div key={i} className="space-y-1">
                      <p className="font-semibold">{header}</p>
                      {body && <p className="opacity-90">{body}</p>}
                      {bullets.length > 0 && (
                        <ul className="space-y-0.5 pl-1">
                          {bullets.map((b, j) => (
                            <li key={j} className="flex gap-2">
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

          {/* Motivational tip */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-purple-600" />
              <h3 className="font-bold text-purple-900">💡 Tips Untuk Mencapai Sasaran</h3>
            </div>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Hafal sekurang-kurangnya 5 ayat setiap hari secara konsisten</li>
              <li>• Ulang kaji Sabki sebelum memulakan Sabak baharu</li>
              <li>• Hadiri setiap sesi — kehadiran konsisten meningkatkan ingatan</li>
              <li>• Kongsi kemajuan anda dengan ibu bapa untuk sokongan moral</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
