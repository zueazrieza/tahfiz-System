import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  BookOpen, 
  ArrowLeft, 
  ChevronRight,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';

type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

interface RoleOption {
  id: UserRole;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

const roles: RoleOption[] = [
  {
    id: 'admin',
    label: 'Pentadbir',
    subtitle: 'Akses penuh ke semua modul sistem',
    icon: <ShieldCheck className="size-6" />,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    id: 'teacher',
    label: 'Murabbi / Murabbiah',
    subtitle: 'Urus rekod pelajar dan kemajuan hafazan',
    icon: <BookOpen className="size-6" />,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    id: 'parent',
    label: 'Ibu Bapa / Penjaga',
    subtitle: 'Pantau kemajuan dan maklumat anak',
    icon: <Users className="size-6" />,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    id: 'student',
    label: 'Pelajar',
    subtitle: 'Lihat jadual dan kemajuan hafazan sendiri',
    icon: <GraduationCap className="size-6" />,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  },
];

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') || 'login';
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleProceed = () => {
    if (!selectedRole) return;
    navigate(`/auth?role=${selectedRole}&action=${action}`);
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-[#6FC7CB] selection:text-white overflow-hidden">
      
      {/* ── LEFT PANEL: Brand & Institutional Context ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1A4D50] overflow-hidden items-center justify-center p-12">
        {/* Abstract Background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] left-[-10%] size-[500px] rounded-full border-[60px] border-white" />
          <div className="absolute bottom-[-20%] right-[-10%] size-[400px] rounded-full border-[30px] border-white" />
        </div>
        
        <div className="relative z-10 w-full max-w-lg text-center">
          
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <img 
              src="/images/logo.png" 
              alt="AKMAL Logo" 
              className="w-48 mx-auto mb-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            />
            <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Sistem Pengurusan<br/>Tahfiz Pintar AKMAL
            </h2>
            <div className="h-1.5 w-24 bg-[#6FC7CB] mx-auto rounded-full mb-8" />
            <p className="text-white/70 text-lg leading-relaxed max-w-sm mx-auto font-medium">
              Satu portal untuk semua. Pilih peranan anda untuk memulakan sesi pengurusan akademik yang lebih efisien.
            </p>
          </div>
          
          {/* Stats/Badges */}
          <div className="flex items-center justify-center gap-6 animate-in fade-in zoom-in duration-1000 delay-300">
             <div className="bg-white/5 border border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl">
               <div className="text-2xl font-black text-white">30</div>
               <div className="text-[10px] font-bold text-[#6FC7CB] uppercase tracking-widest">Juzuk Al-Quran</div>
             </div>
             <div className="bg-white/5 border border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl">
               <div className="text-2xl font-black text-white">4+</div>
               <div className="text-[10px] font-bold text-[#6FC7CB] uppercase tracking-widest">Modul Peranan</div>
             </div>
          </div>
        </div>
        
        {/* Decorative dots */}
        <div className="absolute top-1/4 right-20 grid grid-cols-4 gap-4 opacity-20">
          {[...Array(16)].map((_, i) => <div key={i} className="size-1.5 bg-white rounded-full" />)}
        </div>
      </div>

      {/* ── RIGHT PANEL: Role Selection ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50/30 overflow-y-auto">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/images/logo.png" alt="Logo" className="h-12" />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <button 
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors mb-6 group"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Laman Utama
            </button>
            <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
              {action === 'register' ? 'Daftar Akaun' : 'Selamat Kembali'}
            </h1>
            <p className="text-slate-400 font-medium">
              {action === 'register'
                ? 'Pilih identiti anda untuk memulakan pendaftaran permohonan.'
                : 'Sila pilih peranan anda untuk mengakses dashboard peribadi.'}
            </p>
          </div>

          <div className="space-y-4 mb-10">
            {(action === 'register' ? roles.filter(r => r.id === 'teacher' || r.id === 'parent') : roles).map((role, idx) => {
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`
                    w-full flex items-center gap-5 p-5 rounded-[24px] border-2 transition-all duration-300 relative group
                    ${isSelected 
                      ? 'bg-white border-[#6FC7CB] shadow-2xl shadow-cyan-100/50 -translate-y-1' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }
                  `}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`
                    size-14 rounded-2xl flex items-center justify-center transition-all duration-500
                    ${role.color} ${isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-105'}
                  `}>
                    {role.icon}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <h3 className={`font-black text-lg transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                      {role.label}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium leading-tight">
                      {role.subtitle}
                    </p>
                  </div>

                  <div className={`
                    size-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                    ${isSelected ? 'bg-[#6FC7CB] border-[#6FC7CB]' : 'border-slate-200 group-hover:border-slate-300'}
                  `}>
                    {isSelected && <div className="size-2 bg-white rounded-full shadow-sm" />}
                  </div>

                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-[#1A4D50] text-[#6FC7CB] p-1.5 rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-300">
                      <Sparkles className="size-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleProceed}
            disabled={!selectedRole}
            className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold text-lg hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 group disabled:opacity-50 disabled:bg-slate-200 disabled:shadow-none disabled:active:scale-100"
          >
            <span className="tracking-widest uppercase">
              {action === 'register' ? 'MULAKAN PENDAFTARAN' : 'LOG MASUK SEKARANG'}
            </span>
            <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <footer className="mt-12 pt-8 border-t border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-[0.3em]">
              Akademi Al-Quran Amalillah (AKMAL) • 2026
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
