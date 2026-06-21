import { useState, useEffect } from 'react';
import { Pagination } from '../shared/Pagination';
import axios from 'axios';

import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  MessageCircle,
  Clock,
  Search,
  Download,
  Mail,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';

type EnrollmentStatus = 'PROSPECT' | 'SCHEDULED' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED' | 'OFFERED' | 'WAITING_PAYMENT' | 'ENROLLED';

interface Applicant {
  id: string;
  dbId?: number;
  name: string;
  gender: 'Lelaki' | 'Perempuan';
  parentName: string;
  parentEmail?: string;
  phone: string;
  icNo: string;
  dateApplied: string;
  status: EnrollmentStatus;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewType?: 'Online' | 'Fizikal';
  marks?: { hafazan: number; tajwid: number; akhlaq: number };
  notes?: string;
}

export function EnrollmentHub() {
  const { state, dispatch } = useAppStore();
  const [activeTab, setActiveTab] = useState<EnrollmentStatus | 'ALL'>('ALL');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [interviewMarks, setInterviewMarks] = useState({ hafazan: 0, tajwid: 0, akhlaq: 0 });
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    type: 'Fizikal' as 'Online' | 'Fizikal',
    location: ''
  });

  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [aspectScores, setAspectScores] = useState<{ [key: number]: number }>({
    1: 3,
    2: 3,
    3: 3,
    4: 3,
    5: 3,
    6: 3,
    7: 3,
    8: 3,
  });
  const [evaluationComments, setEvaluationComments] = useState('');
  const [panelName, setPanelName] = useState('');
  const [panelDesignation, setPanelDesignation] = useState('Temuduga Mudir');
  const [rejectionReasons, setRejectionReasons] = useState<string[]>([]);
  const [overrideDecision, setOverrideDecision] = useState<'LULUS' | 'GAGAL' | null>(null);

  const aspectsList = [
    { id: 1, label: 'Semangat' },
    { id: 2, label: 'Minat dalam menghafal Al-Quran' },
    { id: 3, label: 'Keinginan menghafal dalam tempoh setahun' },
    { id: 4, label: 'Kemahuan sendiri atau individu lain' },
    { id: 5, label: 'Kesanggupan mengikuti sistem yang ditetapkan' },
    { id: 6, label: 'Kemahiran membaca Al-Quran' },
    { id: 7, label: 'Kelancaran hafalan' },
    { id: 8, label: 'Daya ingatan hafalan' },
  ];

  const scales = [
    { value: 1, label: 'Sangat Lemah' },
    { value: 2, label: 'Lemah' },
    { value: 3, label: 'Sederhana' },
    { value: 4, label: 'Baik' },
    { value: 5, label: 'Sangat Baik' },
  ];

  const rejectionOptions = [
    'Semangat kurang',
    'Tiada keinginan untuk menghafal',
    'Tidak sanggup mengikuti sistem',
    'Kemahuan individu lain',
    'Kurang kemahiran membaca Al-Quran (Asas Tajwid)',
    'Daya ingatan lemah',
  ];

  const totalScore = Object.values(aspectScores).reduce((a, b) => a + b, 0);
  const calculatedPercentage = Math.round((totalScore / 40) * 100);
  const autoDecision = calculatedPercentage >= 50 ? 'LULUS' : 'GAGAL';
  const finalDecision = overrideDecision || autoDecision;

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicantsPage, setApplicantsPage] = useState(1);
  const APPLICANTS_PER_PAGE = 12;
  const [searchTerm, setSearchTerm] = useState('');

  // ── Tambah Pelajar modal ──────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    studentName: '', studentIc: '', studentGender: 'Lelaki', studentDob: '',
    studentAge: '', studentAddress: '',
    parentName: '', parentEmail: '', parentPhone: '', parentIc: '',
    parentJob: '', quranLevel: '', notes: '',
  });

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/enrollment/applicants');
      const mapped = response.data.map((s: any) => ({
        id: `APP-${s.id}`,
        dbId: s.id,
        name: s.name,
        gender: s.gender,
        parentName: s.parent_name,
        parentEmail: s.parent_email,
        phone: s.parent_phone,
        icNo: s.ic_no,
        dateApplied: s.created_at.split('T')[0],
        status: (s.status === 'Aktif' || s.status === 'ENROLLED') ? 'ENROLLED' : s.status as EnrollmentStatus,
        interviewDate: s.interview_date,
        interviewTime: s.interview_time,
        interviewLocation: s.interview_location,
        interviewType: s.interview_type,
        marks: (s.hafazan_mark || s.tajwid_mark || s.akhlaq_mark) ? {
          hafazan: s.hafazan_mark,
          tajwid: s.tajwid_mark,
          akhlaq: s.akhlaq_mark,
        } : undefined,
        notes: s.notes,
      }));
      setApplicants(mapped);
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const handleDownloadPDF = () => {
    if (!selectedApplicant) return;
    const dbId = selectedApplicant.dbId;
    // Download directly from backend to avoid frontend canvas color issues (oklch)
    window.open(`/api/enrollment/offer-letter/${dbId}`, '_blank');
  };



  const stats = [
    { label: 'Calon Baharu', count: applicants.filter(a => a.status === 'PROSPECT').length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sesi Temuduga', count: applicants.filter(a => a.status === 'SCHEDULED' || a.status === 'INTERVIEW').length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Menunggu Tawaran', count: applicants.filter(a => a.status === 'ACCEPTED').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const updateStatus = async (id: string, newStatus: EnrollmentStatus) => {
    const dbId = applicants.find(a => a.id === id)?.dbId;
    if (!dbId) return;

    if (newStatus === 'OFFERED' || newStatus === 'ENROLLED') {
      const confirmText = newStatus === 'OFFERED' 
        ? 'Adakah anda pasti mahu menukar status calon ini kepada Tawaran Dihantar?' 
        : 'Adakah anda pasti mahu menukar status permohonan ini kepada BERJAYA?';
      if (!confirm(confirmText)) {
        return;
      }
    }

    try {
      await axios.patch(`/api/enrollment/status/${dbId}`, { status: newStatus });

      if (newStatus === 'ENROLLED') {
        alert('Tahniah! Pelajar telah disahkan dan dipindahkan ke senarai Pelajar Tetap.');
        fetchApplicants();
      } else {
        setApplicants(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        if (selectedApplicant?.id === id) setSelectedApplicant(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      alert('Gagal mengemaskini status');
    }
  };

  const handleSchedule = async () => {
    if (!selectedApplicant) return;
    const dbId = selectedApplicant.dbId;
    if (!dbId) return;

    if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.location.trim()) {
      alert('Sila lengkapkan semua maklumat temuduga (tarikh, masa, dan lokasi/pautan).');
      return;
    }

    if (!confirm('Adakah anda pasti ingin menjadualkan temuduga ini? Emel jemputan akan dihantar kepada penjaga.')) {
      return;
    }

    try {
      const response = await axios.post(`/api/enrollment/schedule-interview/${dbId}`, {
        interview_date: scheduleForm.date,
        interview_time: scheduleForm.time,
        interview_type: scheduleForm.type,
        interview_location: scheduleForm.location,
      });

      alert(response.data.message || 'Berjaya! Jadual telah ditetapkan dan emel jemputan telah dihantar.');
      setShowScheduleModal(false);
      fetchApplicants();
    } catch (err: any) {
      alert('Gagal menetapkan jadual temuduga: ' + (err.response?.data?.message || 'Ralat sambungan.'));
    }
  };

  const saveInterview = async (id: string) => {
    const dbId = applicants.find(a => a.id === id)?.dbId;
    if (!dbId) return;

    try {
      await axios.post(`/api/enrollment/update-interview/${dbId}`, {
        hafazan_mark: interviewMarks.hafazan,
        tajwid_mark: interviewMarks.tajwid,
        akhlaq_mark: interviewMarks.akhlaq,
        status: 'ACCEPTED',
      });
      setApplicants(prev => prev.map(a => a.id === id ? { ...a, marks: interviewMarks, status: 'ACCEPTED' } : a));
      if (selectedApplicant?.id === id) setSelectedApplicant(prev => prev ? { ...prev, marks: interviewMarks, status: 'ACCEPTED' } : null);
    } catch (err) {
      alert('Gagal menyimpan markah temuduga');
    }
  };

  const submitEvaluation = async () => {
    if (!selectedApplicant) return;
    const dbId = selectedApplicant.dbId;
    if (!dbId) return;

    if (!panelName.trim()) {
      alert('Sila masukkan nama panel penilai.');
      return;
    }

    if (!evaluationComments.trim()) {
      alert('Sila masukkan ulasan penilai.');
      return;
    }

    if (finalDecision === 'GAGAL' && rejectionReasons.length === 0) {
      alert('Sila pilih sekurang-kurangnya satu sebab penolakan.');
      return;
    }

    if (!confirm('Adakah anda pasti ingin menghantar penilaian temuduga ini?')) {
      return;
    }

    const breakdown = aspectsList.map(a => `- ${a.label}: ${aspectScores[a.id]} (${scales.find(s => s.value === aspectScores[a.id])?.label})`).join('\n');
    const reasonsStr = finalDecision === 'GAGAL' ? `\nSebab Penolakan:\n${rejectionReasons.map(r => `- ${r}`).join('\n')}` : '';
    
    const formattedNotes = `=== PENILAIAN TEMUDUGA ===\n`
      + `Tarikh: ${new Date().toLocaleDateString('ms-MY')}\n`
      + `Panel Penilai: ${panelName} (${panelDesignation})\n`
      + `Jumlah Markah: ${totalScore}/40 (${calculatedPercentage}%)\n`
      + `Keputusan: ${finalDecision}\n\n`
      + `Pecahan Markah:\n${breakdown}\n`
      + reasonsStr + `\n\n`
      + `Ulasan:\n${evaluationComments}\n`
      + (selectedApplicant.notes ? `\n---\n${selectedApplicant.notes}` : '');

    try {
      setLoading(true);
      await axios.post(`/api/enrollment/update-interview/${dbId}`, {

        hafazan_mark: calculatedPercentage,
        tajwid_mark: calculatedPercentage,
        akhlaq_mark: calculatedPercentage,
        status: finalDecision === 'LULUS' ? 'ACCEPTED' : 'REJECTED',
        notes: formattedNotes
      });

      alert('Penilaian temuduga berjaya disimpan!');
      setShowEvaluationModal(false);
      fetchApplicants();
      setSelectedApplicant(null);
    } catch (err) {
      alert('Gagal menyimpan penilaian temuduga.');
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppOffer = (applicant: Applicant) => {
    const message = `Assalamualaikum Tn/Puan ${applicant.parentName}, Tahniah! Anak anda ${applicant.name} telah DITERIMA masuk ke AKMAL Tahfiz. Sila muat turun surat tawaran: https://akmal-tahfiz.edu.my/off/${applicant.id}`;
    window.open(`https://wa.me/${applicant.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusBadge = (status: EnrollmentStatus) => {
    const config = {
      PROSPECT: { label: 'Calon', cls: 'bg-blue-100 text-blue-700' },
      SCHEDULED: { label: 'Dijadualkan', cls: 'bg-indigo-100 text-indigo-700' },
      INTERVIEW: { label: 'Temuduga', cls: 'bg-amber-100 text-amber-700' },
      ACCEPTED: { label: 'Diterima', cls: 'bg-emerald-100 text-emerald-700' },
      REJECTED: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
      OFFERED: { label: 'Tawaran Dihantar', cls: 'bg-purple-100 text-purple-700' },
      WAITING_PAYMENT: { label: 'Menunggu Bayaran', cls: 'bg-orange-100 text-orange-700' },
      ENROLLED: { label: 'Aktif', cls: 'bg-slate-900 text-white' },
    };
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config[status].cls}`}>{config[status].label}</span>;
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Sahkan pendaftaran pelajar ini? Emel pengesahan akan dihantar kepada ibu bapa.')) return;
    setAddSubmitting(true);
    try {
      const res = await axios.post('/api/enrollment/applicants', addForm);
      const s = res.data.student;
      const newApplicant: Applicant = {
        id: `APP-${s.id}`,
        dbId: s.id,
        name: s.name,
        gender: s.gender,
        parentName: addForm.parentName,
        phone: addForm.parentPhone,
        icNo: addForm.studentIc,
        dateApplied: new Date().toISOString().split('T')[0],
        status: 'PROSPECT',
      };
      setApplicants(prev => [newApplicant, ...prev]);
      setShowAddModal(false);
      setAddForm({ studentName:'', studentIc:'', studentGender:'Lelaki', studentDob:'', studentAge:'', studentAddress:'', parentName:'', parentEmail:'', parentPhone:'', parentIc:'', parentJob:'', quranLevel:'', notes:'' });
      alert(res.data.message);
    } catch (err: any) {
      alert('Gagal: ' + (err.response?.data?.message || 'Ralat sambungan.'));
    } finally {
      setAddSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight underline decoration-[#6FC7CB] decoration-4 underline-offset-8">Pusat Pengurusan Kemasukan</h2>
          <p className="text-slate-500 font-medium mt-3">Proses pendaftaran & temuduga sistematik (Automasi AKMAL).</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all">
            <Download className="size-4" /> EKSPORT DATA
          </button>
          <button
            onClick={async () => {
              const res = await axios.get('/api/enrollment/schedules');
              setAllSchedules(Array.isArray(res.data) ? res.data : []);
              setShowAllSchedules(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6FC7CB] text-white rounded-xl font-bold text-xs hover:bg-[#5FB3B7] shadow-xl shadow-cyan-100 transition-all font-black tracking-widest"
          >
            <Calendar className="size-4" /> JADUAL TEMUDUGA
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all tracking-widest"
          >
            <Users className="size-4" /> + TAMBAH PELAJAR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`p-6 rounded-[32px] border border-slate-100 shadow-sm ${s.bg}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${s.color}`}>{s.label}</p>
            <p className="text-4xl font-black text-slate-800">{s.count}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
        <Search className="size-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setApplicantsPage(1); }}
          placeholder="Cari nama pelajar, penjaga, atau IC..."
          className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-300 text-slate-700"
        />
        {searchTerm && (
          <button onClick={() => { setSearchTerm(''); setApplicantsPage(1); }} className="text-slate-300 hover:text-slate-500 text-lg leading-none">✕</button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['ALL', 'PROSPECT', 'SCHEDULED', 'INTERVIEW', 'ACCEPTED', 'OFFERED'].map((t) => (
          <button
            key={t}
            onClick={() => { setActiveTab(t as any); setApplicantsPage(1); }}
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeTab === t ? 'bg-[#1A4D50] text-[#6FC7CB] border-[#1A4D50] shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-[#6FC7CB]'
              }`}
          >
            {t === 'ALL' ? 'Semua Pemohon' : t === 'PROSPECT' ? 'Calon' : t === 'SCHEDULED' ? 'Dijadualkan' : t === 'INTERVIEW' ? 'Temuduga' : t === 'ACCEPTED' ? 'Layak' : 'Tawaran'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {(() => {
            const q = searchTerm.toLowerCase();
            const filtered = applicants.filter(a =>
              (activeTab === 'ALL' || a.status === activeTab) &&
              (!q || a.name.toLowerCase().includes(q) || a.parentName.toLowerCase().includes(q) || a.icNo?.toLowerCase().includes(q) || a.parentEmail?.toLowerCase().includes(q))
            );
            const paginated = filtered.slice((applicantsPage - 1) * APPLICANTS_PER_PAGE, applicantsPage * APPLICANTS_PER_PAGE);
            const totalPages = Math.ceil(filtered.length / APPLICANTS_PER_PAGE);
            return (<>
              {paginated.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                setSelectedApplicant(a);
                if (a.marks) setInterviewMarks(a.marks);
                else setInterviewMarks({ hafazan: 0, tajwid: 0, akhlaq: 0 });
              }}
              className={`p-6 rounded-[32px] bg-white border-2 transition-all cursor-pointer group ${selectedApplicant?.id === a.id ? 'border-[#6FC7CB] shadow-2xl shadow-cyan-50' : 'border-slate-100 hover:border-slate-200'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#6FC7CB] transition-colors">
                    <Users className="size-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-lg leading-tight">{a.name}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${a.gender === 'Lelaki' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>{a.gender}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Penjaga: {a.parentName}</p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(a.status)}
                  <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center justify-end gap-1 uppercase">
                    <Clock className="size-3" /> DAFTAR: {a.dateApplied}
                  </p>
                </div>
              </div>
            </div>
              ))}
              <Pagination currentPage={applicantsPage} totalPages={totalPages} onPageChange={setApplicantsPage} totalItems={filtered.length} itemsPerPage={APPLICANTS_PER_PAGE} />
            </>);
          })()}
        </div>

        <div className="lg:col-span-1">
          {selectedApplicant ? (
            <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl sticky top-8 animate-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-10">
                <div className="size-24 bg-gradient-to-br from-[#1A4D50] to-[#6FC7CB] rounded-[38px] flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-2xl shadow-cyan-100">
                  {selectedApplicant.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedApplicant.name}</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">{selectedApplicant.id}</p>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="size-5 text-emerald-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Telefon Penjaga</p>
                      <p className="text-sm font-bold text-slate-700">{selectedApplicant.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => window.open(`https://wa.me/${selectedApplicant.phone}`, '_blank')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                    <ExternalLink className="size-4" />
                  </button>
                </div>

                {selectedApplicant.parentEmail && (
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Mail className="size-5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase">E-mel Penjaga</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{selectedApplicant.parentEmail}</p>
                    </div>
                  </div>
                )}

                {selectedApplicant.interviewDate && (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Jadual Temuduga</p>
                    <p className="text-sm font-bold text-slate-700">{selectedApplicant.interviewDate} • {selectedApplicant.interviewTime}</p>
                    <p className="text-xs text-slate-500 mt-1">{selectedApplicant.interviewType} — {selectedApplicant.interviewLocation}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {selectedApplicant.status === 'PROSPECT' && (
                    <button onClick={() => {
                        setScheduleForm({
                          date: '',
                          time: '',
                          type: 'Fizikal',
                          location: ''
                        });
                        setShowScheduleModal(true);
                    }} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2">
                      <Calendar className="size-4" /> JADUALKAN TEMUDUGA
                    </button>
                  )}

                  {(selectedApplicant.status === 'SCHEDULED' || selectedApplicant.status === 'INTERVIEW') && (
                    <button
                      onClick={async () => {
                        // If still SCHEDULED, silently move to INTERVIEW first
                        if (selectedApplicant.status === 'SCHEDULED' && selectedApplicant.dbId) {
                          await axios.patch(`/api/enrollment/status/${selectedApplicant.dbId}`, { status: 'INTERVIEW' });
                          setApplicants(prev => prev.map(a => a.id === selectedApplicant.id ? { ...a, status: 'INTERVIEW' } : a));
                          setSelectedApplicant(prev => prev ? { ...prev, status: 'INTERVIEW' } : null);
                        }
                        setAspectScores({ 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3 });
                        setEvaluationComments('');
                        setPanelName('');
                        setPanelDesignation('Temuduga Mudir');
                        setRejectionReasons([]);
                        setOverrideDecision(null);
                        setShowEvaluationModal(true);
                      }}
                      className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="size-4" /> ISI BORANG PENILAIAN
                    </button>
                  )}
                  {selectedApplicant.status === 'ACCEPTED' && (
                    <button onClick={() => setShowOfferModal(true)} className="w-full py-4 bg-[#1A4D50] text-[#6FC7CB] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 shadow-xl transition-all flex items-center justify-center gap-2">
                      <FileText className="size-4" /> JANA SURAT TAWARAN
                    </button>
                  )}
                  {selectedApplicant.status === 'OFFERED' && (
                    <button onClick={() => updateStatus(selectedApplicant.id, 'ENROLLED')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-2xl transition-all flex items-center justify-center gap-3">
                      <ShieldCheck className="size-4" /> SAHKAN PENDAFTARAN
                    </button>
                  )}
                  {selectedApplicant.status === 'ENROLLED' && (
                    <button onClick={() => window.location.href = '/app/admin/dashboard?tab=students'} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-2xl transition-all flex items-center justify-center gap-3">
                      <Users className="size-4" /> BUKA PROFIL PELAJAR
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Nota Pegawai Admin</p>
                <textarea value={selectedApplicant.notes || ''} onChange={e => setSelectedApplicant({ ...selectedApplicant, notes: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm italic text-slate-500 min-h-[80px]" placeholder="Masukkan catatan temuduga di sini..." />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px] text-center">
              <Zap className="size-12 text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Pilih calon untuk melihat butiran & tindakan</p>
            </div>
          )}
        </div>
      </div>

      {showOfferModal && selectedApplicant && (
        <div className="fixed inset-0 bg-[#1A4D50]/80 backdrop-blur-xl flex items-center justify-center p-6 z-[60]">
          <div className="bg-white w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in duration-500 flex flex-col max-h-[90vh]">
            <div className="flex-1 overflow-y-auto p-12 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="flex justify-between items-start mb-12">
                <img src="/images/logo.png" alt="Logo Akmal" className="h-16 object-contain" />

                <div className="text-right">
                  <p className="text-[10px] font-black text-[#6FC7CB] uppercase tracking-[0.4em]">Surat Tawaran Rasmi</p>
                  <p className="text-slate-400 font-mono text-xs mt-1">REF: AKM/OFF/{new Date().getFullYear()}/{selectedApplicant.id.split('-')[1]}</p>
                </div>
              </div>

              <div className="space-y-6 text-slate-800">
                <p className="font-bold text-slate-600">Teruntuk Tn/Puan {selectedApplicant.parentName},</p>
                <p className="text-4xl font-black tracking-tight leading-none text-slate-900 uppercase">TAWARAN KEMASUKAN PELAJAR BAHARU</p>
                <p className="leading-relaxed font-medium text-slate-500">
                  Memaklumkan bahawa anakanda **{selectedApplicant.name}**, telah berjaya dalam sesi temuduga dengan markah purata **{selectedApplicant.marks ? Math.round((selectedApplicant.marks.hafazan + selectedApplicant.marks.tajwid + selectedApplicant.marks.akhlaq) / 3) : 0}%** dan ditawarkan tempat di AKMAL Tahfiz.
                </p>



                <div className="grid grid-cols-2 gap-8 py-6 border-y border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tarikh Pendaftaran</p>
                    <p className="font-black text-lg text-slate-800">15 JUN 2026</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Temuduga</p>
                    <p className="font-black text-lg text-emerald-600 uppercase tracking-tight">CEMERLANG</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-12 pt-4 bg-white border-t border-slate-50">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full py-5 bg-[#1A4D50] text-[#6FC7CB] rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
                >
                  <Download className="size-6" /> MUAT TURUN PDF (TAWARAN)
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!selectedApplicant) return;
                      if (!confirm('Adakah anda pasti mahu menukar status calon ini kepada Tawaran Dihantar?')) {
                        return;
                      }
                      try {
                        await axios.post(`/api/enrollment/send-offer-email/${selectedApplicant.dbId}`);
                        alert(`Surat tawaran telah dihantar ke e-mel penjaga.`);
                        setShowOfferModal(false);
                        fetchApplicants(); // Refresh status
                      } catch (err: any) {
                        const msg = err.response?.data?.message || 'Gagal menghantar e-mel. Sila pastikan e-mel penjaga adalah sah.';
                        alert(msg);
                      }
                    }}
                    className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
                  >
                    <Mail className="size-6 text-white" /> EMAIL
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedApplicant) return;
                      if (!confirm('Adakah anda pasti mahu menukar status calon ini kepada Tawaran Dihantar?')) {
                        return;
                      }
                      sendWhatsAppOffer(selectedApplicant);
                      try {
                        await axios.patch(`/api/enrollment/status/${selectedApplicant.dbId}`, { status: 'OFFERED' });
                        setApplicants(prev => prev.map(a => a.id === selectedApplicant.id ? { ...a, status: 'OFFERED' } : a));
                        setSelectedApplicant(prev => prev ? { ...prev, status: 'OFFERED' } : null);
                        setShowOfferModal(false);
                      } catch (err) {
                        alert('Gagal mengemaskini status');
                      }
                    }}
                    className="flex-1 py-5 bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3"
                  >
                    <MessageCircle className="size-6 fill-white" /> WHATSAPP
                  </button>
                  <button onClick={() => setShowOfferModal(false)} className="px-10 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">BATAL</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedApplicant && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-[70]">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl animate-in zoom-in duration-300 p-10">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tetapkan Jadual Temuduga</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Calon: {selectedApplicant.name}</p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tarikh</label>
                  <input type="date" value={scheduleForm.date} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:border-[#6FC7CB] transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Masa</label>
                  <input type="time" value={scheduleForm.time} onChange={e => setScheduleForm({...scheduleForm, time: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:border-[#6FC7CB] transition-all" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Jenis Temuduga</label>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => setScheduleForm({...scheduleForm, type: 'Fizikal'})} className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${scheduleForm.type === 'Fizikal' ? 'bg-[#1A4D50] text-[#6FC7CB] border-[#1A4D50]' : 'border-slate-100 text-slate-400'}`}>Bersemuka</button>
                   <button onClick={() => setScheduleForm({...scheduleForm, type: 'Online'})} className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${scheduleForm.type === 'Online' ? 'bg-[#1A4D50] text-[#6FC7CB] border-[#1A4D50]' : 'border-slate-100 text-slate-400'}`}>Atas Talian</button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{scheduleForm.type === 'Online' ? 'Pautan (Meet/Zoom)' : 'Lokasi (Bilik/Kampus)'}</label>
                <input type="text" placeholder={scheduleForm.type === 'Online' ? 'https://google.meet/...' : 'Bilik Gerakan AKMAL'} value={scheduleForm.location} onChange={e => setScheduleForm({...scheduleForm, location: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:border-[#6FC7CB] transition-all" />
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <button onClick={handleSchedule} className="flex-1 py-4 bg-[#6FC7CB] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5FB3B7] shadow-xl shadow-cyan-100 transition-all">SIMPAN & HANTAR EMEL</button>
              <button onClick={() => setShowScheduleModal(false)} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">BATAL</button>
            </div>
          </div>
        </div>
      )}
      {/* Global Schedules Modal */}
      {showAllSchedules && (
        <div className="fixed inset-0 bg-[#1A4D50]/90 backdrop-blur-xl flex items-center justify-center p-6 z-[70]">
           <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
              <div className="p-10 flex justify-between items-center border-b border-slate-50">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Semua Jadual Temuduga</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total: {allSchedules.length} Sesi Aktif</p>
                </div>
                <button onClick={() => setShowAllSchedules(false)} className="size-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all text-2xl">✕</button>
              </div>

              <div className="p-10 max-h-[60vh] overflow-y-auto">
                {allSchedules.length === 0 ? (
                  <div className="py-20 text-center text-slate-300 italic font-medium">Tiada jadual temuduga yang aktif setakat ini.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allSchedules.map((s) => (
                      <div key={s.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-[#6FC7CB] transition-all flex gap-4">
                        <div className="size-12 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                           <p className="text-[10px] font-black text-[#6FC7CB] uppercase">{new Date(s.interview_date).toLocaleString('default', { month: 'short' })}</p>
                           <p className="text-lg font-black text-slate-800 leading-none">{new Date(s.interview_date).getDate()}</p>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{s.name}</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-white text-[10px] font-bold text-slate-500 rounded-lg border border-slate-100 uppercase">{s.interview_time}</span>
                            <span className="px-2 py-0.5 bg-sky-50 text-[10px] font-bold text-sky-600 rounded-lg border border-sky-100 uppercase">{s.interview_type}</span>
                            <span className="px-2 py-0.5 bg-slate-900 text-[10px] font-bold text-white rounded-lg uppercase truncate max-w-[150px]">{s.interview_location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-10 pt-0">
                <button onClick={() => setShowAllSchedules(false)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all">TUTUP KALENDAR</button>
              </div>
           </div>
        </div>
      )}
      {/* Digitized Hardcopy Interview Evaluation Modal */}
      {showEvaluationModal && selectedApplicant && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-[80]">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col border border-slate-100" style={{ maxHeight: '95vh' }}>
            {/* Hardcopy-like Header — always visible, never scrolls away */}
            <div className="shrink-0 p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <img src="/images/logo.png" alt="Logo" className="h-14 object-contain" />
                <div>
                  <p className="text-[10px] font-black tracking-widest text-[#1A4D50] uppercase">AKADEMI AL-QURAN AMALILLAH</p>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">BORANG PEMARKAHAN TEMUDUGA PELAJAR</h3>
                </div>
              </div>
              
              {/* Max/Pass Box */}
              <div className="flex items-center gap-4 border-2 border-slate-200/80 rounded-2xl px-4 py-3 bg-white shrink-0">
                <div className="text-xs font-bold text-slate-500 uppercase space-y-0.5">
                  <div>Maks: <span className="text-slate-800 font-extrabold">40</span></div>
                  <div>Lulus: <span className="text-slate-800 font-extrabold">50%</span></div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pencapaian</div>
                  <div className="text-xl font-black text-[#1A4D50]">{totalScore}/40 = {calculatedPercentage}%</div>
                </div>
              </div>
            </div>

            {/* Scrollable body — everything between header and footer buttons scrolls here */}
            <div className="flex-1 overflow-y-auto">

            {/* Candidate Info */}
            <div className="px-8 py-5 border-b border-slate-100 grid grid-cols-3 gap-6 bg-white shrink-0">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NAMA CALON</p>
                <p className="text-sm font-black text-slate-700 uppercase mt-1">{selectedApplicant.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UMUR CALON</p>
                <p className="text-sm font-black text-slate-700 uppercase mt-1">{selectedApplicant.icNo ? (() => { const yr = parseInt(selectedApplicant.icNo.substring(0,2)); const full = yr > 30 ? 1900+yr : 2000+yr; return new Date().getFullYear()-full; })() + ' Tahun' : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TARIKH TEMUDUGA</p>
                <p className="text-sm font-black text-slate-700 uppercase mt-1">{new Date().toLocaleDateString('ms-MY')}</p>
              </div>
            </div>

            {/* Scoring Table */}
            <div className="p-8 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3 w-12 text-center">BIL</th>
                    <th className="pb-3">ASPEK PENILAIAN</th>
                    {scales.map(s => (
                      <th key={s.value} className="pb-3 text-center w-24">
                        <div className="text-[9px] font-black text-slate-400 uppercase leading-none">{s.value}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {aspectsList.map((asp, idx) => (
                    <tr key={asp.id} className="hover:bg-slate-50/50">
                      <td className="py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-4 font-bold text-slate-700">{asp.label}</td>
                      {scales.map(scale => (
                        <td key={scale.value} className="py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setAspectScores({ ...aspectScores, [asp.id]: scale.value })}
                            className={`size-8 rounded-full font-black text-xs transition-all ${
                              aspectScores[asp.id] === scale.value
                                ? 'bg-[#6FC7CB] text-white shadow-lg shadow-cyan-100'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {scale.value}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-slate-50/80 font-black border-t-2 border-slate-200">
                    <td colSpan={2} className="py-5 text-right pr-6 uppercase tracking-wider text-xs text-slate-500">Jumlah Skor Dinilai</td>
                    <td colSpan={5} className="py-5 text-center text-xl text-[#1A4D50]">
                      {totalScore} / 40 &times; 100 = <span className="underline decoration-[#6FC7CB] decoration-4">{calculatedPercentage}%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Decision, Rejection Reasons & Comments */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/30 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: Decision & Rejection Reasons */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-3">KEPUTUSAN PENILAIAN</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOverrideDecision('LULUS')}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${
                        finalDecision === 'LULUS'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100'
                          : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="size-4" /> LULUS {autoDecision === 'LULUS' && <span className="text-[9px] bg-emerald-700/50 px-1.5 py-0.5 rounded text-white font-bold ml-1">AUTO</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverrideDecision('GAGAL')}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${
                        finalDecision === 'GAGAL'
                          ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-100'
                          : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'
                      }`}
                    >
                      <XCircle className="size-4" /> GAGAL {autoDecision === 'GAGAL' && <span className="text-[9px] bg-red-700/50 px-1.5 py-0.5 rounded text-white font-bold ml-1">AUTO</span>}
                    </button>
                  </div>
                </div>

                {/* Sebab Penolakan Checklist */}
                {finalDecision === 'GAGAL' && (
                  <div>
                    <h4 className="text-[10px] font-black tracking-widest uppercase mb-3 text-red-500 font-extrabold">SEBAB PENOLAKAN (JIKA GAGAL)</h4>
                    <div className="space-y-2.5 p-5 rounded-3xl border bg-white border-red-100">
                      {rejectionOptions.map((opt) => (
                        <label key={opt} className="flex items-start gap-3 cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-800">
                          <input
                            type="checkbox"
                            checked={rejectionReasons.includes(opt)}
                            onChange={e => {
                              if (e.target.checked) setRejectionReasons([...rejectionReasons, opt]);
                              else setRejectionReasons(rejectionReasons.filter(r => r !== opt));
                            }}
                            className="mt-0.5 rounded border-slate-300 text-red-500 focus:ring-red-400 size-4"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Ulasan (Comments) & Signature details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-3">ULASAN PENILAI</h4>
                  <textarea
                    required
                    rows={4}
                    value={evaluationComments}
                    onChange={e => setEvaluationComments(e.target.value)}
                    placeholder="Sila masukkan ulasan komprehensif berkenaan prestasi hafazan, kelancaran tajwid, akhlak, dan kesediaan calon..."
                    className="w-full p-4 border border-slate-200 rounded-3xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#6FC7CB] focus:border-transparent transition-all placeholder:text-slate-300 bg-white min-h-[140px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 block mb-2">NAMA PANEL PENILAI</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama penuh panel"
                      value={panelName}
                      onChange={e => setPanelName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#6FC7CB] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 block mb-2">JAWATAN (SEMAKAN PEJABAT)</label>
                    <select
                      required
                      value={panelDesignation}
                      onChange={e => setPanelDesignation(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#6FC7CB] outline-none"
                    >
                      <option value="Temuduga Mudir">Temuduga Mudir</option>
                      <option value="Temuduga Murabbi / Murabbiah">Temuduga Murabbi / Murabbiah</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            </div>{/* end scrollable body */}

            {/* Action Buttons — always pinned at bottom, never scrolls away */}
            <div className="shrink-0 p-6 border-t border-slate-100 flex gap-4 bg-white justify-end">
              <button
                type="button"
                onClick={() => setShowEvaluationModal(false)}
                className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={submitEvaluation}
                className="px-10 py-4 bg-[#1A4D50] hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                <CheckCircle2 className="size-4" /> SIMPAN PENILAIAN
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── TAMBAH PELAJAR MODAL ──────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Tambah Pelajar Baharu</h3>
                  <p className="text-xs text-slate-400 mt-1">Daftarkan pelajar secara manual. Emel pengesahan akan dihantar kepada ibu bapa.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">✕</button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-6">
                {/* Maklumat Pelajar */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#6FC7CB] mb-3">Maklumat Pelajar</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Nama Penuh Pelajar *', key: 'studentName', type: 'text', required: true },
                      { label: 'No. IC Pelajar *', key: 'studentIc', type: 'text', required: true },
                      { label: 'Tarikh Lahir *', key: 'studentDob', type: 'date', required: true },
                      { label: 'Umur *', key: 'studentAge', type: 'number', required: true },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-bold text-slate-500 mb-1">{f.label}</label>
                        <input
                          type={f.type}
                          required={f.required}
                          value={(addForm as any)[f.key]}
                          onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6FC7CB]"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Jantina *</label>
                      <select
                        value={addForm.studentGender}
                        onChange={e => setAddForm(prev => ({ ...prev, studentGender: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6FC7CB]"
                      >
                        <option value="Lelaki">Lelaki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tahap Bacaan Al-Quran</label>
                      <select
                        value={addForm.quranLevel}
                        onChange={e => setAddForm(prev => ({ ...prev, quranLevel: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6FC7CB]"
                      >
                        <option value="">-- Pilih Tahap --</option>
                        <option value="Belum Pandai Membaca">Belum Pandai Membaca</option>
                        <option value="Sedang Belajar Mengaji">Sedang Belajar Mengaji</option>
                        <option value="Khatam Al-Quran">Khatam Al-Quran</option>
                        <option value="Hafaz Sebahagian Al-Quran">Hafaz Sebahagian Al-Quran</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Alamat Pelajar *</label>
                      <textarea
                        required
                        rows={2}
                        value={addForm.studentAddress}
                        onChange={e => setAddForm(prev => ({ ...prev, studentAddress: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6FC7CB] resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Maklumat Ibu Bapa / Penjaga */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-3">Maklumat Ibu Bapa / Penjaga</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Nama Ibu Bapa *', key: 'parentName', type: 'text', required: true },
                      { label: 'Email Ibu Bapa *', key: 'parentEmail', type: 'email', required: true },
                      { label: 'No. Telefon *', key: 'parentPhone', type: 'text', required: true },
                      { label: 'No. IC Ibu Bapa', key: 'parentIc', type: 'text', required: false },
                      { label: 'Pekerjaan', key: 'parentJob', type: 'text', required: false },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-bold text-slate-500 mb-1">{f.label}</label>
                        <input
                          type={f.type}
                          required={f.required}
                          value={(addForm as any)[f.key]}
                          onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6FC7CB]"
                        />
                      </div>
                    ))}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Catatan Tambahan</label>
                      <textarea
                        rows={2}
                        value={addForm.notes}
                        onChange={e => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Catatan dari guru / admin..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6FC7CB] resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addSubmitting}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {addSubmitting ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Mendaftar...</>
                    ) : (
                      <><Users className="size-4" /> Daftar & Hantar Emel</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
