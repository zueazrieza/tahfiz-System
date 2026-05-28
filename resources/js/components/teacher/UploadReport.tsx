import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../../store/AppContext';
import { Upload, FileText, CheckCircle, Target, Award, Plus } from 'lucide-react';

export function UploadReport() {
  const { state } = useAppStore();
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const teacher = state.teachers.find(t => 
    t.email === authUser.email || 
    (authUser.name && t.name.toLowerCase().includes(authUser.name.toLowerCase().split(' ').slice(-1)[0]))
  ) ?? state.teachers[0];
  
  const [activeTab, setActiveTab] = useState<'report'|'target'>('report');
  
  // Report state
  const [content, setContent] = useState('');
  const [score, setScore] = useState(0);
  const [saved, setSaved] = useState(false);
  const pastReports = state.reports.filter(r => r.teacherId === teacher?.id).sort((a, b) => b.date.localeCompare(a.date));

  // Target state
  // Get classes for this teacher
  const teacherClasses = state.classes.filter(c => 
    String(c.teacherId) === String(teacher?.id) || 
    String(c.teacher_id) === String(teacher?.id) ||
    teacher?.classIds?.includes(String(c.id))
  ).map(c => String(c.id));

  const myStudents = state.students.filter(s => {
    const sCid = String(s.classId || s.class_id);
    const sTid = String(s.teacherId || s.teacher_id);
    return teacherClasses.includes(sCid) || (sTid !== 'undefined' && sTid === String(teacher?.id));
  });
  const [selectedStudent, setSelectedStudent] = useState('');
  const [targetM1, setTargetM1] = useState('');
  const [targetM2, setTargetM2] = useState('');
  const [targetM3, setTargetM3] = useState('');
  const [targetSaved, setTargetSaved] = useState(false);

  const inCls = 'w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm';

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Logic for saving weekly report to be viewed by Admin
      await axios.post('/api/reports/weekly', {
        teacher_id: teacher?.id,
        content,
        weekly_score: score,
        date: new Date().toISOString().split('T')[0]
      });
      setContent(''); setScore(0);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal menghantar laporan mingguan.');
    }
  };

  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
       alert('Sila pilih pelajar.');
       return;
    }
    try {
      const combinedTarget = `${targetM1} | ${targetM2} | ${targetM3}`;
      await axios.post('/api/students/set-target', {
        student_id: selectedStudent,
        target: combinedTarget
      });
      setTargetM1(''); setTargetM2(''); setTargetM3('');
      setTargetSaved(true);
      setTimeout(() => setTargetSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal mengemaskini target hafazan.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Laporan & Sasaran</h2>
          <p className="text-slate-500 font-medium mt-1">Hantar laporan mingguan dan tetapkan sasaran pelajar</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('report')} className={`pb-3 text-sm font-bold px-4 ${activeTab === 'report' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>
           Laporan Mingguan
        </button>
        <button onClick={() => setActiveTab('target')} className={`pb-3 text-sm font-bold px-4 ${activeTab === 'target' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>
           Penetapan Sasaran (Target)
        </button>
      </div>

      {activeTab === 'report' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" /> Hantar Laporan Mingguan
            </h3>
            
            {saved && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <p className="font-bold text-emerald-900 text-sm">Laporan berjaya dihantar ke Admin!</p>
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pencapaian Mingguan Kelas</label>
                <textarea 
                  required rows={5} value={content} onChange={e => setContent(e.target.value)} 
                  placeholder="Huraikan prestasi kelas sepanjang minggu ini..." 
                  className={inCls + " resize-none"} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Markah KPI (Berdasarkan Target)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" min="0" max="100" required value={score} onChange={e => setScore(Number(e.target.value))} 
                    className={inCls + " w-32 font-bold text-lg"} 
                  />
                  <span className="text-slate-400 text-sm font-bold">/ 100</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Laporan dengan markah KPI tertinggi akan diiktiraf dalam Weekly Wins oleh Admin.</p>
              </div>
              <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-bold shadow-md transition-all">
                 Hantar Laporan Ke Admin
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Sejarah Laporan
            </h3>
            {pastReports.length === 0 ? (
              <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">Tiada laporan mingguan dihantar.</div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {pastReports.map(r => (
                  <div key={r.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 text-sm">Minggu {r.date}</p>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{r.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'target' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm max-w-2xl mx-auto">
           <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
             <Target className="w-5 h-5 text-purple-600" /> Tetapkan Sasaran 3 Bulan (Persetujuan Bersama)
           </h3>

           {targetSaved && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <p className="font-bold text-emerald-900 text-sm">Sasaran hafazan berjaya dikemaskini!</p>
              </div>
           )}

           <form onSubmit={handleTargetSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Pelajar</label>
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className={inCls}>
                  <option value="">-- Pilih Pelajar --</option>
                  {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} (Selesai: {s.juzukCompleted ?? 0} Juzuk)</option>)}
                </select>
              </div>

              <div className="space-y-4">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Format Target: (Bulan 1 | Bulan 2 | Bulan 3)</p>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400">Bulan 1 (Cth: 123)</label>
                       <input required type="text" placeholder="Juzuk / Ayat" value={targetM1} onChange={e => setTargetM1(e.target.value)} className={inCls} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400">Bulan 2 (Cth: 456)</label>
                       <input required type="text" placeholder="Juzuk / Ayat" value={targetM2} onChange={e => setTargetM2(e.target.value)} className={inCls} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400">Bulan 3 (Cth: 789)</label>
                       <input required type="text" placeholder="Juzuk / Ayat" value={targetM3} onChange={e => setTargetM3(e.target.value)} className={inCls} />
                    </div>
                 </div>
                 <p className="text-xs text-slate-500 italic">Contoh gabungan: 123 | 456 | 789. Pastikan sasaran ini dibincangkan bersama pelajar.</p>
              </div>

              <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold shadow-md transition-all flex justify-center items-center gap-2">
                 <Plus className="w-4 h-4" /> Kemaskini Sasaran Pelajar
              </button>
           </form>
        </div>
      )}
    </div>
  );
}
