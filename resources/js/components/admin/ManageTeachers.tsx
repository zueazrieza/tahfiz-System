import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, FileSpreadsheet, Eye, User, Briefcase, Phone, BookOpen, HeartPulse, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import axios from 'axios';

export function ManageTeachers() {
  const { state, dispatch } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignHalaqahModal, setShowAssignHalaqahModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', icNo: '', username: '', gender: 'M' });
  const [addClassForm, setAddClassForm] = useState({ name: '', capacity: 20, teacherId: '' });
  const [editClassForm, setEditClassForm] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  
  // Search and Pagination state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, last_page: 1, from: 0, to: 0 });
  const [showTrash, setShowTrash] = useState(false);
  const [trashedTeachers, setTrashedTeachers] = useState<any[]>([]);
  const [trashedLoading, setTrashedLoading] = useState(false);

  const inputCls = 'w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500';

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get('/api/classes');
        dispatch({ type: 'SET_CLASSES', payload: response.data });
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    const fetchStudents = async () => {
      try {
        const response = await axios.get('/api/students', { params: { per_page: 500 } });
        const students = response.data?.data ?? response.data;
        dispatch({ type: 'SET_STUDENTS', payload: students });
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchClasses();
    fetchStudents();
  }, [dispatch]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('/api/teachers', {
          params: {
            page: page,
            search: debouncedSearch
          }
        });
        // Laravel paginator returns data in .data.data
        const { data, ...info } = response.data;
        dispatch({ type: 'SET_TEACHERS', payload: data });
        setPaginationInfo({
          total: info.total,
          last_page: info.last_page,
          from: info.from,
          to: info.to
        });
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };
    fetchTeachers();
  }, [dispatch, page, debouncedSearch]);

  const getStudentCount = (teacherId: string | number) =>
    state.students.filter(s => String(s.teacherId) === String(teacherId)).length;

  const getClassNames = (classIds: any) => {
    if (!classIds) return '—';
    const ids = Array.isArray(classIds) ? classIds : JSON.parse(classIds || '[]');
    return ids.map((id: any) => state.classes.find(c => String(c.id) === String(id))?.name ?? id).join(', ') || '—';
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Adakah anda pasti ingin menyimpan data guru baharu ini?')) {
      return;
    }
    try {
      const response = await axios.post('/api/teachers', {
        ...addForm,
        joined_date: new Date().toISOString().split('T')[0],
        status: 'Aktif'
      });
      dispatch({ type: 'ADD_TEACHER', payload: response.data });
      setAddForm({ name: '', email: '', phone: '', icNo: '', username: '', gender: 'M' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('Gagal menambah guru. Sila semak input anda.');
    }
  };

  const fetchTrashedTeachers = async () => {
    setTrashedLoading(true);
    try {
      const res = await axios.get('/api/teachers/trashed');
      setTrashedTeachers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setTrashedLoading(false);
    }
  };

  const handleDelete = async (teacher: any) => {
    if (confirm(`Guru ${teacher.name} akan dipindahkan ke Tong Sampah dan boleh dipulihkan kemudian. Teruskan?`)) {
      try {
        await axios.delete(`/api/teachers/${teacher.id}`);
        dispatch({ type: 'DELETE_TEACHER', payload: { id: teacher.id } });
        alert(`${teacher.name} dipadam dan boleh dipulihkan melalui Tong Sampah.`);
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Gagal memadam guru.');
      }
    }
  };

  const handleRestoreTeacher = async (teacher: any) => {
    try {
      const res = await axios.post(`/api/teachers/${teacher.id}/restore`);
      alert(res.data.message);
      fetchTrashedTeachers();
    } catch (e) {
      alert('Gagal memulihkan guru.');
    }
  };

  const handleForceDeleteTeacher = async (teacher: any) => {
    if (confirm(`AMARAN: ${teacher.name} akan dipadam KEKAL. Teruskan?`)) {
      try {
        await axios.delete(`/api/teachers/${teacher.id}/force`);
        fetchTrashedTeachers();
      } catch (e) {
        alert('Gagal memadam rekod.');
      }
    }
  };

  const toggleStatus = async (teacher: any) => {
    const newStatus = teacher.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
    if (!confirm(`Adakah anda pasti ingin menukar status guru ${teacher.name} kepada ${newStatus}?`)) {
      return;
    }
    try {
      const response = await axios.put(`/api/teachers/${teacher.id}`, { status: newStatus });
      dispatch({ type: 'EDIT_TEACHER', payload: response.data });

    } catch (error) {
      console.error('Error toggling teacher status:', error);
      alert('Gagal mengemas kini status guru.');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Adakah anda pasti ingin mengemaskini maklumat guru ini?')) {
      return;
    }
    try {
      const response = await axios.put(`/api/teachers/${editForm.id}`, editForm);
      dispatch({ type: 'EDIT_TEACHER', payload: response.data });
      setShowEditModal(false);
      setEditForm(null);
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Gagal mengemas kini guru.');
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Adakah anda pasti ingin menambah kelas baharu ini?')) {
      return;
    }
    try {
      const response = await axios.post('/api/classes', {
        ...addClassForm,
        studentIds: []
      });
      dispatch({ type: 'ADD_CLASS', payload: response.data });
      setAddClassForm({ name: '', capacity: 20, teacherId: '' });
      setShowAddClassModal(false);
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Gagal menambah kelas.');
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Adakah anda pasti ingin mengemaskini maklumat kelas ini?')) {
      return;
    }
    try {
      await axios.put(`/api/classes/${editClassForm.id}`, {
        name: editClassForm.name,
        capacity: editClassForm.capacity,
        teacherId: editClassForm.teacherId
      });
      const classesRes = await axios.get('/api/classes');
      dispatch({ type: 'SET_CLASSES', payload: classesRes.data });
      setShowEditClassModal(false);
      setEditClassForm(null);
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Gagal mengemas kini kelas.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Urus Guru & Kelas</h2>
          <p className="text-gray-600 mt-1">Pengurusan guru dan kelas halaqah ({paginationInfo.total} jumlah)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau emel..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus className="w-5 h-5" /> Tambah Guru
          </button>
          <button 
            onClick={() => setShowAssignHalaqahModal(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
          >
            <BookOpen className="w-5 h-5" /> Assign Halaqah
          </button>


          <a
            href="/api/export/teachers"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-all font-semibold"
          >
            <FileSpreadsheet className="w-5 h-5" /> Export Excel
          </a>
          <button
            onClick={() => { setShowTrash(!showTrash); if (!showTrash) fetchTrashedTeachers(); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-semibold transition-all ${showTrash ? 'bg-red-50 border-red-300 text-red-600' : 'bg-white border-gray-200 text-gray-500 hover:text-red-500'}`}
          >
            <Trash2 className="w-4 h-4" /> Tong Sampah
          </button>
        </div>
      </div>

      {/* Trash panel */}
      {showTrash && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <h3 className="font-bold text-red-600 text-sm uppercase tracking-wider">Guru Dipadam — Boleh Dipulihkan</h3>
          </div>
          {trashedLoading ? (
            <div className="p-8 text-center text-slate-400">Memuatkan...</div>
          ) : trashedTeachers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Tiada rekod dalam tong sampah.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Nama','Emel','Telefon','Tarikh Dipadam','Tindakan'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trashedTeachers.map(t => (
                  <tr key={t.id} className="hover:bg-red-50/30">
                    <td className="px-6 py-3 font-semibold text-slate-700">{t.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{t.email}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{t.phone ?? '—'}</td>
                    <td className="px-6 py-3 text-sm text-red-400">{t.deletedAt}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleRestoreTeacher(t)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold">
                          <RotateCcw className="w-3 h-3" /> Pulihkan
                        </button>
                        <button onClick={() => handleForceDeleteTeacher(t)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold">
                          <Trash2 className="w-3 h-3" /> Padam Kekal
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.teachers.map(teacher => (
          <div key={teacher.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">{teacher.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setSelectedTeacher(teacher); setShowViewModal(true); }} className="p-1 text-gray-400 hover:text-[#6FC7CB]" aria-label={`Lihat profil ${teacher.name}`}><Eye className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(teacher)} className="p-1 text-gray-400 hover:text-red-600" aria-label={`Padam ${teacher.name}`}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Emel:</span><span className="text-gray-900 truncate ml-2">{teacher.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Telefon:</span><span className="text-gray-900">{teacher.phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Halaqah:</span><span className="text-gray-900">{getClassNames(teacher.classIds)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Pelajar:</span><span className="font-semibold text-green-600">{getStudentCount(teacher.id)}</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex">
              <button 
                onClick={() => { setEditForm(teacher); setShowEditModal(true); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#F4F4F9] text-[#2D3142] font-bold rounded-xl hover:bg-gray-200 transition-all border-none cursor-pointer"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {paginationInfo.total > 0 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600">
            Menunjukkan <span className="font-medium text-gray-900">{paginationInfo.from}</span> hingga <span className="font-medium text-gray-900">{paginationInfo.to}</span> daripada <span className="font-medium text-gray-900">{paginationInfo.total}</span> guru
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center px-4 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg bg-gray-50">
              Muka Surat {page} daripada {paginationInfo.last_page}
            </div>
            <button
              onClick={() => setPage((p: number) => Math.min(paginationInfo.last_page, p + 1))}
              disabled={page === paginationInfo.last_page}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {paginationInfo.total === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Tiada guru dijumpai</h3>
          <p className="text-gray-500 mt-1">Cuba tukar carian anda atau tambah guru baharu.</p>
        </div>
      )}

      {/* Classes Overview - High Fidelity Design */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm mt-8">
        <h3 className="text-xl font-bold text-[#2D3142] mb-8">Senarai Halaqah & Guru</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {state.classes.map(cls => {
            const studentCount = cls.studentIds.length;
            const teacher = state.teachers.find(t => String(t.id) === String(cls.teacherId));
            return (
              <div
                key={cls.id}
                className="p-8 bg-[#F8F9FA] border-2 border-transparent hover:border-[#8A63F2] rounded-[1.5rem] transition-all duration-300 group cursor-pointer"
              >
                <h4 className="text-xl font-bold text-[#2D3142] mb-1">{cls.name}</h4>
                <p className="text-xs text-gray-400 font-medium mb-1">{teacher ? teacher.name : 'Tiada Guru'}</p>
                <p className="text-sm text-gray-500 mb-6 font-medium">{studentCount} Pelajar</p>
                <button
                  onClick={() => { setEditClassForm(cls); setShowEditClassModal(true); }}
                  className="flex items-center gap-2 text-[#52B788] font-bold hover:gap-3 transition-all border-none bg-transparent p-0 cursor-pointer text-sm"
                >
                  Edit Halaqah <span className="text-lg">→</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Tambah Guru Baharu</h3>
            <form className="space-y-4" onSubmit={handleAdd}>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Nama Penuh</label><input required className={inputCls} placeholder="Murabbi / Murabbiah name" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><input type="email" required className={inputCls} placeholder="teacher@akmal.edu.my" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">ID Log Masuk (Username)</label><input className={inputCls} placeholder="e.g. murabbi_alif" value={addForm.username} onChange={e => setAddForm({ ...addForm, username: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">No. IC (Opsional)</label><input className={inputCls} placeholder="Jika ada" value={addForm.icNo} onChange={e => setAddForm({ ...addForm, icNo: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">No. Telefon</label><input type="tel" required className={inputCls} placeholder="+60 12-345 6789" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jantina</label>
                <select className={inputCls} value={addForm.gender} onChange={e => setAddForm({ ...addForm, gender: e.target.value })}>
                  <option value="M">Lelaki (Murabbi)</option>
                  <option value="F">Perempuan (Murabbiah)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Tambah Guru</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Cipta Halaqah Baharu</h3>
            <form className="space-y-6" onSubmit={handleAddClass}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Guru / Murabbi</label>
                <select
                  required
                  className={inputCls}
                  value={addClassForm.teacherId}
                  onChange={e => {
                    const tid = e.target.value;
                    const tName = state.teachers.find(t => String(t.id) === tid)?.name ?? '';
                    setAddClassForm({ ...addClassForm, teacherId: tid, name: tName ? `Halaqah ${tName}` : '' });
                  }}
                >
                  <option value="">Pilih guru</option>
                  {state.teachers.filter(t => t.status === 'Aktif').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {addClassForm.name && (
                <div className="px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <p className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-0.5">Nama Halaqah (auto)</p>
                  <p className="font-bold text-teal-800">{addClassForm.name}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kapasiti Pelajar</label>
                <input
                  type="number"
                  required
                  className={inputCls}
                  placeholder="Maksimum pelajar"
                  value={addClassForm.capacity}
                  onChange={e => setAddClassForm({ ...addClassForm, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                  Cipta Halaqah
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddClassModal(false)} 
                  className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-10 shadow-2xl overflow-hidden border border-gray-100">
            <h3 className="text-2xl font-bold text-[#2D3142] mb-8 text-center px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">Edit Profil Guru</h3>
            <form className="space-y-5" onSubmit={handleEdit}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-500 ml-1">Nama Penuh</label>
                <input required className={inputCls} placeholder="Murabbi / Murabbiah name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-500 ml-1">Email</label>
                <input type="email" required className={inputCls} placeholder="teacher@akmal.edu.my" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-500 ml-1">No. Telefon</label>
                <input type="tel" required className={inputCls} placeholder="+60 12-345 6789" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-500 ml-1">Jantina</label>
                <select className={inputCls} value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })}>
                  <option value="M">Lelaki (Murabbi)</option>
                  <option value="F">Perempuan (Murabbiah)</option>
                </select>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 py-4 bg-[#52B788] text-white font-bold rounded-2xl hover:bg-[#40916C] shadow-lg shadow-green-100 transition-all border-none cursor-pointer">
                  Simpan
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="px-8 py-4 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm cursor-pointer">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && editClassForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl overflow-hidden border border-gray-100">
            <h3 className="text-2xl font-bold text-[#2D3142] mb-8 text-center px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">Edit Maklumat Halaqah</h3>
            <form className="space-y-6" onSubmit={handleEditClass}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-500 ml-1">Pilih Guru / Murabbi</label>
                <select
                  required
                  className={inputCls}
                  value={editClassForm.teacherId}
                  onChange={e => {
                    const tid = e.target.value;
                    const tName = state.teachers.find(t => String(t.id) === tid)?.name ?? '';
                    setEditClassForm({ ...editClassForm, teacherId: tid, name: tName ? `Halaqah ${tName}` : editClassForm.name });
                  }}
                >
                  <option value="">Tiada Guru</option>
                  {state.teachers.filter(t => t.status === 'Aktif').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl">
                <p className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-0.5">Nama Halaqah (auto)</p>
                <p className="font-bold text-teal-800">{editClassForm.name}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-500 ml-1">Kapasiti Pelajar</label>
                <input
                  type="number"
                  required
                  className={inputCls}
                  value={editClassForm.capacity}
                  onChange={e => setEditClassForm({ ...editClassForm, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all border-none cursor-pointer">
                  Simpan Perubahan
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditClassModal(false)} 
                  className="w-full py-4 border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer bg-white"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* View Teacher Modal */}
      {showViewModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[40px] max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 my-8">
            <div className="p-10 pb-0 shrink-0">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">Profil Murabbi/ah</h3>
               <p className="text-[#6FC7CB] font-bold text-xs uppercase tracking-widest mt-1">
                 {selectedTeacher.gender === 'F' ? 'MURABBIAH' : 'MURABBI'} — {selectedTeacher.status}
               </p>
            </div>
            
            <div className="p-10 pt-8 space-y-8">
              <section className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><User className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nama Penuh</p>
                      <p className="font-bold text-slate-700">{selectedTeacher.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><BookOpen className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Kepakaran</p>
                      <p className="font-bold text-slate-700">{selectedTeacher.specialization || '—'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Phone className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No. Telefon</p>
                      <p className="font-bold text-slate-700">{selectedTeacher.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Briefcase className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pengalaman</p>
                      <p className="font-bold text-slate-700">{selectedTeacher.experience || 'Baru'}</p>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-slate-50" />

              <section className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                 <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Pendidikan / Kelayakan</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedTeacher.qualification || 'Tiada maklumat'}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Sejarah Kesihatan</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedTeacher.medicalHistory || 'Tiada rekod perubatan'}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Kecemasan (Nama)</p>
                    <p className="text-sm text-slate-700 font-bold">{selectedTeacher.emergencyContactName || '—'}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Kecemasan (Telefon)</p>
                    <p className="text-sm text-slate-700 font-bold">{selectedTeacher.emergencyContactPhone || '—'}</p>
                 </div>
              </section>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => { setShowViewModal(false); setEditForm(selectedTeacher); setShowEditModal(true); }}
                  className="flex-1 py-4 bg-[#6FC7CB] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5FB3B7] transition-all shadow-lg shadow-cyan-100"
                >
                  EDIT PROFIL
                </button>
                <button 
                  onClick={() => setShowViewModal(false)} 
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                >
                  TUTUP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Assign Halaqah Modal */}
      {showAssignHalaqahModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-10 shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#2D3142]">Urus Tugasan Halaqah & Murabbi</h3>
              <p className="text-sm text-gray-500 mt-1">Tetapkan Murabbi/Murabbiah bagi setiap halaqah (Maksimum 10 Halaqah).</p>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
              {state.classes.map((cls) => {
                const teacherName = state.teachers.find(t => String(t.id) === String(cls.teacherId))?.name ?? 'Tiada Guru';
                return (
                  <div key={cls.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl gap-4 border border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{cls.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">Kapasiti: {cls.capacity} pelajar | Guru: {teacherName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={cls.teacherId || ''}
                        onChange={async (e) => {
                          const newTeacherId = e.target.value;
                          const newTeacherName = state.teachers.find(t => String(t.id) === newTeacherId)?.name ?? '';
                          const newName = newTeacherName ? `Halaqah ${newTeacherName}` : cls.name;
                          try {
                            const response = await axios.put(`/api/classes/${cls.id}`, {
                              name: newName,
                              capacity: cls.capacity,
                              teacherId: newTeacherId || null
                            });
                            // Update global state
                            const updatedClasses = state.classes.map(c => c.id === cls.id ? response.data : c);
                            dispatch({ type: 'SET_CLASSES', payload: updatedClasses });
                            
                            // Refresh teachers list to update their classIds
                            const teachersResponse = await axios.get('/api/teachers', {
                              params: { page: page, search: debouncedSearch }
                            });
                            const { data } = teachersResponse.data;
                            dispatch({ type: 'SET_TEACHERS', payload: data });
                          } catch (error) {
                            console.error('Error assigning teacher:', error);
                            alert('Gagal mengemas kini tugasan halaqah.');
                          }
                        }}
                        className="w-64 rounded-xl border-slate-200 focus:border-green-500 focus:ring-green-500 text-sm"
                      >
                        <option value="">Tiada Murabbi/Murabbiah</option>
                        {state.teachers.filter(t => t.status === 'Aktif').map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}

              {state.classes.length === 0 && (
                <p className="text-center py-6 text-slate-400 font-medium">Tiada halaqah didaftarkan dalam sistem.</p>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100 mt-6">
              <button 
                type="button" 
                onClick={() => setShowAssignHalaqahModal(false)} 
                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all border-none cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}