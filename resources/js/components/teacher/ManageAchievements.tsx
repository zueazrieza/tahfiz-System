import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Award, Star, Trash2, Plus, Users, Search, Loader2, BookOpen, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';

const HAFAZAN_LEVELS = [
  'Level 1', 'Level 2', 'Level 3', 'Level 4', 
  'Warrior', 'Elite', 'Master', 
  'Silver S', 'Gold G', 'Titanium T', 
  'Special Edition', 'Hafiz Level 1'
];

export function ManageAchievements() {
  const { state } = useAppStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]); // Use local state for students from API
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [newAchievement, setNewAchievement] = useState({
    name: '',
    type: 'achievement' // achievement or badge
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const resp = await axios.get('/api/teacher/students');
      setStudents(resp.data);
    } catch (err) {
      console.error('Failed to fetch students', err);
      // Fallback to context students if API fails (though API is preferred for real IDs)
      setStudents(state.students);
    } finally {
      setStudentsLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedStudentId) {
      fetchAchievements(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchAchievements = async (id: string) => {
    try {
      setLoading(true);
      const resp = await axios.get(`/api/achievements/student/${id}`);
      setAchievements(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e?: React.FormEvent, customName?: string) => {
    if (e) e.preventDefault();
    const name = customName || newAchievement.name;
    if (!selectedStudentId || !name) return;

    try {
      await axios.post('/api/achievements', {
        student_id: selectedStudentId,
        name: name,
        type: customName ? 'badge' : newAchievement.type,
        earned_at: new Date().toISOString()
      });
      setNewAchievement({ name: '', type: 'achievement' });
      fetchAchievements(selectedStudentId);
    } catch (err) {
      alert('Gagal menambah pencapaian.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pencapaian ini?')) return;
    try {
      await axios.delete(`/api/achievements/${id}`);
      fetchAchievements(selectedStudentId);
    } catch (err) {
      alert('Gagal memadam.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 mb-2">Urus Pencapaian & Aras Pelajar</h2>
        <p className="text-slate-500 font-medium">Berikan lencana Aras (Level) atau anugerah khas kepada pelajar selepas penilaian.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm h-[600px] flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <input 
                type="text" 
                placeholder="Cari pelajar..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6FC7CB] transition-all"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {studentsLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Memuatkan pelajar...</span>
                </div>
              ) : filteredStudents.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentId(String(s.id))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedStudentId === String(s.id) ? 'bg-[#6FC7CB] text-white shadow-lg' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedStudentId === String(s.id) ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {s.name.charAt(0)}
                  </div>
                  <span className="font-bold text-sm truncate">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedStudentId ? (
            <div className="h-full min-h-[400px] bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <Users size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">Sila pilih pelajar dari senarai</p>
            </div>
          ) : (
            <>
              {/* AWARD LEVEL BADGE - The specific request */}
              <div className="bg-[#1A4D50] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Award size={120} className="-rotate-12" />
                </div>
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                  <BookOpen className="text-teal-300" /> BERIKAN ARAS HAFAZAN (LEVEL)
                </h3>
                <p className="text-teal-100/70 text-sm mb-6 leading-relaxed">
                  Berikan lencana ini selepas pelajar berjaya mengulang balik tafsiran (Tadabbur) atau mencapai kualiti hafalan yang ditetapkan.
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {HAFAZAN_LEVELS.map(level => {
                    const hasIt = achievements.some(a => a.name === level);
                    return (
                      <button
                        key={level}
                        disabled={hasIt}
                        onClick={() => handleAdd(undefined, level)}
                        className={`px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
                          hasIt 
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 cursor-default' 
                            : 'bg-white/5 border-white/10 hover:bg-white hover:text-[#1A4D50] hover:border-white'
                        }`}
                      >
                        {hasIt ? <CheckCircle2 size={14} /> : null}
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Achievement Form */}
              <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Star className="text-[#6FC7CB]" /> Anugerah Khas / Lain-lain
                </h3>
                <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="Nama Anugerah (cth: Pelajar Mithali)" 
                    value={newAchievement.name}
                    onChange={e => setNewAchievement({...newAchievement, name: e.target.value})}
                    className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#6FC7CB]"
                    required
                  />
                  <select 
                    value={newAchievement.type}
                    onChange={e => setNewAchievement({...newAchievement, type: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#6FC7CB] font-bold text-slate-600"
                  >
                    <option value="achievement">Anugerah Khas</option>
                    <option value="badge">Lencana (Badge)</option>
                  </select>
                  <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-black transition-all flex items-center gap-2">
                    <Plus size={20} /> TAMBAH
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 px-2">Rekod Pencapaian Semasa</h3>
                {loading ? (
                   <div className="text-center py-10 text-slate-400">
                     <Loader2 className="animate-spin mx-auto mb-2" /> Memuatkan...
                   </div>
                 ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                    {achievements.map(a => (
                      <div key={a.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-full flex items-center justify-center ${a.type === 'badge' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'}`}>
                            {a.type === 'badge' ? <Award size={20} /> : <Trophy size={20} />}
                          </div>
                          <div>
                            <p className="font-black text-slate-800">{a.name}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              {a.type === 'badge' ? 'Lencana Aras' : 'Anugerah Khas'}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(a.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {achievements.length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                        <Trophy size={32} className="mx-auto mb-2 opacity-10" />
                        <p className="font-bold text-xs uppercase tracking-widest">Tiada pencapaian ditemui</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
