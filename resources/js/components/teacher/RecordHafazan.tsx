import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, RefreshCw, BookOpen, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { Grade } from '../../store/mockData';

export function RecordHafazan() {
  const { state, dispatch } = useAppStore();

  // Get the logged-in teacher's ID from sessionStorage
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const teacher = state.teachers.find(t => 
    t.email === authUser.email || 
    (authUser.name && t.name.toLowerCase().includes(authUser.name.toLowerCase().split(' ').slice(-1)[0]))
  ) ?? state.teachers[0];
  const teacherClasses = state.classes.filter(c => teacher?.classIds.some(cid => String(cid) === String(c.id)));
  const [selectedClassId, setSelectedClassId] = useState(teacherClasses[0]?.id ?? '');
  const studentsInClass = state.students.filter(s => String(s.classId) === String(selectedClassId));

  const [selectedStudent, setSelectedStudent] = useState('');
  const [formData, setFormData] = useState({
    sabaq: '', sabaqFrom: '', sabaqTo: '', sabaqGrade: '' as Grade,
    sabaqi: '', sabaqiFrom: '', sabaqiTo: '', sabaqiGrade: '' as Grade,
    manzil: '', manzilFrom: '', manzilTo: '', manzilGrade: '' as Grade,
    remarks: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const reset = () => setFormData({ sabaq: '', sabaqFrom: '', sabaqTo: '', sabaqGrade: '', sabaqi: '', sabaqiFrom: '', sabaqiTo: '', sabaqiGrade: '', manzil: '', manzilFrom: '', manzilTo: '', manzilGrade: '', remarks: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!confirm('Adakah anda pasti ingin menyimpan rekod hafazan ini?')) {
      return;
    }
    
    const ayahCount =
      (formData.sabaqTo ? parseInt(formData.sabaqTo) - parseInt(formData.sabaqFrom || '0') : 0) +
      (formData.sabaqiTo ? parseInt(formData.sabaqiTo) - parseInt(formData.sabaqiFrom || '0') : 0) +
      (formData.manzilTo ? parseInt(formData.manzilTo) - parseInt(formData.manzilFrom || '0') : 0);

    const payload = {
      studentId: selectedStudent,
      teacherId: teacher?.id ?? 1,
      date: new Date().toISOString().split('T')[0],
      sabaq: { surah: formData.sabaq, from: parseInt(formData.sabaqFrom || '0'), to: parseInt(formData.sabaqTo || '0'), grade: formData.sabaqGrade },
      sabaqi: { surah: formData.sabaqi, from: parseInt(formData.sabaqiFrom || '0'), to: parseInt(formData.sabaqiTo || '0'), grade: formData.sabaqiGrade },
      manzil: { surah: formData.manzil, from: parseInt(formData.manzilFrom || '0'), to: parseInt(formData.manzilTo || '0'), grade: formData.manzilGrade },
      remarks: formData.remarks,
      ayahCount: Math.max(0, ayahCount),
    };

    try {
      const resp = await axios.post('/api/hafazan-records', payload);

      if (resp.status === 201 || resp.status === 200) {
        dispatch({ type: 'RECORD_HAFAZAN', payload });
        setShowSuccess(true);
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

  const gradeOptions: Grade[] = ['Mumtaz', 'Jayyid', 'Maqbul', 'Perlu Penambahbaikan'];
  const gradeLabels: Record<Grade, string> = { 'Mumtaz': 'Mumtaz (ممتاز)', 'Jayyid': 'Jayyid (جيد)', 'Maqbul': 'Maqbul (مقبول)', 'Perlu Penambahbaikan': 'Perlu Penambahbaikan', '': '' };
  const inCls = 'w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Rekod Hafazan</h2>
          <p className="text-gray-600 mt-1">Rekodkan Sabaq, Sabaq Para, dan Dhor untuk pelajar</p>
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
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Purata Sabaq Harian</p>
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
                return last ? `Sambung ${last.sabaq.surah} ayat ${last.sabaq.to + 1}` : 'Mula Sabaq Baru';
              })()}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class & Student selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas *</label>
              <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudent(''); }} className={inCls}>
                {teacherClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {state.teachers.find(t => String(t.id) === String(c.teacherId))?.name ?? 'Tiada Murabbi'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Pelajar *</label>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className={inCls} required>
                <option value="">Pilih pelajar...</option>
                {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* SABAQ */}
          {[
            { key: 'sabaq', label: 'Sabaq (Hafazan Baharu)', color: 'green', num: 1 },
            { key: 'sabaqi', label: 'Sabaq Para (Semakan Terbaharu)', color: 'blue', num: 2 },
            { key: 'manzil', label: 'Dhor (Ulangan Lama)', color: 'purple', num: 3 },
          ].map(section => (
            <div key={section.key} className={`p-6 bg-${section.color}-50 rounded-xl border-2 border-${section.color}-200`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 bg-${section.color}-600 text-white rounded-full flex items-center justify-center font-semibold`}>{section.num}</div>
                <h3 className="text-lg font-semibold text-gray-900">{section.label}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Surah</label>
                  <input type="text" value={(formData as any)[section.key]} onChange={e => setFormData({ ...formData, [section.key]: e.target.value })} placeholder="e.g., Al-Baqarah" className={inCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Ayah</label>
                    <input type="number" value={(formData as any)[`${section.key}From`]} onChange={e => setFormData({ ...formData, [`${section.key}From`]: e.target.value })} placeholder="1" className={inCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Ayah</label>
                    <input type="number" value={(formData as any)[`${section.key}To`]} onChange={e => setFormData({ ...formData, [`${section.key}To`]: e.target.value })} placeholder="10" className={inCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gred Prestasi</label>
                  <select value={(formData as any)[`${section.key}Grade`]} onChange={e => setFormData({ ...formData, [`${section.key}Grade`]: e.target.value as Grade })} className={inCls}>
                    <option value="">Pilih gred</option>
                    {gradeOptions.map(g => <option key={g} value={g}>{gradeLabels[g]}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Murabbi / Murabbiah</label>
            <textarea value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} rows={4} placeholder="Tambah sebarang ulasan atau pemerhatian..." className={inCls} />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"><Save className="w-5 h-5" />Simpan Rekod</button>
            <button type="button" onClick={reset} className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"><RefreshCw className="w-5 h-5" />Tetapkan Semula</button>
          </div>
        </form>
      </div>

      {/* Recent Records */}
      {selectedStudent && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Rekod Terkini untuk {state.students.find(s => s.id === selectedStudent)?.name}</h4>
          <div className="space-y-2">
            {state.hafazanRecords.filter(h => h.studentId === selectedStudent).slice(0, 3).map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-600">{h.date}</span>
                <span className="font-medium">{h.sabaq.surah} {h.sabaq.from}–{h.sabaq.to}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.sabaq.grade === 'Mumtaz' ? 'bg-green-100 text-green-700' : h.sabaq.grade === 'Jayyid' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{h.sabaq.grade}</span>
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
          <li>• <strong>Sabaq:</strong> Surah/Ayat baru yang dihafal hari ini</li>
          <li>• <strong>Sabaq Para:</strong> Semakan terbaharu atau ulang kaji (jangka pendek)</li>
          <li>• <strong>Dhor:</strong> Ulangan lama atau pengekalan jangka panjang</li>
          <li>• Semua rekod disimpan secara automatik dan ibu bapa menerima pemberitahuan segera</li>
        </ul>
      </div>
    </div>
  );
}
