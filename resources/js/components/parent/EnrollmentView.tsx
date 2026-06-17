import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Download, 
  ExternalLink,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';

export function EnrollmentView() {
  const { state } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [enrollmentStudents, setEnrollmentStudents] = useState<any[]>([]);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        // We fetch all applicants, then filter by parent link if possible
        // For simplicity in this demo, we assume the parent link is matching the parent name or phone
        const response = await axios.get('/api/enrollment/applicants');
        const parentName = authUser.name;
        // Filter students belonging to this parent
        const filtered = response.data.filter((s: any) => 
          s.parent_name.toLowerCase() === parentName.toLowerCase() || 
          String(s.parent_id) === String(authUser.id)
        );
        setEnrollmentStudents(filtered);
      } catch (err) {
        console.error('Failed to fetch enrollments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [authUser.id, authUser.name]);

  const handleDecision = async (id: number, decision: 'ACCEPT' | 'REJECT') => {
    if (!confirm(`Adakah anda pasti mahu ${decision === 'ACCEPT' ? 'MENERIMA' : 'MENOLAK'} tawaran ini?`)) return;

    try {
      await axios.post(`/api/enrollment/parent-decide/${id}`, { decision });
      alert(decision === 'ACCEPT' ? 'Tawaran diterima!' : 'Tawaran ditolak.');
      window.location.reload(); // Refresh to show new status
    } catch (err) {
      alert('Gagal menghantar keputusan.');
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Memuatkan Maklumat Pendaftaran...</div>;

  if (enrollmentStudents.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-100 italic text-slate-400">
        Tiada pendaftaran aktif ditemui untuk akaun anda.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#1A4D50] to-[#2D7A7E] p-10 rounded-[40px] text-white shadow-2xl">
        <h2 className="text-3xl font-black tracking-tight">Status Pendaftaran</h2>
        <p className="text-cyan-100 font-medium mt-2">Pantau status kemasukan anakanda anda ke AKMAL Tahfiz.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {enrollmentStudents.map((student) => (
          <div key={student.id} className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="p-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-6">
                  <div className="size-20 bg-slate-50 rounded-[24px] flex items-center justify-center text-[#1A4D50] font-black text-3xl shadow-inner group-hover:scale-110 transition-transform">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">NO. REF: {student.id}</span>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         student.status === 'OFFERED' ? 'bg-purple-100 text-purple-700 animate-pulse' : 
                         student.status === 'WAITING_PAYMENT' ? 'bg-orange-100 text-orange-700' :
                         student.status === 'ENROLLED' ? 'bg-emerald-100 text-emerald-700' :
                         'bg-slate-100 text-slate-700'
                       }`}>
                         {student.status.replace('_', ' ')}
                       </span>
                    </div>
                  </div>
                </div>

                {student.status === 'OFFERED' && (
                  <button 
                    onClick={() => window.open(`/api/enrollment/offer-letter/${student.id}`, '_blank')}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    <Download className="size-4" /> MUAT TURUN SURAT TAWARAN
                  </button>
                )}
              </div>

              {/* Status Specific Content */}
              {student.status === 'SCHEDULED' && (
                <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100 space-y-4">
                  <div className="flex items-center gap-3 text-amber-700 font-black text-sm uppercase tracking-widest">
                    <Calendar className="size-5" /> Jadual Temuduga Telah Ditetapkan
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarikh</p>
                      <p className="font-bold text-slate-700">{student.interview_date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masa</p>
                      <p className="font-bold text-slate-700">{student.interview_time}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis</p>
                      <p className="font-bold text-slate-700">{student.interview_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi/Link</p>
                      <p className="font-bold text-slate-700 break-all">{student.interview_location}</p>
                    </div>
                  </div>
                </div>
              )}

              {student.status === 'OFFERED' && (
                <div className="space-y-6">
                  <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100">
                    <p className="text-emerald-800 font-bold leading-relaxed">
                      Tahniah! Permohonan anakanda anda telah **DITERIMA**. Sila semak surat tawaran dan buat keputusan sebelum tarikh pendaftaran 15 Jun 2026.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleDecision(student.id, 'ACCEPT')}
                      className="flex-1 py-5 bg-[#1A4D50] text-[#6FC7CB] rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 shadow-2xl transition-all flex items-center justify-center gap-3"
                    >
                      <CheckCircle className="size-6" /> TERIMA TAWARAN
                    </button>
                    <button 
                      onClick={() => handleDecision(student.id, 'REJECT')}
                      className="px-10 py-5 bg-white border-2 border-red-100 text-red-500 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-3"
                    >
                      <XCircle className="size-6" /> TOLAK
                    </button>
                  </div>
                </div>
              )}



              {student.status === 'ENROLLED' && (
                <div className="p-8 bg-emerald-900 text-emerald-100 rounded-[32px] shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <ShieldCheck className="size-10 text-[#6FC7CB]" />
                    <div>
                      <p className="font-black text-lg">Pendaftaran Sah!</p>
                      <p className="text-sm opacity-80 font-medium">Anakanda anda kini merupakan pelajar rasmi AKMAL Tahfiz.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.location.href = '/app/parent/dashboard'}
                    className="px-8 py-3 bg-[#6FC7CB] text-[#1A4D50] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-cyan-900/40"
                  >
                    LIHAT PROFIL PENUH
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
