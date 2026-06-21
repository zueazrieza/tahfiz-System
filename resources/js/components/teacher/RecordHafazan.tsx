import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, RefreshCw, BookOpen, CheckCircle, Mic } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { Grade } from '../../store/mockData';
import { ConfirmModal } from '../shared/ConfirmModal';
import { VoiceRecorder } from '../shared/VoiceRecorder';

const GRADE_MAP: Record<string, string> = { A: 'Mumtaz', B: 'Jayyid Jiddan', C: 'Jayyid', D: 'Maqbul', 'Perlu Penambahbaikan': 'Maqbul' };
const normalizeGrade = (g: string) => GRADE_MAP[g] ?? g;

export function RecordHafazan() {
  const { state, dispatch } = useAppStore();

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const teacherId = authUser.linked_id;

  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [studentsInClass, setStudentsInClass] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  // Fetch classes that belong to this teacher
  useEffect(() => {
    if (!teacherId) return;
    axios.get('/api/classes')
      .then(res => {
        if (Array.isArray(res.data)) {
          const mine = res.data.filter((c: any) => String(c.teacherId) === String(teacherId));
          setTeacherClasses(mine);
          if (mine.length > 0) setSelectedClassId(String(mine[0].id));
        }
      })
      .catch(console.error);
  }, [teacherId]);

  // Fetch students when selected class changes
  useEffect(() => {
    if (!selectedClassId) { setStudentsInClass([]); return; }
    axios.get(`/api/students?classId=${selectedClassId}`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        setStudentsInClass(data);
      })
      .catch(console.error);
  }, [selectedClassId]);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    sabaq: '', sabaqFrom: '', sabaqTo: '', sabaqGrade: '' as Grade,
    sabaqi: '', sabaqiFrom: '', sabaqiTo: '', sabaqiGrade: '' as Grade,
    manzil: '', manzilFrom: '', manzilTo: '', manzilGrade: '' as Grade,
    remarks: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = () => { setFormData({ sabaq: '', sabaqFrom: '', sabaqTo: '', sabaqGrade: '', sabaqi: '', sabaqiFrom: '', sabaqiTo: '', sabaqiGrade: '', manzil: '', manzilFrom: '', manzilTo: '', manzilGrade: '', remarks: '' }); setFieldErrors({}); };

  const validateRange = (key: string, from: string, to: string) => {
    const f = parseInt(from), t = parseInt(to);
    if (from && to && !isNaN(f) && !isNaN(t) && f > t) {
      setFieldErrors(prev => ({ ...prev, [key]: `Ayat mula (${f}) tidak boleh lebih besar daripada ayat akhir (${t})` }));
    } else {
      setFieldErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) { alert('Sila pilih pelajar terlebih dahulu.'); return; }
    if (Object.keys(fieldErrors).length > 0) { alert('Sila betulkan ralat dalam borang sebelum menyimpan.'); return; }
    if (!teacherId) {
      alert('Ralat: Profil murabbi tidak dijumpai. Sila log masuk semula.');
      return;
    }
    
    const ayahCount =
      (formData.sabaqTo ? parseInt(formData.sabaqTo) - parseInt(formData.sabaqFrom || '0') : 0) +
      (formData.sabaqiTo ? parseInt(formData.sabaqiTo) - parseInt(formData.sabaqiFrom || '0') : 0) +
      (formData.manzilTo ? parseInt(formData.manzilTo) - parseInt(formData.manzilFrom || '0') : 0);

    const payload = {
      studentId: selectedStudent,
      teacherId: teacherId,
      date: recordDate,
      sabaq: { surah: formData.sabaq, from: parseInt(formData.sabaqFrom || '0'), to: parseInt(formData.sabaqTo || '0'), grade: formData.sabaqGrade },
      sabaqi: { surah: formData.sabaqi, from: parseInt(formData.sabaqiFrom || '0'), to: parseInt(formData.sabaqiTo || '0'), grade: formData.sabaqiGrade },
      manzil: { surah: formData.manzil, from: parseInt(formData.manzilFrom || '0'), to: parseInt(formData.manzilTo || '0'), grade: formData.manzilGrade },
      remarks: formData.remarks,
      ayahCount: Math.max(0, ayahCount),
    };

    setPendingPayload(payload);
    setShowConfirm(true);
  };

  const doSave = async () => {
    setShowConfirm(false);
    if (!pendingPayload) return;
    try {
      const resp = await axios.post('/api/hafazan-records', pendingPayload);
      if (resp.status === 201 || resp.status === 200) {
        dispatch({ type: 'RECORD_HAFAZAN', payload: { ...pendingPayload, id: resp.data.id } });
        setShowSuccess(true);
        setPendingPayload(null);
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedStudent('');
          reset();
        }, 2000);
      }
    } catch (err: any) {
      console.error('API Error:', err);
      alert('Gagal menyimpan rekod: ' + (err.response?.data?.message || 'Ralat sambungan rangkaian.'));
    }
  };

  const gradeOptions: Grade[] = ['Mumtaz', 'Jayyid Jiddan', 'Jayyid', 'Maqbul'];
  const gradeLabels: Record<Grade, string> = { 'Mumtaz': 'Mumtaz (ممتاز)', 'Jayyid Jiddan': 'Jayyid Jiddan (جيد جداً)', 'Jayyid': 'Jayyid (جيد)', 'Maqbul': 'Maqbul (مقبول)', '': '' };
  const inCls = (err?: string) => `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${err ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-green-500'}`;

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={showConfirm}
        title="Simpan Rekod Hafazan"
        message={`Adakah anda pasti ingin menyimpan rekod hafazan untuk tarikh ${recordDate}? Data ini akan dikemas kini dalam sistem dan ibu bapa akan dimaklumkan.`}
        confirmLabel="Ya, Simpan"
        confirmColor="green"
        onConfirm={doSave}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Rekod Hafazan</h2>
          <p className="text-gray-600 mt-1">Rekodkan Sabak, Sabki, dan Manzil untuk pelajar</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
          <BookOpen className="w-5 h-5" /><span className="font-medium">Ibu bapa dimaklumkan semasa simpan</span>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Rekod Hafazan Disimpan!</p>
            <p className="text-sm text-green-700">Ibu bapa telah dimaklumkan serta merta.</p>
          </div>
        </div>
      )}

      {/* Automated Progress Insights */}
      {selectedStudent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top duration-500">
          <div className="bg-white p-4 rounded-xl border-2 border-green-100 shadow-sm">
            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Jumlah Hafazan Baru</p>
            <p className="text-2xl font-black text-slate-800">
              {state.hafazanRecords.filter(h => h.studentId === selectedStudent).reduce((acc, curr) => acc + curr.ayahCount, 0)} <span className="text-xs font-bold text-slate-400">Ayah</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Purata Sabak Harian</p>
            <p className="text-2xl font-black text-slate-800">
              {Math.round(state.hafazanRecords.filter(h => h.studentId === selectedStudent).length > 0 
                ? state.hafazanRecords.filter(h => h.studentId === selectedStudent).reduce((acc, curr) => acc + curr.ayahCount, 0) / state.hafazanRecords.filter(h => h.studentId === selectedStudent).length 
                : 0)} <span className="text-xs font-bold text-slate-400">Ayah/Sesi</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-purple-100 shadow-sm">
            <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Sasaran Seterusnya</p>
            <p className="text-sm font-bold text-slate-600 mt-1 italic">
              {(() => {
                const last = state.hafazanRecords.filter(h => h.studentId === selectedStudent)[0];
                return last ? `Sambung ${last.sabaq.surah} ayat ${last.sabaq.to + 1}` : 'Mula Sabak Baru';
              })()}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class, Student & Date selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="classSelect">Pilih Kelas *</label>
              <select id="classSelect" value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudent(''); }} className={inCls()} aria-required="true">
                {teacherClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="studentSelect">Pilih Pelajar *</label>
              <select id="studentSelect" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className={inCls(!selectedStudent && false ? 'err' : '')} required aria-required="true">
                <option value="">-- Pilih pelajar --</option>
                {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {!selectedStudent && <p className="text-xs text-amber-600 mt-1">Sila pilih pelajar untuk meneruskan.</p>}
            </div>
          </div>

          {/* Date field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="recordDate">Tarikh Rekod *</label>
            <input
              id="recordDate"
              type="date"
              value={recordDate}
              onChange={e => setRecordDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={inCls()}
              required
              aria-required="true"
            />
            <p className="text-xs text-gray-400 mt-1">Tarikh sesi hafazan berlaku. Lalai: hari ini.</p>
          </div>

          {/* SABAQ */}
          {[
            { key: 'sabaq', label: 'Sabak (Hafalan Baharu)', color: 'green', num: 1 },
            { key: 'sabaqi', label: 'Sabki (Mengulang Hafalan Sedang Dihafal)', color: 'blue', num: 2 },
            { key: 'manzil', label: 'Manzil (Mengulangi Juzuk Sudah Dihafal)', color: 'purple', num: 3 },
          ].map(section => (
            <div key={section.key} className={`p-6 bg-${section.color}-50 rounded-xl border-2 border-${section.color}-200`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 bg-${section.color}-600 text-white rounded-full flex items-center justify-center font-semibold`}>{section.num}</div>
                <h3 className="text-lg font-semibold text-gray-900">{section.label}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`${section.key}-surah`}>Surah</label>
                  <input id={`${section.key}-surah`} type="text" value={(formData as any)[section.key]} onChange={e => setFormData({ ...formData, [section.key]: e.target.value })} placeholder="cth: Al-Baqarah" className={inCls()} aria-label={`Surah untuk ${section.label}`} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`${section.key}-from`}>Dari Ayat</label>
                    <input
                      id={`${section.key}-from`}
                      type="number" min="1"
                      value={(formData as any)[`${section.key}From`]}
                      onChange={e => { setFormData({ ...formData, [`${section.key}From`]: e.target.value }); validateRange(`${section.key}Range`, e.target.value, (formData as any)[`${section.key}To`]); }}
                      placeholder="1"
                      className={inCls(fieldErrors[`${section.key}Range`])}
                      aria-describedby={fieldErrors[`${section.key}Range`] ? `${section.key}-range-err` : undefined}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`${section.key}-to`}>Hingga Ayat</label>
                    <input
                      id={`${section.key}-to`}
                      type="number" min="1"
                      value={(formData as any)[`${section.key}To`]}
                      onChange={e => { setFormData({ ...formData, [`${section.key}To`]: e.target.value }); validateRange(`${section.key}Range`, (formData as any)[`${section.key}From`], e.target.value); }}
                      placeholder="10"
                      className={inCls(fieldErrors[`${section.key}Range`])}
                      aria-describedby={fieldErrors[`${section.key}Range`] ? `${section.key}-range-err` : undefined}
                    />
                  </div>
                  {fieldErrors[`${section.key}Range`] && (
                    <p id={`${section.key}-range-err`} className="col-span-2 text-xs text-red-600 mt-1" role="alert">{fieldErrors[`${section.key}Range`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`${section.key}-grade`}>Gred Prestasi</label>
                  <select id={`${section.key}-grade`} value={(formData as any)[`${section.key}Grade`]} onChange={e => setFormData({ ...formData, [`${section.key}Grade`]: e.target.value as Grade })} className={inCls()} aria-label={`Gred untuk ${section.label}`}>
                    <option value="">-- Pilih gred --</option>
                    {gradeOptions.map(g => <option key={g} value={g}>{gradeLabels[g]}</option>)}
                  </select>
                  {(formData as any)[section.key] && !(formData as any)[`${section.key}Grade`] && (
                    <p className="text-xs text-amber-600 mt-1" role="alert">Sila pilih gred untuk sesi ini.</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="remarks">Catatan Murabbi / Murabbiah</label>
            <textarea id="remarks" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} rows={4} placeholder="Tambah sebarang ulasan atau pemerhatian..." className={inCls()} maxLength={500} aria-label="Catatan tambahan murabbi" />
            <p className="text-xs text-gray-400 mt-1 text-right">{formData.remarks.length}/500</p>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"><Save className="w-5 h-5" />Simpan Rekod</button>
            <button type="button" onClick={reset} className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"><RefreshCw className="w-5 h-5" />Tetapkan Semula</button>
          </div>
        </form>
      </div>

      {/* Voice Recorder — per-student session recording */}
      {selectedStudent && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#1A4D50]" /> Rakaman Suara Sesi Ini
          </h4>
          <p className="text-xs text-gray-500 mb-4">Rekod bacaan pelajar semasa sesi untuk rujukan dan semakan kemudian hari.</p>
          <VoiceRecorder
            studentId={selectedStudent}
            surah={formData.sabaq}
            ayatFrom={formData.sabaqFrom}
            ayatTo={formData.sabaqTo}
            recordedBy="teacher"
          />
        </div>
      )}

      {/* Recent Records */}
      {selectedStudent && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Rekod Terkini untuk {state.students.find(s => s.id === selectedStudent)?.name}</h4>
          <div className="space-y-2">
            {state.hafazanRecords.filter(h => h.studentId === selectedStudent).slice(0, 3).map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-xs">{h.date}</span>
                <span className="font-medium">{h.sabaq.surah} {h.sabaq.from}–{h.sabaq.to}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${normalizeGrade(h.sabaq.grade) === 'Mumtaz' ? 'bg-green-100 text-green-700' : normalizeGrade(h.sabaq.grade) === 'Jayyid Jiddan' ? 'bg-teal-100 text-teal-700' : normalizeGrade(h.sabaq.grade) === 'Jayyid' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{normalizeGrade(h.sabaq.grade)}</span>
                <span className="text-gray-500">{h.ayahCount} ayah</span>
              </div>
            ))}
            {state.hafazanRecords.filter(h => h.studentId === selectedStudent).length === 0 && <p className="text-gray-400 text-sm">Tiada rekod lagi.</p>}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">📚 Tentang Sistem Rekod Hafazan</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Sabak:</strong> Hafalan baharu yang akan diperdengarkan setiap hari kepada guru</li>
          <li>• <strong>Sabki:</strong> Mengulang hafalan pada juzuk tertentu yang sedang dihafal</li>
          <li>• <strong>Manzil:</strong> Mengulangi juzuk yang sudah dihafal</li>
          <li>• Semua rekod disimpan secara automatik dan ibu bapa menerima pemberitahuan segera</li>
        </ul>
      </div>
    </div>
  );
}
