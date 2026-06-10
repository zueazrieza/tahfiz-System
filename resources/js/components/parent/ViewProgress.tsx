import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../../store/AppContext';
import { BookOpen, TrendingUp, Star, Award, Trophy } from 'lucide-react';
import { HafazanRecord } from '../../store/mockData';

interface ViewProgressProps {
  childId: string;
}

export function ViewProgress({ childId }: ViewProgressProps) {
  const { state } = useAppStore();
  const [records, setRecords] = useState<HafazanRecord[]>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Identify child from global state for static details
  const child = state.students.find(s => String(s.id) === String(childId));
  const progressPct = child ? Math.round((child.juzukCompleted / 30) * 100) : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [recordsRes, achievementsRes] = await Promise.all([
          axios.get(`/api/hafazan-records?student_id=${childId}&limit=10`),
          axios.get(`/api/achievements/student/${childId}`)
        ]);
        setRecords(recordsRes.data);
        setEarnedAchievements(achievementsRes.data);
      } catch (err) {
        console.error('Failed to fetch progress data', err);
      } finally {
        setLoading(false);
      }
    };
    if (childId) fetchData();
  }, [childId]);

  const gradeColor = (g: string) =>
    g === 'Mumtaz' ? 'bg-green-100 text-green-700' :
    g === 'Jayyid' ? 'bg-blue-100 text-blue-700' :
    g === 'Maqbul' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  // Monthly summary (current month)
  const now = new Date();
  const monthRecords = records.filter(r => new Date(r.date).getMonth() === now.getMonth());
  const monthAyah = monthRecords.reduce((sum, r) => sum + (r.ayahCount ?? 0), 0);

  if (loading) return <div className="p-8 text-slate-500">Memuatkan rekod hafazan...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div><h2 className="text-2xl font-semibold text-gray-900">Kemajuan Hafazan</h2><p className="text-gray-600 mt-1">Rekod kemajuan terperinci untuk {child?.name}</p></div>

      {/* Overall progress */}
      <div className="bg-gradient-to-br from-[#1A4D50] to-teal-700 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-3xl font-black flex-shrink-0 border border-white/20 shadow-lg">
              {child?.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-2xl font-black">{child?.name}</h3>
              <p className="text-teal-100/70 text-sm font-medium">Pelajar Pintar AKMAL · {child?.juzukCompleted} / 30 Juzuk</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-teal-100 mb-2 font-bold uppercase tracking-widest">
            <span>Prestasi Keseluruhan</span><span>{progressPct}%</span>
          </div>
          <div className="h-4 bg-white/10 backdrop-blur-md rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div className="h-full bg-gradient-to-r from-teal-300 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(45,212,191,0.5)]" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Bulan Ini', value: `${monthAyah} ayat`, icon: <TrendingUp size={18} /> },
              { label: 'Jumlah Rekod', value: records.length, icon: <BookOpen size={18} /> },
              { label: 'Pencapaian', value: `${earnedAchievements.length} Lencana`, icon: <Star size={18} /> },
            ].map(m => (
              <div key={m.label} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 hover:bg-white/20 transition-all">
                <div className="flex justify-center text-teal-300 mb-1">{m.icon}</div>
                <p className="text-lg font-black text-white">{m.value}</p>
                <p className="text-[10px] text-teal-100/70 font-bold uppercase tracking-widest">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NEW: Hafazan Badges Section for Parents */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
          <Star className="text-teal-500" /> Lencana & Aras Pencapaian
        </h3>
        {earnedAchievements.length === 0 ? (
          <p className="text-slate-400 text-sm italic">Anak anda belum menerima lencana lagi. Teruskan menyokong hafazan mereka! 🌿</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {earnedAchievements.map((a) => (
              <div key={a.id} className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 hover:border-teal-200 transition-all group">
                <div className="size-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  {a.name.includes('Level') || a.name.includes('Warrior') || a.name.includes('Elite') || a.name.includes('Master') 
                    ? <Award className="text-teal-600" size={24} /> 
                    : <Trophy className="text-amber-500" size={24} />}
                </div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{a.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Diberikan pada {new Date(a.earned_at || a.created_at).toLocaleDateString('ms-MY')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Hafazan Records */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
          <BookOpen className="text-teal-500" /> Rekod Hafazan Terkini
        </h3>
        {records.length === 0 && <p className="text-slate-400 text-sm italic">Tiada rekod lagi.</p>}
        <div className="space-y-4">
          {records.map(rec => (
            <div key={rec.id} className="border border-slate-50 rounded-2xl p-5 hover:bg-slate-50 transition-all">
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{new Date(rec.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rec.ayahCount} ayat direkod</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { type: 'Sabaq', data: rec.sabaq, color: 'green' },
                  { type: 'Sabaqi', data: rec.sabaqi, color: 'blue' },
                  { type: 'Manzil', data: rec.manzil, color: 'purple' },
                ].map(({ type, data, color }) => (
                  <div key={type} className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{type}</p>
                    <p className="text-sm font-black text-slate-800 truncate">{data.surah || '—'}</p>
                    {data.surah && <p className="text-[10px] text-slate-500 font-bold mt-1">Ayat {data.from}–{data.to}</p>}
                    {data.grade && <span className={`inline-block mt-3 px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-tighter ${gradeColor(data.grade)}`}>{data.grade}</span>}
                  </div>
                ))}
              </div>
              {rec.remarks && (
                <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                  <p className="text-xs text-indigo-700 italic font-medium leading-relaxed">💬 Ustaz/Ustazah: {rec.remarks}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
