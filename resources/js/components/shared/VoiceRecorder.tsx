import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface VoiceRecorderProps {
  studentId: string;
  surah?: string;
  ayatFrom?: string;
  ayatTo?: string;
  recordedBy?: 'student' | 'teacher';
  onSaved?: (id: number, url: string) => void;
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoiceRecorder({ studentId, surah, ayatFrom, ayatTo, recordedBy = 'student', onSaved }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'preview' | 'uploading' | 'done' | 'error'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasPermission(true);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
        : '';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        audioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setPhase('preview');
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start(250);
      setElapsed(0);
      setPhase('recording');
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } catch (err: any) {
      setHasPermission(false);
      setErrorMsg('Mikrofon tidak dapat diakses. Sila beri kebenaran mikrofon dalam tetapan pelayar anda.');
      setPhase('error');
    }
  };

  const stopRecording = () => {
    timerRef.current && clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const togglePlay = () => {
    if (!audioElRef.current) return;
    if (isPlaying) { audioElRef.current.pause(); setIsPlaying(false); }
    else { audioElRef.current.play(); setIsPlaying(true); }
  };

  const discard = () => {
    audioElRef.current?.pause();
    setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setElapsed(0);
    setIsPlaying(false);
    setPhase('idle');
    audioBlobRef.current = null;
  };

  const upload = async () => {
    if (!audioBlobRef.current) return;
    setPhase('uploading');
    try {
      const form = new FormData();
      const ext = audioBlobRef.current.type.includes('mp4') ? 'mp4' : 'webm';
      form.append('audio', audioBlobRef.current, `recording.${ext}`);
      form.append('student_id', studentId);
      if (surah) form.append('surah', surah);
      if (ayatFrom) form.append('ayat_from', ayatFrom);
      if (ayatTo) form.append('ayat_to', ayatTo);
      form.append('duration_seconds', String(elapsed));
      form.append('notes', notes);
      form.append('recorded_by', recordedBy);

      const res = await axios.post('/api/recordings', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhase('done');
      onSaved?.(res.data.id, res.data.url);
    } catch {
      setErrorMsg('Gagal muat naik rakaman. Sila cuba lagi.');
      setPhase('error');
    }
  };

  const reset = () => { discard(); setPhase('idle'); setErrorMsg(''); setNotes(''); };

  if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Pelayar ini tidak menyokong rakaman audio. Sila guna Chrome atau Firefox.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      {/* ── Status bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {phase === 'recording' && (
            <span className="flex items-center gap-1.5 text-red-600 font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              Sedang Merakam — {fmtTime(elapsed)}
            </span>
          )}
          {phase === 'preview' && <span className="text-gray-600 text-sm font-medium">Rakaman siap ({fmtTime(elapsed)})</span>}
          {phase === 'uploading' && <span className="text-blue-600 text-sm font-medium animate-pulse">Muat naik...</span>}
          {phase === 'done' && (
            <span className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
              <CheckCircle className="w-4 h-4" /> Disimpan!
            </span>
          )}
          {phase === 'idle' && <span className="text-gray-400 text-sm">Tekan Rekod untuk mulakan</span>}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3">
        {(phase === 'idle' || phase === 'done') && (
          <button
            onClick={phase === 'done' ? reset : startRecording}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-red-200"
          >
            <Mic className="w-4 h-4" />
            {phase === 'done' ? 'Rekod Baru' : 'Rekod'}
          </button>
        )}

        {phase === 'recording' && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold text-sm transition-all"
          >
            <Square className="w-4 h-4 fill-white" /> Berhenti
          </button>
        )}

        {phase === 'preview' && (
          <>
            <button
              onClick={togglePlay}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A4D50] hover:bg-[#0d3d40] text-white rounded-xl font-bold text-sm transition-all"
            >
              {isPlaying ? <><Pause className="w-4 h-4" /> Jeda</> : <><Play className="w-4 h-4 fill-white" /> Dengar</>}
            </button>
            <button
              onClick={discard}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              aria-label="Buang rakaman"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        {phase === 'uploading' && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold">
            <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Muat naik...
          </div>
        )}
      </div>

      {/* ── Hidden audio element ── */}
      {audioUrl && (
        <audio
          ref={audioElRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* ── Notes + save (preview phase) ── */}
      {phase === 'preview' && (
        <div className="space-y-3 pt-1 border-t border-gray-100">
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Nota (cth: ulang bahagian yang lemah) — pilihan"
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FC7CB]"
            maxLength={300}
          />
          <button
            onClick={upload}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" /> Simpan Rakaman
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {(phase === 'error') && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            {errorMsg}
            <button onClick={reset} className="block mt-1 underline text-red-500 font-medium">Cuba lagi</button>
          </div>
        </div>
      )}
    </div>
  );
}
