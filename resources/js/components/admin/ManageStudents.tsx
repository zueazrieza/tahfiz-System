import { useState, useEffect, useRef, useMemo } from 'react';
import { Pagination } from '../shared/Pagination';
import { Plus, Search, Edit, Trash2, Eye, User, Shield, BookOpen, HeartPulse, ChevronRight, ChevronLeft, Check, CreditCard, Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import axios from 'axios';

const extractDobFromIc = (ic: string): string => {
  const digits = ic.replace(/\D/g, '');
  if (digits.length < 6) return '';
  const yy = digits.substring(0, 2);
  const mm = digits.substring(2, 4);
  const dd = digits.substring(4, 6);
  
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';

  const currentYear = new Date().getFullYear();
  const currentShortYear = currentYear % 100;
  const yearPrefix = parseInt(yy, 10) <= currentShortYear ? '20' : '19';
  const fullYear = `${yearPrefix}${yy}`;
  
  return `${fullYear}-${mm}-${dd}`;
};

export function ManageStudents() {
  const { state, dispatch } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [studentsPage, setStudentsPage] = useState(1);
  const STUDENTS_PER_PAGE = 15;

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; skipped: number; errors: string[]; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [addForm, setAddForm] = useState({
    name: '',
    icNo: '',
    gender: 'M',
    dob: '',
    age: 0,
    address: '',
    // Guardian
    parentName: '',
    parentPhone: '',
    parentId: '1',
    // Academic
    matricNo: '',
    intake: '',
    studentId: '', // System generated or manual
    classId: '',
    teacherId: '',
    enrolledDate: new Date().toISOString().split('T')[0],
    intakeJuzuk: 0,
    admissionType: 'tetap' as 'tetap' | 'interview',
    // Health
    medicalHistory: '',
  });

  const [editForm, setEditForm] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tetap' | 'interview' | 'trash'>('tetap');
  const [trashedStudents, setTrashedStudents] = useState<any[]>([]);
  const [trashedLoading, setTrashedLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, classesRes, teachersRes] = await Promise.all([
          axios.get('/api/students'),
          axios.get('/api/classes'),
          axios.get('/api/teachers?all=true')
        ]);
        dispatch({ type: 'SET_STUDENTS', payload: studentsRes.data });
        dispatch({ type: 'SET_CLASSES', payload: classesRes.data });
        dispatch({ type: 'SET_TEACHERS', payload: Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data.data });
        
        if (classesRes.data.length > 0) setAddForm(prev => ({ ...prev, classId: classesRes.data[0].id }));
        if (teachersRes.data.data?.length > 0) setAddForm(prev => ({ ...prev, teacherId: teachersRes.data.data[0].id }));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  // Auto-calculate age from DOB
  useEffect(() => {
    if (addForm.dob) {
      const birthDate = new Date(addForm.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setAddForm(prev => ({ ...prev, age }));
    }
  }, [addForm.dob]);

  const getClassName = (classId: string | number) => state.classes.find(c => String(c.id) === String(classId))?.name ?? classId;
  const getTeacherName = (teacherId: string | number) => state.teachers.find(t => String(t.id) === String(teacherId))?.name ?? teacherId;
  
  const getAttendance = (studentId: string | number) => {
    const recs = state.attendance.filter(a => String(a.studentId) === String(studentId));
    if (!recs.length) return 'N/A';
    const present = recs.filter(a => a.status !== 'Tidak Hadir').length;
    return `${Math.round((present / recs.length) * 100)}%`;
  };

  const filtered = state.students.filter(s => {
    const studentName = s.name || '';
    const classNameVal = String(getClassName(s.classId) || '');
    const matchesSearch = (
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classNameVal.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesClass = (!classFilter || String(s.classId) === String(classFilter));
    
    // Logic: If status is 'Aktif', they belong in 'tetap'. 
    // Otherwise, they belong in whatever tab matches their admissionType (default 'tetap')
    const currentStatus = s.status;
    const admission = s.admissionType || 'tetap';
    
    let matchesTab = false;
    if (activeTab === 'tetap') {
      matchesTab = (admission === 'tetap' || currentStatus === 'Aktif' || currentStatus === 'ENROLLED');
    } else {
      matchesTab = (admission === 'interview' && currentStatus !== 'Aktif' && currentStatus !== 'ENROLLED');
    }

    return matchesSearch && matchesClass && matchesTab;
  });

  const totalStudentPages = Math.ceil(filtered.length / STUDENTS_PER_PAGE);
  const paginatedStudents = filtered.slice((studentsPage - 1) * STUDENTS_PER_PAGE, studentsPage * STUDENTS_PER_PAGE);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Adakah anda pasti ingin menyimpan data pelajar baharu ini?')) {
      return;
    }
    try {
      const response = await axios.post('/api/students', {
        ...addForm,
        juzukCompleted: addForm.intakeJuzuk,
        status: 'Aktif'
      });
      dispatch({ type: 'ADD_STUDENT', payload: response.data });
      resetAddForm();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Gagal menambah pelajar.');
    }
  };

  const resetAddForm = () => {
    setAddForm({
      name: '',
      icNo: '',
      gender: 'M',
      dob: '',
      age: 0,
      address: '',
      parentName: '',
      parentPhone: '',
      parentId: '1',
      matricNo: '',
      intake: '',
      studentId: '',
      classId: state.classes[0]?.id || '',
      teacherId: state.teachers[0]?.id || '',
      enrolledDate: new Date().toISOString().split('T')[0],
      intakeJuzuk: 0,
      admissionType: 'tetap',
      medicalHistory: '',
    });
    setCurrentStep(1);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Adakah anda pasti ingin mengemaskini maklumat pelajar ini?')) {
      return;
    }
    try {
      const res = await axios.put(`/api/students/${editForm.id}`, {
        name: editForm.name,
        ic_no: editForm.icNo,
        gender: editForm.gender,
        age: editForm.age,
        class_id: editForm.classId,
        teacher_id: editForm.teacherId,
        status: editForm.status,
        juzuk_completed: editForm.juzukCompleted,
        parent_name: editForm.parentName,
        parent_phone: editForm.parentPhone,
        address: editForm.address,
        medical_history: editForm.medicalHistory,
        matric_no: editForm.matric_no || editForm.matricNo,
        intake: editForm.intake
      });
      dispatch({ type: 'EDIT_STUDENT', payload: res.data });
      setShowEditModal(false);
      setEditForm(null);
    } catch (error) {
      console.error('Error editing student:', error);
      alert('Gagal mengemaskini pelajar.');
    }
  };

  const fetchTrashed = async () => {
    setTrashedLoading(true);
    try {
      const res = await axios.get('/api/students/trashed');
      setTrashedStudents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setTrashedLoading(false);
    }
  };

  const handleDelete = async (student: any) => {
    if (confirm(`Pelajar ${student.name} akan dipindahkan ke Tong Sampah dan boleh dipulihkan kemudian. Teruskan?`)) {
      try {
        await axios.delete(`/api/students/${student.id}`);
        dispatch({ type: 'DELETE_STUDENT', payload: { id: student.id } });
        alert(`${student.name} dipadam dan boleh dipulihkan melalui tab Tong Sampah.`);
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Gagal memadam pelajar.');
      }
    }
  };

  const handleRestore = async (student: any) => {
    try {
      const res = await axios.post(`/api/students/${student.id}/restore`);
      alert(res.data.message);
      fetchTrashed();
    } catch (e) {
      alert('Gagal memulihkan pelajar.');
    }
  };

  const handleForceDelete = async (student: any) => {
    if (confirm(`AMARAN: ${student.name} akan dipadam KEKAL dan TIDAK boleh dipulihkan. Teruskan?`)) {
      try {
        await axios.delete(`/api/students/${student.id}/force`);
        fetchTrashed();
      } catch (e) {
        alert('Gagal memadam rekod.');
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    if (!confirm('Adakah anda pasti ingin mengimport data pelajar dari fail ini?')) {
      return;
    }
    setImportLoading(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', importFile);
    try {

      const res = await axios.post('/api/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      // Refresh student list
      const studentsRes = await axios.get('/api/students');
      dispatch({ type: 'SET_STUDENTS', payload: studentsRes.data });
    } catch (error: any) {
      const errData = error?.response?.data;
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: errData?.errors ?? [errData?.message ?? 'Ralat tidak diketahui.'],
        message: errData?.message ?? 'Import gagal.',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setImportFile(file); setImportResult(null); }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] focus:ring-2 focus:ring-[#6FC7CB] outline-none transition-all';
  const labelCls = 'block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2';

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {[
        { step: 1, icon: <User className="w-4 h-4" />, label: 'Peribadi' },
        { step: 2, icon: <Shield className="w-4 h-4" />, label: 'Penjaga' },
        { step: 3, icon: <BookOpen className="w-4 h-4" />, label: 'Akademik' },
        { step: 4, icon: <HeartPulse className="w-4 h-4" />, label: 'Kesihatan' },
      ].map((s, idx, arr) => (
        <div key={s.step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              currentStep === s.step 
              ? 'bg-[#6FC7CB] text-white shadow-lg shadow-cyan-100' 
              : currentStep > s.step ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {currentStep > s.step ? <Check className="w-5 h-5" /> : s.icon}
            </div>
            <span className={`text-[10px] mt-2 font-bold uppercase tracking-tighter ${
              currentStep === s.step ? 'text-[#6FC7CB]' : 'text-slate-400'
            }`}>{s.label}</span>
          </div>
          {idx < arr.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 -mt-5 transition-all ${
              currentStep > s.step ? 'bg-green-500' : 'bg-slate-100'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Akademi Al-Quran Amalillah — <span className="text-slate-500 font-medium lowercase">urus pelajar</span></h2>
          <p className="text-slate-500 mt-1 text-sm leading-relaxed">Pendaftaran pelajar baharu kini lebih tersusun dengan sistem wizard multi-step.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/export/students"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#6FC7CB] text-[#6FC7CB] rounded-xl hover:bg-cyan-50 transition-all font-bold text-sm shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> EXPORT EXCEL
          </a>
          <button
            onClick={() => { setShowImportModal(true); setImportFile(null); setImportResult(null); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all font-bold text-sm shadow-sm"
          >
            <Upload className="w-4 h-4" /> IMPORT PELAJAR
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-[#6FC7CB] text-white rounded-xl hover:bg-[#5FB3B7] shadow-lg shadow-cyan-50 transition-all font-bold">
            <Plus className="w-5 h-5" /> DAFTAR PELAJAR
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('tetap')}
          className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all border-b-2 ${
            activeTab === 'tetap' ? 'border-[#6FC7CB] text-[#6FC7CB]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Pelajar Tetap
        </button>
        <button
          onClick={() => setActiveTab('interview')}
          className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all border-b-2 ${
            activeTab === 'interview' ? 'border-[#6FC7CB] text-[#6FC7CB]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Pelajar Interview
        </button>
        <button
          onClick={() => { setActiveTab('trash'); fetchTrashed(); }}
          className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'trash' ? 'border-red-400 text-red-500' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trash2 className="w-4 h-4" /> Tong Sampah
        </button>
      </div>

      {/* ── TONG SAMPAH VIEW ── */}
      {activeTab === 'trash' && (
        <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-red-600 text-sm uppercase tracking-wider">Rekod Dipadam — Boleh Dipulihkan</h3>
          </div>
          {trashedLoading ? (
            <div className="p-12 text-center text-slate-400">Memuatkan...</div>
          ) : trashedStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Tiada rekod dalam tong sampah.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Nama','No. IC','Matrik','Status','Tarikh Dipadam','Tindakan'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trashedStudents.map(s => (
                  <tr key={s.id} className="hover:bg-red-50/30">
                    <td className="px-6 py-4 font-semibold text-slate-700">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{s.icNo ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{s.matricNo ?? '—'}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-semibold">{s.status}</span></td>
                    <td className="px-6 py-4 text-sm text-red-400">{s.deletedAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleRestore(s)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold transition-all">
                          <RotateCcw className="w-3 h-3" /> Pulihkan
                        </button>
                        <button onClick={() => handleForceDelete(s)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-all">
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

      {/* Search & Filter + Table — only show on active/interview tabs */}
      {activeTab !== 'trash' && (<>
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setStudentsPage(1); }} placeholder="Cari nama pelajar atau ID..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#6FC7CB] outline-none" />
        </div>
        <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setStudentsPage(1); }} className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#6FC7CB] outline-none font-medium text-slate-600">
          <option value="">Semua Kelas</option>
          {state.classes.map(c => <option key={c.id} value={c.id}>{c.name} - {getTeacherName(c.teacherId)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                {['Ranking','Nama','Umur','Kelas','Murabbi/ah','Hafazan','Kehadiran','Status','Tindakan'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const RANK_NAMES: Record<number, { label: string; color: string }> = {
                        0:  { label: 'Tahsin',            color: '#0d9488' },
                        1:  { label: 'Warrior',           color: '#ea580c' },
                        2:  { label: 'Elite',             color: '#d97706' },
                        3:  { label: 'Master',            color: '#475569' },
                        4:  { label: 'Grandmaster',       color: '#b45309' },
                        5:  { label: 'Titan',             color: '#0284c7' },
                        6:  { label: 'Gladiator',         color: '#dc2626' },
                        7:  { label: 'Legend Al-Hafiz',   color: '#7c3aed' },
                        8:  { label: 'Legend Amethyst',   color: '#7c3aed' },
                        9:  { label: 'Legend Ruby',       color: '#be123c' },
                        10: { label: 'Legend Sapphire',   color: '#1d4ed8' },
                        11: { label: 'Syahadah Emperor',  color: '#92400e' },
                      };
                      const r = student.ranking !== null && student.ranking !== undefined ? RANK_NAMES[student.ranking] : null;
                      return r
                        ? <span style={{ fontSize: '0.72rem', fontWeight: 800, color: r.color, background: r.color + '18', borderRadius: '999px', padding: '3px 10px', whiteSpace: 'nowrap' }}>{r.label}</span>
                        : <span className="text-slate-300 font-bold text-sm">—</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-800">{student.name}</div>
                    <div className="flex gap-2">
                       <span className="text-[10px] text-slate-400 font-mono">ID: {student.id}</span>
                       {(student.matric_no || student.matricNo) && (
                         <span className="text-[10px] text-blue-500 font-bold">MATRIK: {student.matric_no || student.matricNo}</span>
                       )}
                       {student.parentName && (
                         <span className="text-[10px] text-slate-400 font-medium"> • PENJAGA: {student.parentName} {student.parentPhone ? `(${student.parentPhone})` : ''}</span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{student.age} thn</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600 font-medium">{student.className || getClassName(student.classId)}</div>
                    {student.intake && <div className="text-[10px] text-[#6FC7CB] font-bold uppercase tracking-wider">{student.intake}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.teacherName || getTeacherName(student.teacherId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold">{student.juzukCompleted} Juzuk</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-mono tracking-tighter">{getAttendance(student.id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const statusMap: { [key: string]: { label: string, cls: string } } = {
                        'PROSPECT': { label: 'Calon Baharu', cls: 'bg-blue-100 text-blue-700' },
                        'SCHEDULED': { label: 'Dijadualkan', cls: 'bg-indigo-100 text-indigo-700' },
                        'INTERVIEW': { label: 'Temuduga', cls: 'bg-amber-100 text-amber-700' },
                        'ACCEPTED': { label: 'Layak', cls: 'bg-emerald-100 text-emerald-700' },
                        'OFFERED': { label: 'Tawaran Dihantar', cls: 'bg-purple-100 text-purple-700' },
                        'WAITING_PAYMENT': { label: 'Menunggu Bayaran', cls: 'bg-orange-100 text-orange-700' },
                        'ENROLLED': { label: 'Aktif', cls: 'bg-slate-900 text-white' },
                        'Aktif': { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
                      };
                      const config = statusMap[student.status] || { label: student.status, cls: 'bg-slate-100 text-slate-600' };
                      return <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${config.cls}`}>{config.label}</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {student.status === 'WAITING_PAYMENT' && (
                        <button 
                          onClick={() => {
                            if (confirm(`Sahkan pembayaran untuk ${student.name}? Pelajar akan didaftarkan sebagai 'Aktif' secara automatik.`)) {
                              axios.patch(`/api/enrollment/status/${student.id}`, { status: 'ENROLLED' })
                                .then(() => {
                                  dispatch({ type: 'EDIT_STUDENT', payload: { ...student, status: 'Aktif' } });
                                  alert('Pembayaran disahkan. Pelajar kini Aktif.');
                                });
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> SAHKAN BAYARAN
                        </button>
                      )}
                      <button onClick={() => { setSelectedStudent(student); setShowViewModal(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-[#6FC7CB] rounded-xl transition-all" aria-label={`Lihat profil ${student.name}`}><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { setEditForm({ ...student }); setShowEditModal(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all" aria-label={`Edit ${student.name}`}><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(student)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl transition-all" aria-label={`Padam ${student.name}`}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300"><Search className="w-8 h-8" /></div>
                    <p className="text-slate-500 font-medium">Tiada pelajar ditemui.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <Pagination currentPage={studentsPage} totalPages={totalStudentPages} onPageChange={setStudentsPage} totalItems={filtered.length} itemsPerPage={STUDENTS_PER_PAGE} />
        </div>
      </div>
      </>)}

      {/* Add Modal Wizrd */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Tambah Pelajar Baharu</h3>
                <p className="text-slate-400 text-sm">Sila lengkapkan maklumat mengikut langkah di bawah.</p>
              </div>
              <button onClick={() => { setShowAddModal(false); resetAddForm(); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all">✕</button>
            </div>

            {renderStepIndicator()}

            <form onSubmit={handleAdd} className="mt-4">
              
              {/* Step 1: Maklumat Peribadi */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Nama Penuh *</label>
                      <input required className={inputCls} placeholder="Nama mengikut MyKid/IC" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>No. Kad Pengenalan / MyKid *</label>
                      <input
                        required
                        className={inputCls}
                        placeholder="Contoh: 121101101234"
                        value={addForm.icNo}
                        onChange={e => {
                          const val = e.target.value;
                          const extractedDob = extractDobFromIc(val);
                          setAddForm(prev => ({
                            ...prev,
                            icNo: val,
                            dob: extractedDob || prev.dob
                          }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className={labelCls}>Jantina *</label>
                      <select required className={inputCls} value={addForm.gender} onChange={e => setAddForm({ ...addForm, gender: e.target.value })}>
                        <option value="M">LELAKI (M)</option>
                        <option value="F">PEREMPUAN (F)</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Tarikh Lahir *</label>
                      <input type="date" required className={inputCls} value={addForm.dob} onChange={e => setAddForm({ ...addForm, dob: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Umur (Autocalc)</label>
                      <input disabled className={`${inputCls} bg-slate-100 font-bold`} value={`${addForm.age} Tahun`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Alamat Rumah *</label>
                    <textarea required rows={2} className={inputCls} placeholder="Alamat penuh surat-menyurat" value={addForm.address} onChange={e => setAddForm({ ...addForm, address: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Step 2: Maklumat Penjaga */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className={labelCls}>Nama Ibu Bapa / Penjaga *</label>
                    <input required className={inputCls} placeholder="Nama penuh penjaga" value={addForm.parentName} onChange={e => setAddForm({ ...addForm, parentName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>No. Telefon Penjaga *</label>
                    <input required className={inputCls} placeholder="Contoh: +60 12-345 6789" value={addForm.parentPhone} onChange={e => setAddForm({ ...addForm, parentPhone: e.target.value })} />
                  </div>
                  <p className="p-4 bg-blue-50 text-blue-600 rounded-2xl text-xs leading-relaxed border border-blue-100 uppercase font-bold tracking-wider">
                     Maklumat ini penting untuk sebarang urusan kecemasan & laporan hafazan harian melalui SMS/WhatsApp.
                  </p>
                </div>
              )}

              {/* Step 3: Akademik & Hafazan */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>No. Matrik</label>
                      <input className={inputCls} placeholder="Contoh: TZ001" value={addForm.matricNo} onChange={e => setAddForm({ ...addForm, matricNo: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Sesi Intake</label>
                      <input className={inputCls} placeholder="Contoh: Mac 2024" value={addForm.intake} onChange={e => setAddForm({ ...addForm, intake: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Kelas *</label>
                      <select required className={inputCls} value={addForm.classId} onChange={e => setAddForm({ ...addForm, classId: e.target.value })}>
                        {state.classes.map(c => <option key={c.id} value={c.id}>{c.name} - {getTeacherName(c.teacherId)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Murabbi / Murabbiah *</label>
                      <select required className={inputCls} value={addForm.teacherId} onChange={e => setAddForm({ ...addForm, teacherId: e.target.value })}>
                        {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Tarikh Kemasukan *</label>
                      <input type="date" required className={inputCls} value={addForm.enrolledDate} onChange={e => setAddForm({ ...addForm, enrolledDate: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Hafazan Semasa (Juzuk)</label>
                      <input type="number" className={inputCls} placeholder="0-30" value={addForm.intakeJuzuk} onChange={e => setAddForm({ ...addForm, intakeJuzuk: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Jenis Pendaftaran</label>
                    <div className="flex gap-4">
                      {['tetap', 'interview'].map(t => (
                        <button key={t} type="button" onClick={() => setAddForm({ ...addForm, admissionType: t as any })} className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${
                          addForm.admissionType === t ? 'border-[#6FC7CB] bg-cyan-50 text-[#6FC7CB]' : 'border-slate-100 text-slate-400'
                        }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Kesihatan */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className={labelCls}>Sejarah Perubatan / Alahan</label>
                    <textarea rows={4} className={inputCls} placeholder="Contoh: Alahan terhadap habuk, Asma, dsb." value={addForm.medicalHistory} onChange={e => setAddForm({ ...addForm, medicalHistory: e.target.value })} />
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-800 mb-2 underline">Ringkasan Pendaftaran</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
                      <span className="text-slate-400">Nama:</span> <span className="font-bold text-slate-700">{addForm.name}</span>
                      <span className="text-slate-400">IC:</span> <span className="font-bold text-slate-700">{addForm.icNo}</span>
                      <span className="text-slate-400">Kelas:</span> <span className="font-bold text-slate-700">{getClassName(addForm.classId)}</span>
                      <span className="text-slate-400">Penjaga:</span> <span className="font-bold text-slate-700">{addForm.parentName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-8 border-t border-slate-50 mt-8">
                {currentStep > 1 && (
                  <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="px-6 py-3 border-2 border-slate-100 text-slate-400 rounded-xl hover:bg-slate-50 font-bold transition-all flex items-center gap-2">
                    <ChevronLeft className="w-5 h-5" /> KEMBALI
                  </button>
                )}
                {currentStep < 4 ? (
                  <button type="button" onClick={() => setCurrentStep(prev => prev + 1)} className="flex-1 py-3 bg-[#6FC7CB] text-white rounded-xl hover:bg-[#5FB3B7] font-bold shadow-lg shadow-cyan-100 transition-all flex items-center justify-center gap-2">
                    SETERUSNYA <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2">
                    DAFTAR SEKARANG <Check className="w-5 h-5" />
                  </button>
                )}
                {currentStep === 1 && (
                  <button type="button" onClick={() => { setShowAddModal(false); resetAddForm(); }} className="px-6 py-3 text-slate-400 hover:text-slate-600 font-bold transition-all">BATAL</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[40px] max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 my-8 flex flex-col max-h-[90vh]">
            <div className="p-10 pb-4 border-b border-slate-50 shrink-0">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">Kemaskini Pelajar</h3>
            </div>
            
            <form className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin scrollbar-thumb-slate-200" onSubmit={handleEdit}>
              {/* 1. Maklumat Asas */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-[#6FC7CB] uppercase tracking-[0.2em]">1. Maklumat Asas & Akademik</p>
                <div><label className={labelCls}>Nama Penuh</label><input required className={inputCls} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2"><label className={labelCls}>No. IC / MyKid</label><input className={inputCls} value={editForm.icNo} onChange={e => setEditForm({ ...editForm, icNo: e.target.value })} /></div>
                  <div><label className={labelCls}>Jantina</label>
                    <select className={inputCls} value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })}>
                      <option value="Lelaki">Lelaki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div><label className={labelCls}>Umur</label><input type="number" required className={inputCls} value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>No. Matrik</label><input className={inputCls} value={editForm.matric_no || editForm.matricNo} onChange={e => setEditForm({ ...editForm, matricNo: e.target.value })} /></div>
                  <div><label className={labelCls}>Sesi Intake</label><input className={inputCls} value={editForm.intake} onChange={e => setEditForm({ ...editForm, intake: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Kelas</label>
                    <select className={inputCls} value={editForm.classId} onChange={e => {
                      const selectedClass = state.classes.find(c => String(c.id) === String(e.target.value));
                      setEditForm({ 
                        ...editForm, 
                        classId: e.target.value,
                        teacherId: selectedClass?.teacherId || editForm.teacherId
                      });
                    }}>
                      {state.classes.map(c => <option key={c.id} value={c.id}>{c.name} - {getTeacherName(c.teacherId)}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Murabbi / Murabbiah</label>
                    <select className={inputCls} value={editForm.teacherId} onChange={e => setEditForm({ ...editForm, teacherId: e.target.value })}>
                      {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Status Pelajar</label>
                    <select className={`${inputCls} font-bold ${editForm.status === 'Aktif' ? 'text-green-600' : 'text-slate-600'}`} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="Aktif">Aktif</option>
                      <option value="Cuti">Cuti</option>
                      <option value="Berhenti">Berhenti</option>
                      <option value="Digantung">Digantung</option>
                    </select>
                  </div>
                  <div><label className={labelCls}>Tahap Hafazan (Juzuk)</label><input type="number" className={inputCls} value={editForm.juzukCompleted} onChange={e => setEditForm({ ...editForm, juzukCompleted: e.target.value })} /></div>
                </div>
              </div>

              {/* 2. Penjaga */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-[#6FC7CB] uppercase tracking-[0.2em]">2. Maklumat Penjaga & Perhubungan</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Nama Penjaga Utama</label><input className={inputCls} value={editForm.parentName} onChange={e => setEditForm({ ...editForm, parentName: e.target.value })} /></div>
                  <div><label className={labelCls}>No. Telefon Penjaga</label><input className={inputCls} value={editForm.parentPhone} onChange={e => setEditForm({ ...editForm, parentPhone: e.target.value })} /></div>
                </div>
                <div><label className={labelCls}>Alamat Rumah</label><textarea rows={2} className={inputCls} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
              </div>

              {/* 3. Kesihatan */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">3. Keselamatan & Kesihatan</p>
                <div><label className={labelCls}>Alahan / Masalah Kesihatan</label><textarea rows={2} className={inputCls} value={editForm.medicalHistory} onChange={e => setEditForm({ ...editForm, medicalHistory: e.target.value })} placeholder="Contoh: Alahan kacang, Asma, dsb." /></div>
              </div>

              <div className="flex gap-4 pt-8 sticky bottom-0 bg-white pb-2">
                <button type="submit" className="flex-1 py-4 bg-[#6FC7CB] text-white rounded-2xl hover:bg-[#5FB3B7] font-black text-sm uppercase tracking-widest shadow-xl shadow-cyan-50 transition-all">SIMPAN PERUBAHAN</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="px-10 py-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 font-black text-sm uppercase tracking-widest transition-all">BATAL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] max-w-3xl w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 p-8 z-10">
               <button onClick={() => setShowViewModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm rounded-full text-slate-400 hover:text-slate-600 transition-all">✕</button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="flex items-center gap-6 mb-2">
                 <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#6FC7CB] to-[#5FB3B7] flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-cyan-100">
                   {selectedStudent.name.charAt(0)}
                 </div>
                 <div>
                    <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{selectedStudent.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest">{selectedStudent.id}</span>
                      <span className={`px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                        {(() => {
                          const statusMap: { [key: string]: string } = {
                            'PROSPECT': 'Calon Baharu',
                            'SCHEDULED': 'Dijadualkan',
                            'INTERVIEW': 'Temuduga',
                            'ACCEPTED': 'Layak',
                            'OFFERED': 'Tawaran Dihantar',
                            'WAITING_PAYMENT': 'Menunggu Bayaran',
                            'ENROLLED': 'Aktif',
                            'Aktif': 'Aktif',
                          };
                          return statusMap[selectedStudent.status] || selectedStudent.status;
                        })()}
                      </span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 pt-8">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4">Butiran Peribadi</h4>
                  <div className="space-y-4">
                    {[
                      ['Kad Pengenalan', selectedStudent.icNo || '—'],
                      ['No. Matrik', selectedStudent.matric_no || selectedStudent.matricNo || '—'],
                      ['Sesi Intake', selectedStudent.intake || '—'],
                      ['Jantina', selectedStudent.gender === 'F' ? 'Perempuan' : 'Lelaki'],
                      ['Tarikh Lahir', selectedStudent.dob || '—'],
                      ['Umur', `${selectedStudent.age} Tahun`],
                      ['Alamat', selectedStudent.address || '—'],
                      ['Nama Penjaga', selectedStudent.parentName || '—'],
                      ['Telefon Penjaga', selectedStudent.parentPhone || '—'],
                    ].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between items-start">
                        <span className="text-xs text-slate-400 font-medium">{l}</span>
                        <span className="text-sm font-bold text-slate-700 text-right max-w-[200px]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4">Matlamat & Murabbi</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">Kelas</span>
                      <span className="text-sm font-bold text-slate-700">{selectedStudent.className || getClassName(selectedStudent.classId)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">Murabbi</span>
                      <span className="text-sm font-bold text-slate-700">{selectedStudent.teacherName || getTeacherName(selectedStudent.teacherId)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">Hafazan</span>
                      <span className="text-sm font-bold text-[#6FC7CB]">{selectedStudent.juzukCompleted ?? 0} Juzuk</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">Baki Yuran</span>
                      <span className="text-sm font-bold text-slate-700">RM {state.payments.filter(p => String(p.studentId) === String(selectedStudent.id) && p.status !== 'Dibayar').reduce((acc, curr) => acc + Number(curr.amount || 0), 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50">
                <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4">Sejarah Kesihatan</h4>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm italic text-slate-500 min-h-[60px]">
                  {selectedStudent.medicalHistory || 'Tiada sejarah kesihatan atau alahan yang direkodkan.'}
                </div>
              </div>
            </div>

            <div className="p-10 pt-4 border-t border-slate-50 shrink-0 space-y-3">
               {selectedStudent.status === 'WAITING_PAYMENT' && (
                 <button 
                  onClick={() => {
                    if (confirm(`Sahkan pembayaran untuk ${selectedStudent.name}? Pelajar akan didaftarkan sebagai 'Aktif' secara automatik.`)) {
                      axios.patch(`/api/enrollment/status/${selectedStudent.id}`, { status: 'ENROLLED' })
                        .then(() => {
                          dispatch({ type: 'EDIT_STUDENT', payload: { ...selectedStudent, status: 'Aktif' } });
                          setSelectedStudent({ ...selectedStudent, status: 'Aktif' });
                          alert('Pembayaran disahkan. Pelajar kini Aktif.');
                        });
                    }
                  }}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100"
                 >
                   <CreditCard className="w-4 h-4" /> SAHKAN PEMBAYARAN & DAFTAR
                 </button>
               )}
               <button onClick={() => setShowViewModal(false)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">TUTUP PROFIL</button>
            </div>
          </div>
        </div>
      )}
      {/* ── IMPORT MODAL ── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-8 shadow-2xl animate-in zoom-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Import Pelajar</h3>
                  <p className="text-slate-400 text-xs">Muat naik fail Excel / CSV</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Column guide */}
            <div className="mb-5 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">📋 Format Pendaftaran Pelajar Baharu</p>
                <div className="flex flex-wrap gap-1">
                  {['No','School','Name','Matric','M/F','Class','IC No','Birth Date','Register','Name (Father)','Status','Intake'].map(col => (
                    <span key={col} className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md text-[9px] font-semibold">{col}</span>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-black text-[#6FC7CB] uppercase tracking-widest mb-1.5">✨ Format Pencapaian & AI Analytics (Akmal Prima)</p>
                <div className="flex flex-wrap gap-1">
                  {['NO','NAMA PELAJAR','UMUR','BIL JUZUK','RANKING SEMASA','JUZUK SEMASA','PURATA SABAK SEHARI','TARGET BIL JUZ (AKHIR JUN)','HALAQAH/KELAS'].map(col => (
                    <span key={col} className="px-1.5 py-0.5 bg-[#EEF9FA] border border-[#d2f1f2] text-[#4E9397] rounded-md text-[9px] font-bold">{col}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Drop zone */}
            {!importResult && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-emerald-400 bg-emerald-50' : importFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImportFile(f); setImportResult(null); } }}
                />
                {importFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="w-10 h-10 text-emerald-500" />
                    <p className="font-bold text-emerald-700 text-sm">{importFile.name}</p>
                    <p className="text-slate-400 text-xs">{(importFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                      className="mt-1 text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-wider"
                    >
                      Tukar Fail
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-slate-300" />
                    <p className="font-bold text-slate-500 text-sm">Seret &amp; lepas fail di sini</p>
                    <p className="text-slate-400 text-xs">atau klik untuk pilih fail</p>
                    <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest font-bold">XLSX · XLS · CSV (maks 10MB)</p>
                  </div>
                )}
              </div>
            )}

            {/* Result summary */}
            {importResult && (
              <div className={`rounded-2xl border p-5 ${
                importResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {importResult.success
                    ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    : <AlertCircle className="w-6 h-6 text-red-500" />
                  }
                  <p className={`font-bold text-sm ${ importResult.success ? 'text-emerald-700' : 'text-red-700' }`}>
                    {importResult.message}
                  </p>
                </div>
                {importResult.success && (
                  <div className="flex gap-6 text-sm mb-3">
                    <span className="font-black text-emerald-600">{importResult.imported} Diimport</span>
                    <span className="font-black text-slate-400">{importResult.skipped} Dilangkau</span>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-36 overflow-y-auto">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Ralat Baris:</p>
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 bg-white rounded-lg px-3 py-1.5 border border-red-100">{err}</p>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { setImportFile(null); setImportResult(null); }}
                  className="mt-4 text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider"
                >
                  Import Fail Lain
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              {!importResult && (
                <button
                  onClick={handleImport}
                  disabled={!importFile || importLoading}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100"
                >
                  {importLoading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengimport...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> MULA IMPORT</>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowImportModal(false)}
                className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 font-bold text-sm transition-all"
              >
                {importResult?.success ? 'TUTUP' : 'BATAL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}