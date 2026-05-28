import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clearAuthCache } from '../../hooks/useAuth';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

const roleDashboards: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent: '/parent/dashboard',
  student: '/student/dashboard',
};

/** Forgot-password modal with modern UI */
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="size-12 bg-cyan-50 rounded-2xl flex items-center justify-center text-[#6FC7CB]">
            <ShieldCheck className="size-6" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
            <ArrowLeft className="size-5" />
          </button>
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-2">Lupa Kata Laluan?</h3>
        
        {sent ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 text-emerald-700">
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold">Arahan dihantar!</p>
                <p className="opacity-90">Sila semak peti masuk <strong>{email}</strong> untuk langkah seterusnya.</p>
              </div>
            </div>
            <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">
              TUTUP
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-slate-500 text-sm leading-relaxed">
              Masukkan e-mel anda yang berdaftar dan kami akan menghantar arahan untuk menetapkan semula kata laluan anda.
            </p>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-300" />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="E-mel anda"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#6FC7CB] outline-none transition-all"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#6FC7CB] text-white rounded-2xl font-bold hover:bg-[#5FB3B7] shadow-xl shadow-cyan-100 transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : 'HANTAR ARAHAN'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as UserRole | null;
  const actionParam = searchParams.get('action') || 'login';

  const [mode, setMode] = useState<'login' | 'register'>(actionParam === 'register' ? 'register' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const selectedRole = roleParam && roleDashboards[roleParam] ? roleParam : null;

  const handleBack = () => navigate('/role-selection');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedRole) {
      setError('Sila pilih peranan terlebih dahulu.');
      return;
    }
    setIsLoading(true);

    try {
      const csrfRes = await fetch('/api/csrf-cookie');
      const csrfJson = await csrfRes.json();
      const csrfToken = csrfJson.token as string;

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          role: selectedRole,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || 'Log masuk gagal. Sila semak perincian anda.');
        setIsLoading(false);
        return;
      }

      // Clear the module-level cache so useAuth re-fetches /api/me
      // with the newly issued session cookie before navigating.
      clearAuthCache();

      navigate(roleDashboards[json.user.role as UserRole]);
    } catch (err) {
      setError('Ralat sambungan rangkaian. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedRole) { setError('Sila pilih peranan.'); return; }
    if (registerData.password !== registerData.confirmPassword) { setError('Kata laluan tidak sepadan.'); return; }
    setIsLoading(true);

    try {
      const csrfRes = await fetch('/api/csrf-cookie');
      const csrfJson = await csrfRes.json();
      const csrfToken = csrfJson.token as string;

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          name: registerData.fullName,
          email: registerData.email,
          password: registerData.password,
          password_confirmation: registerData.confirmPassword,
          role: selectedRole,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const firstErr = json.errors ? Object.values(json.errors as Record<string, string[]>)[0]?.[0] : json.message;
        setError(firstErr || 'Pendaftaran gagal.');
        setIsLoading(false);
        return;
      }

      // Registration leaves user as 'pending' — go to role selection, not dashboard
      navigate('/role-selection');
    } catch (err) {
      setError('Ralat sambungan rangkaian.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#6FC7CB] focus:bg-white outline-none transition-all text-slate-700 placeholder:text-slate-300";
  const labelCls = "block text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1";

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-[#6FC7CB] selection:text-white">
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
      
      {/* ── LEFT SIDE: Brand & Illustration ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1A4D50] overflow-hidden items-center justify-center p-12">
        {/* Abstract Background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] right-[-10%] size-96 rounded-full border-[40px] border-white" />
          <div className="absolute bottom-[-5%] left-[-10%] size-72 rounded-full border-[20px] border-white" />
        </div>
        
        <div className="relative z-10 w-full max-w-lg text-center">
          <div className="inline-flex items-center justify-center size-20 bg-white/10 backdrop-blur-xl rounded-[28px] border border-white/20 mb-8 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Sparkles className="size-10 text-[#6FC7CB]" />
          </div>
          
          <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Selamat Datang ke Portal Pintar AKMAL
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-12 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Sistem pengurusan Tahfiz bersepadu yang memudahkan pemantauan prestasi, hafazan, dan pengurusan akademik Murabbi serta Pelajar.
          </p>
          
          <div className="animate-in fade-in zoom-in duration-1000 delay-300">
            <img 
              src="/images/tahfiz_education_illustration.png" 
              alt="Education Illustration" 
              className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl"
              onError={(e) => {
                // Fallback to logo if generated image not found
                (e.target as HTMLImageElement).src = '/images/logo.png';
                (e.target as HTMLImageElement).classList.add('w-1/2', 'mx-auto', 'opacity-50');
              }}
            />
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 size-4 bg-[#6FC7CB] rounded-full animate-pulse" />
        <div className="absolute bottom-40 right-20 size-8 border-4 border-[#6FC7CB]/20 rounded-full animate-bounce duration-[3000ms]" />
      </div>

      {/* ── RIGHT SIDE: Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50/30">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
          
          {/* Top Bar for Mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="inline-flex items-center gap-3">
              <img src="/images/logo.png" alt="Logo" className="h-10" />
              <span className="text-xl font-black text-[#1A4D50]">AKMAL</span>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <button 
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors mb-6 group"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Peranan
            </button>
            <h1 className="text-3xl font-black text-slate-800 mb-2">
              {mode === 'login' ? 'Log Masuk Portal' : 'Cipta Akaun Baharu'}
            </h1>
            <p className="text-slate-400 font-medium">
              Sila masukkan kelayakan anda sebagai <span className="text-[#6FC7CB] font-bold uppercase tracking-wider underline underline-offset-4">{selectedRole || 'User'}</span>
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 animate-in zoom-in duration-300">
               <AlertCircle className="size-5 shrink-0" />
               <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-6">
            
            {mode === 'register' && (
              <div className="space-y-2">
                <label className={labelCls}>Nama Penuh</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-[#6FC7CB] transition-colors" />
                  <input
                    placeholder="Contoh: Ahmad Zulkifli"
                    value={registerData.fullName}
                    onChange={e => setRegisterData({...registerData, fullName: e.target.value})}
                    className={inputCls}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className={labelCls}>E-mel / Username</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-[#6FC7CB] transition-colors" />
                <input
                  type="text"
                  placeholder="name@email.com"
                  value={mode === 'login' ? loginData.email : registerData.email}
                  onChange={e => mode === 'login' 
                    ? setLoginData({...loginData, email: e.target.value})
                    : setRegisterData({...registerData, email: e.target.value})
                  }
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Kata Laluan</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-[#6FC7CB] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={mode === 'login' ? loginData.password : registerData.password}
                  onChange={e => mode === 'login'
                    ? setLoginData({...loginData, password: e.target.value})
                    : setRegisterData({...registerData, password: e.target.value})
                  }
                  className={inputCls}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <label className={labelCls}>Sahkan Kata Laluan</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-[#6FC7CB] transition-colors" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={registerData.confirmPassword}
                    onChange={e => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    className={inputCls}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between pb-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="peer size-5 opacity-0 absolute cursor-pointer"
                    />
                    <div className="size-5 border-2 border-slate-200 rounded-lg peer-checked:bg-[#6FC7CB] peer-checked:border-[#6FC7CB] transition-all flex items-center justify-center">
                      <CheckCircle2 className="size-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Ingat saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-black text-[#6FC7CB] hover:text-[#5FB3B7] transition-colors hover:underline underline-offset-4"
                >
                  Lupa Kata Laluan?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4.5 bg-slate-900 text-white rounded-[20px] font-bold text-lg hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#6FC7CB]/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] duration-1000 transition-transform" />
              {isLoading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">{mode === 'login' ? 'MASUK PORTAL' : 'CIPTA AKAUN'}</span>
                  <ChevronRight className="size-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-400 font-medium">
              {mode === 'login' ? 'Tiada akaun lagi?' : 'Sudah mempunyai akaun?'}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-2 font-black text-[#6FC7CB] hover:text-[#5FB3B7] transition-colors hover:underline underline-offset-4"
              >
                {mode === 'login' ? 'Daftar Sekarang' : 'Log Masuk'}
              </button>
            </p>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 opacity-20 grayscale">
             <img src="/images/logo.png" alt="Partner 1" className="h-6" />
             <div className="w-px h-4 bg-slate-400" />
             <span className="text-[10px] font-black tracking-[0.2em] uppercase">Akademi Al-Quran Amalillah</span>
          </div>
        </div>
      </div>
    </div>
  );
}
