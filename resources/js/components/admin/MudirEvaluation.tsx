import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../../store/AppContext';
import { ShieldCheck, User, BookOpen, CheckCircle, XCircle } from 'lucide-react';

const SURAHS = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha", "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Ad-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Lail", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraish", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

export function MudirEvaluation() {
  const { state } = useAppStore();
  const [students, setStudents] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [formData, setFormData] = useState({
    surah: '',
    juzuk: '',
    tajwid_score: '' as string | number,
    kelancaran_score: '' as string | number,
    hafazan_score: '' as string | number,
    lagu_score: '' as string | number,
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    setStudents(Array.isArray(state.students) ? state.students : []);
    fetchEvaluations();
  }, [state.students]);

  const fetchEvaluations = async () => {
    try {
      const resp = await axios.get('/api/mudir-evaluations');
      const raw = resp.data;
      setEvaluations(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
    } catch (error) {
      console.error('Failed to fetch evaluations', error);
    }
  };

  const calculateTotal = () => {
    return (Number(formData.tajwid_score) || 0) + (Number(formData.kelancaran_score) || 0) + (Number(formData.hafazan_score) || 0) + (Number(formData.lagu_score) || 0);
  };

  const handleScoreChange = (field: string, value: string, max: number) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const num = Number(value);
    if (!isNaN(num)) {
      if (num < 0) {
        setFormData(prev => ({ ...prev, [field]: 0 }));
      } else if (num > max) {
        setFormData(prev => ({ ...prev, [field]: max }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    }
  };

  const isFormValid = selectedStudent !== '' &&
                      formData.surah !== '' &&
                      formData.juzuk !== '' &&
                      formData.tajwid_score !== '' &&
                      formData.kelancaran_score !== '' &&
                      formData.hafazan_score !== '' &&
                      formData.lagu_score !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({
      student: true,
      surah: true,
      juzuk: true,
      tajwid_score: true,
      kelancaran_score: true,
      hafazan_score: true,
      lagu_score: true,
    });

    if (!isFormValid) {
      return;
    }

    if (!confirm('Adakah anda pasti ingin menghantar penilaian ini?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/mudir-evaluations', {
        student_id: selectedStudent,
        evaluator_id: authUser.id,
        ...formData
      });
      alert('Penilaian Mudir berjaya direkodkan.');
      setFormData({ surah: '', juzuk: '', tajwid_score: '', kelancaran_score: '', hafazan_score: '', lagu_score: '', remarks: '' });
      setSelectedStudent('');
      setTouched({});
      fetchEvaluations();
    } catch (err: any) {
      alert('Gagal merekod penilaian: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-teal-600" />
            Tasmik & Ujian Mudir
          </h2>
          <p className="text-slate-500 font-medium mt-1">Penilaian kualiti hafazan dan pengijazahan pelajar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Borang Penilaian */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            Borang Ujian Baru
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pelajar</label>
              <select 
                value={selectedStudent} 
                onChange={e => {
                  setSelectedStudent(e.target.value);
                  setTouched(prev => ({ ...prev, student: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, student: true }))}
                className={`w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500 ${
                  !selectedStudent && touched.student ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              >
                <option value="">Pilih Pelajar...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.juzukCompleted || 0} Juzuk)</option>)}
              </select>
              {!selectedStudent && touched.student && (
                <p className="text-red-500 text-xs mt-1">Sila pilih pelajar.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surah Ujian</label>
                <select 
                  value={formData.surah}
                  onChange={e => {
                    setFormData(prev => ({...prev, surah: e.target.value}));
                    setTouched(prev => ({ ...prev, surah: true }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, surah: true }))}
                  className={`w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500 ${
                    !formData.surah && touched.surah ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                >
                  <option value="">Pilih Surah...</option>
                  {SURAHS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {!formData.surah && touched.surah && (
                  <p className="text-red-500 text-xs mt-1">Sila pilih surah.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahap / Juzuk</label>
                <input 
                  type="number" 
                  value={formData.juzuk}
                  onChange={e => {
                    setFormData(prev => ({...prev, juzuk: e.target.value}));
                    setTouched(prev => ({ ...prev, juzuk: true }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, juzuk: true }))}
                  className={`w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500 ${
                    !formData.juzuk && touched.juzuk ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Cth: 29"
                />
                {!formData.juzuk && touched.juzuk && (
                  <p className="text-red-500 text-xs mt-1">Sila masukkan tahap/juzuk.</p>
                )}
              </div>
            </div>

            <div className="pt-4 pb-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Skala Pemarkahan Rasmi</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 flex justify-between">
                  <span>TAJWID</span> <span className="text-slate-400">/ 40</span>
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="40" 
                  value={formData.tajwid_score} 
                  onChange={e => handleScoreChange('tajwid_score', e.target.value, 40)} 
                  onBlur={() => setTouched(prev => ({ ...prev, tajwid_score: true }))}
                  className={`w-full rounded-xl border-slate-200 text-center font-bold text-lg focus:border-teal-500 ${
                    formData.tajwid_score === '' && touched.tajwid_score ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`} 
                />
                {formData.tajwid_score === '' && touched.tajwid_score && (
                  <p className="text-red-500 text-xs mt-1">Sila masukkan markah Tajwid (0-40).</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 flex justify-between">
                  <span>KELANCARAN</span> <span className="text-slate-400">/ 30</span>
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="30" 
                  value={formData.kelancaran_score} 
                  onChange={e => handleScoreChange('kelancaran_score', e.target.value, 30)} 
                  onBlur={() => setTouched(prev => ({ ...prev, kelancaran_score: true }))}
                  className={`w-full rounded-xl border-slate-200 text-center font-bold text-lg focus:border-teal-500 ${
                    formData.kelancaran_score === '' && touched.kelancaran_score ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`} 
                />
                {formData.kelancaran_score === '' && touched.kelancaran_score && (
                  <p className="text-red-500 text-xs mt-1">Sila masukkan markah Kelancaran (0-30).</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 flex justify-between">
                  <span>HAFAZAN</span> <span className="text-slate-400">/ 20</span>
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="20" 
                  value={formData.hafazan_score} 
                  onChange={e => handleScoreChange('hafazan_score', e.target.value, 20)} 
                  onBlur={() => setTouched(prev => ({ ...prev, hafazan_score: true }))}
                  className={`w-full rounded-xl border-slate-200 text-center font-bold text-lg focus:border-teal-500 ${
                    formData.hafazan_score === '' && touched.hafazan_score ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`} 
                />
                {formData.hafazan_score === '' && touched.hafazan_score && (
                  <p className="text-red-500 text-xs mt-1">Sila masukkan markah Hafazan (0-20).</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 flex justify-between">
                  <span>LAGU (TARANNUM)</span> <span className="text-slate-400">/ 10</span>
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="10" 
                  value={formData.lagu_score} 
                  onChange={e => handleScoreChange('lagu_score', e.target.value, 10)} 
                  onBlur={() => setTouched(prev => ({ ...prev, lagu_score: true }))}
                  className={`w-full rounded-xl border-slate-200 text-center font-bold text-lg focus:border-teal-500 ${
                    formData.lagu_score === '' && touched.lagu_score ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`} 
                />
                {formData.lagu_score === '' && touched.lagu_score && (
                  <p className="text-red-500 text-xs mt-1">Sila masukkan markah Lagu (0-10).</p>
                )}
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center mt-4 transition-all duration-300 ${
              calculateTotal() >= 80 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
               <div>
                 <p className="text-xs font-bold uppercase opacity-80">Jumlah Markah</p>
                 <p className="text-xs opacity-60">Minimum Lulus: 80</p>
               </div>
               <div className={`text-4xl font-black ${calculateTotal() >= 80 ? 'text-emerald-600' : 'text-red-500'}`}>
                 {calculateTotal()}%
               </div>
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ulasan Tambahan</label>
              <textarea 
                rows={2}
                value={formData.remarks}
                onChange={e => setFormData(prev => ({...prev, remarks: e.target.value}))}
                className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500 resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={!isFormValid || loading}
              className="w-full mt-4 py-3 bg-teal-600 text-white font-black rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Sahkan Keputusan Ujian'}
            </button>
          </form>
        </div>

        {/* Rekod Ujian */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 shrink-0">
            <BookOpen className="w-5 h-5 text-slate-400" />
            Rekod Keputusan Ujian
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {evaluations.length === 0 ? (
              <div className="text-center py-10 text-slate-400">Tiada rekod ujian lagi.</div>
            ) : (
              evaluations.map(ev => (
                <div key={ev.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{ev.student?.name || 'Pelajar'}</p>
                      <p className="text-xs text-slate-500">Juzuk {ev.juzuk} — Surah {ev.surah}</p>
                    </div>
                    {ev.passed ? (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
                        <CheckCircle className="w-3 h-3" /> Lulus
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500 bg-red-100 px-2 py-1 rounded-md">
                        <XCircle className="w-3 h-3" /> Gagal
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs mt-3 bg-white p-2 rounded-lg border border-slate-100">
                    <div><span className="text-slate-400">Tajwid:</span> <strong>{ev.tajwid_score}</strong>/40</div>
                    <div><span className="text-slate-400">Lancar:</span> <strong>{ev.kelancaran_score}</strong>/30</div>
                    <div><span className="text-slate-400">Hafazan:</span> <strong>{ev.hafazan_score}</strong>/20</div>
                    <div className="ml-auto"><span className="text-slate-400">Total:</span> <strong className={ev.passed ? 'text-emerald-600' : 'text-red-500'}>{ev.total_score}%</strong></div>
                  </div>
                  {ev.awarded_badge && (
                    <div className="mt-3 text-[10px] font-bold text-teal-600 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Dianugerahkan {ev.awarded_badge}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2 text-right">
                    Dinilai pada: {new Date(ev.created_at).toLocaleDateString('ms-MY')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
