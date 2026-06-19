import { useState, useEffect, useRef } from 'react';
import { Mic, Play, Pause, Trash2, Volume2, Clock, BookOpen, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { VoiceRecorder } from '../shared/VoiceRecorder';
import { SkeletonTable } from '../shared/Skeleton';

interface Recording {
  id: number;
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
  return new Date(iso).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AudioRow({ rec, onDelete }: { rec: Recording; onDelete: (id: number) => void }) {
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
    if (!confirm('Padam rakaman ini?')) return;
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
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#6FC7CB]/40 transition-all group">
      {/* Play button */}
      <button
        onClick={toggle}
        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-[#1A4D50] text-white hover:bg-[#0d3d40] transition-all shadow-sm"
        aria-label={playing ? 'Jeda' : 'Main'}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-sm truncate">{label}</div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(rec.duration_seconds)}</span>
          <span>{fmtDate(rec.recorded_at)}</span>
          {rec.recorded_by === 'teacher' && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">Oleh Murabbi</span>}
        </div>
        {/* Progress bar */}
        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#6FC7CB] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        {rec.notes && <p className="mt-1 text-xs text-gray-400 italic truncate">📝 {rec.notes}</p>}
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        aria-label="Padam rakaman"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Hidden audio */}
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

interface MyRecordingsProps {
  studentId: string;
  currentSurah?: string;
  currentAyatFrom?: string;
  currentAyatTo?: string;
}

export function MyRecordings({ studentId, currentSurah, currentAyatFrom, currentAyatTo }: MyRecordingsProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/recordings?student_id=${studentId}`);
      setRecordings(res.data);
    } catch (err) {
      console.error('Failed to fetch recordings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecordings(); }, [studentId]);

  const handleSaved = (_id: number, _url: string) => {
    setShowRecorder(false);
    fetchRecordings();
  };

  const handleDelete = (id: number) => setRecordings(prev => prev.filter(r => r.id !== id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-[#1A4D50]" /> Rakaman Suara Saya
          </h2>
          <p className="text-gray-500 mt-1 text-sm">Rekod bacaan dan dengar balik untuk latihan diri</p>
        </div>
        <button
          onClick={() => setShowRecorder(p => !p)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A4D50] hover:bg-[#0d3d40] text-white rounded-xl font-bold text-sm transition-all shadow-sm"
        >
          <Mic className="w-4 h-4" />
          {showRecorder ? 'Tutup' : 'Rakam Baru'}
          <ChevronDown className={`w-4 h-4 transition-transform ${showRecorder ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Recorder panel */}
      {showRecorder && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-[#6FC7CB]/30">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1A4D50]" /> Rakaman Baharu
          </p>
          <VoiceRecorder
            studentId={studentId}
            surah={currentSurah}
            ayatFrom={currentAyatFrom}
            ayatTo={currentAyatTo}
            recordedBy="student"
            onSaved={handleSaved}
          />
        </div>
      )}

      {/* Stats */}
      {recordings.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Jumlah Rakaman', value: recordings.length, color: 'text-[#1A4D50]', bg: 'bg-teal-50' },
            { label: 'Jumlah Masa', value: fmtTime(recordings.reduce((s, r) => s + (r.duration_seconds ?? 0), 0)), color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Rakaman Hari Ini', value: recordings.filter(r => new Date(r.recorded_at).toDateString() === new Date().toDateString()).length, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <SkeletonTable rows={4} cols={1} />
      ) : recordings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tiada rakaman lagi</p>
          <p className="text-sm mt-1">Tekan "Rakam Baru" untuk mulakan latihan suara anda</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{recordings.length} rakaman — terbaru dahulu</p>
          {recordings.map(r => (
            <AudioRow key={r.id} rec={r} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
