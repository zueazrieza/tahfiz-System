import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, Play, Pause, Clock, User, Search, Trash2, BookOpen } from 'lucide-react';

interface Recording {
  id: number;
  student_id: number;
  student_name: string;
  surah: string | null;
  ayat_from: number | null;
  ayat_to: number | null;
  duration_seconds: number | null;
  notes: string | null;
  recorded_by: string;
  recorded_at: string;
  url: string;
  mime_type: string;
}

function fmtTime(s: number | null) {
  if (!s) return '—';
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function RecordingRow({ rec, onDelete }: { rec: Recording; onDelete: (id: number) => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const handleDelete = async () => {
    if (!confirm(`Padam rakaman ${rec.student_name}?`)) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/recordings/${rec.id}`);
      onDelete(rec.id);
    } catch { alert('Gagal memadam.'); setDeleting(false); }
  };

  const label = rec.surah
    ? `${rec.surah}${rec.ayat_from ? ` (${rec.ayat_from}–${rec.ayat_to ?? '?'})` : ''}`
    : 'Rakaman Umum';

  return (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex flex-col md:flex-row md:items-center gap-4">

        {/* Play button */}
        <button
          onClick={toggle}
          className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl bg-[#1A4D50] text-white hover:bg-[#0d3d40] transition-all shadow-md"
          aria-label={playing ? 'Jeda' : 'Main rakaman'}
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
        </button>

        {/* Student + surah info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800">{rec.student_name}</span>
            {rec.recorded_by === 'teacher' && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">Dirakam Murabbi</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#6FC7CB]/10 text-[#1A4D50] rounded-full text-[10px] font-black uppercase tracking-wide">
              <BookOpen className="w-3 h-3" /> {label}
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {fmtTime(rec.duration_seconds)}
            </span>
            <span className="text-slate-400 text-xs">{fmtDate(rec.recorded_at)}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#6FC7CB] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>

          {rec.notes && (
            <p className="mt-1 text-xs text-slate-400 italic truncate">📝 {rec.notes}</p>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
          aria-label="Padam rakaman"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={rec.url}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
        }}
        className="hidden"
      />
    </div>
  );
}

export function TeacherAIAssessment() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'today' | 'teacher'>('all');

  useEffect(() => { fetchRecordings(); }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/recordings');
      setRecordings(res.data);
    } catch (err) {
      console.error('Failed to fetch recordings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => setRecordings(prev => prev.filter(r => r.id !== id));

  const today = new Date().toDateString();
  const filtered = recordings.filter(r => {
    const matchSearch = !search || r.student_name.toLowerCase().includes(search.toLowerCase())
      || (r.surah ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterBy === 'all' ? true :
      filterBy === 'today' ? new Date(r.recorded_at).toDateString() === today :
      r.recorded_by === 'teacher';
    return matchSearch && matchFilter;
  });

  const totalDuration = recordings.reduce((s, r) => s + (r.duration_seconds ?? 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Semak Rakaman Pelajar</h2>
          <p className="text-slate-500 font-medium">Dengar dan semak rakaman hafazan yang telah disimpan oleh pelajar.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pelajar atau surah..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6FC7CB] shadow-sm w-52"
            />
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {(['all', 'today', 'teacher'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterBy(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filterBy === f ? 'bg-[#1A4D50] text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {f === 'all' ? 'SEMUA' : f === 'today' ? 'HARI INI' : 'OLH MURABBI'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && recordings.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Jumlah Rakaman', value: recordings.length, color: 'text-[#1A4D50]', bg: 'bg-teal-50' },
            { label: 'Jumlah Masa', value: fmtTime(totalDuration), color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Rakaman Hari Ini', value: recordings.filter(r => new Date(r.recorded_at).toDateString() === today).length, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-white`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6FC7CB]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search || filterBy !== 'all' ? 'Tiada rakaman sepadan ditemui.' : 'Belum ada rakaman pelajar.'}</p>
          <p className="text-sm mt-1">Rakaman akan muncul di sini apabila pelajar menyimpan bacaan mereka.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{filtered.length} rakaman — terbaru dahulu</p>
          {filtered.map(r => (
            <RecordingRow key={r.id} rec={r} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
