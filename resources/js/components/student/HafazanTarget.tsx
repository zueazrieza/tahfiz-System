import { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Calendar, BookOpen, TrendingUp, Loader2, CheckCircle } from 'lucide-react';

export function HafazanTarget() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const studentId = authUser.linked_id;

  useEffect(() => {
    if (studentId) {
      axios.get(`/api/students/targets/${studentId}`)
        .then(res => setData(res.data))
        .catch(err => console.error('Error fetching targets', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300">
        <p className="text-gray-500 mb-4">Akaun anda belum dikaitkan dengan profil pelajar atau sesi anda telah tamat.</p>
        <button onClick={() => window.location.href = '/app'} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">
          Log Masuk Semula
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Memuatkan sasaran anda...</p>
      </div>
    );
  }

  const targets = [
    { label: 'Sasaran Mingguan (Ditentukan oleh Murabbi)', current: data?.weekly?.current ?? 0, target: data?.weekly?.target ?? 100, icon: <Calendar size={24} />, color: 'blue', period: 'Minggu Ini', progress: data?.weekly?.progress ?? 0 },
    { label: 'Sasaran Bulanan (Ditentukan oleh Murabbi)', current: data?.monthly?.current ?? 0, target: data?.monthly?.target ?? 400, icon: <Target size={24} />, color: 'green', period: 'Bulan Ini', progress: data?.monthly?.progress ?? 0 },
    { label: 'Sasaran Tahunan (Ditentukan oleh Murabbi)', current: data?.yearly?.current ?? 0, target: data?.yearly?.target ?? 4800, icon: <TrendingUp size={24} />, color: 'purple', period: 'Tahun Ini', progress: data?.yearly?.progress ?? 0 },
  ];

  const bgMap: Record<string, string> = { blue: 'bg-blue-50', green: 'bg-green-50', purple: 'bg-purple-50' };
  const textMap: Record<string, string> = { blue: 'text-blue-600', green: 'text-green-600', purple: 'text-purple-600' };
  const barMap: Record<string, string> = { blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Sasaran Hafazan</h2>
        <p className="text-gray-600 mt-1">Jejaki sasaran hafazan anda yang ditetapkan oleh Murabbi / Murabbiah</p>
      </div>

      {/* Alert if target has not been set by Murabbi */}
      {!data?.stats?.targetHafazan ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm flex items-start gap-2 shadow-sm">
          <Target className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sasaran Belum Ditetapkan</p>
            <p className="text-xs text-amber-700 mt-1">Murabbi / Murabbiah anda belum menetapkan sasaran rasmi. Nilai lalai sistem sedang dipaparkan.</p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm flex items-start gap-2 shadow-sm">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sasaran Aktif</p>
            <p className="text-xs text-green-700 mt-1">Semua sasaran di bawah diselaraskan secara automatik berdasarkan tetapan Murabbi / Murabbiah anda.</p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Hari Berturutan', value: `🔥 ${data?.stats?.streak ?? 0} hari`, color: 'text-orange-600' },
          { label: 'Jumlah Rekod', value: data?.stats?.totalRecords ?? 0, color: 'text-blue-600' },
          { label: 'Juzuk Selesai', value: `${data?.stats?.juzukCompleted ?? 0} / 30`, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Target dari Murabbi */}
      {data?.stats?.targetHafazan && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600 animate-pulse" />
            Sasaran 3 Bulan Anda (Ditetapkan oleh Murabbi)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {data.stats.targetHafazan.split('|').map((part: string, idx: number) => (
              <div key={idx} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center hover:scale-105 transition-all">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Bulan {idx + 1}</p>
                <p className="text-lg font-black text-indigo-900 mt-1">{part.trim()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Targets */}
      {targets.map(t => (
        <div key={t.label} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 ${bgMap[t.color]} ${textMap[t.color]} rounded-lg flex items-center justify-center`}>{t.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{t.label}</h3>
              <p className="text-sm text-gray-500">{t.period}</p>
            </div>
            <div className="ml-auto text-right">
              <p className={`text-2xl font-bold ${textMap[t.color]}`}>{t.current}</p>
              <p className="text-sm text-gray-500">/ {t.target} ayat</p>
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${barMap[t.color]} rounded-full transition-all`} style={{ width: `${t.progress}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{t.progress}% selesai</span>
            <span>{Math.max(0, t.target - t.current)} ayat tinggal</span>
          </div>
        </div>
      ))}

      {/* Projected completion — aligned with AI prediction formula (604 mukasurat, 1 Juz = 20 muka) */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="text-green-600" size={22} />
          <h3 className="font-semibold text-green-900">Unjuran Khatam Al-Quran</h3>
        </div>
        {data?.weekly?.current > 0 ? (() => {
          const juzuk = data?.stats?.juzukCompleted ?? 0;
          const avgAyahPerDay = data?.weekly?.current / 7;
          const avgPpd = avgAyahPerDay / 6; // 6 ayat ≈ 1 mukasurat
          const pagesRemaining = 604 - Math.min(604, juzuk * 20);
          const rawDays = avgPpd > 0 ? Math.ceil(pagesRemaining / avgPpd) : 548;
          const days = Math.max(365, Math.min(548, rawDays));
          const years = Math.floor(days / 365);
          const months = Math.round((days % 365) / 30);
          const timeStr = years > 0 ? `${years} tahun ${months} bulan` : `${months} bulan`;
          return (
            <>
              <p className="text-3xl font-bold text-green-700">{timeStr}</p>
              <p className="text-sm text-green-700 mt-1">
                {days} hari — kadar semasa ~{avgPpd.toFixed(1)} muka surat/hari ({Math.round(avgAyahPerDay)} ayat/hari)
              </p>
              <p className="text-xs text-green-600 mt-1 opacity-70">Baki: {pagesRemaining} mukasurat | Formula: 1 Juz = 20 muka, 604 muka surat jumlah</p>
            </>
          );
        })() : (
          <p className="text-gray-500 text-sm">Mula rekod hafazan untuk lihat unjuran anda!</p>
        )}
      </div>
    </div>
  );
}
