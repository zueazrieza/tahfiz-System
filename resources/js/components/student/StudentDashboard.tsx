import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Target, 
  Trophy, 
  Brain, 
  LogOut, 
  BookOpen, 
  LayoutDashboard, 
  Mic2, 
  Users, 
  Layers, 
  X,
  DollarSign,
  Bell,
  Loader2,
  MessageSquare,
  Award
} from 'lucide-react';
import { LearningSchedule } from './LearningSchedule';
import { HafazanTarget } from './HafazanTarget';
import { Achievements } from './Achievements';
import { StudentAIPrediction } from './StudentAIPrediction';
import { HafazanAI } from '../hafazan/HafazanAI';
import { HafazanLevelSelector } from '../hafazan/HafazanLevelSelector';
import { AITajwidBuddy } from './AITajwidBuddy';
import { StudyRoadmap } from '../shared/StudyRoadmap';
import { ProfileView } from '../profile/ProfileView';
import { InfoCenter } from '../shared/InfoCenter';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useAppStore } from '../../store/AppContext';

interface StudentDashboardProps {
  userName: string;
  onLogout: () => void;
}

type StudentView = 'home' | 'schedule' | 'target' | 'achievements' | 'ai' | 'penilaian-ai' | 'pembelajaran' | 'profile' | 'info-center' | 'tajwid-buddy' | 'level-selection';

const navItems: { id: StudentView; label: string; icon: React.ReactNode }[] = [
  { id: 'home',         label: 'Papan Pemuka',      icon: <LayoutDashboard size={20} /> },
  { id: 'schedule',     label: 'Jadual Pelajaran',  icon: <Calendar size={20} /> },
  { id: 'target',       label: 'Sasaran Hafazan',   icon: <Target size={20} /> },
  { id: 'info-center',  label: 'Pusat Maklumat',    icon: <Bell size={20} /> },
  { id: 'pembelajaran', label: 'Pelan Pengajian',   icon: <Layers size={20} /> },
  { id: 'penilaian-ai', label: 'Penilaian AI (Beta)',  icon: <Mic2 size={20} /> },
  { id: 'achievements', label: 'Pencapaian',         icon: <Trophy size={20} /> },
  { id: 'ai',           label: 'Ramalan AI',         icon: <Brain size={20} /> },
  { id: 'tajwid-buddy', label: 'AI Tajwid Buddy',   icon: <MessageSquare size={20} /> },
  { id: 'level-selection', label: 'Peringkat Hafazan', icon: <Award size={20} /> },
  { id: 'profile',      label: 'Profil Saya',        icon: <Users size={20} /> },
];

export function StudentDashboard({ userName, onLogout }: StudentDashboardProps) {
  const [currentView, setCurrentView] = useState<StudentView>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const { state } = useAppStore();

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const id = authUser.linked_id;
        if (id) {
          const res = await axios.get(`/api/students/dashboard/${id}`);
          setDashboardData(res.data);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [authUser.linked_id]);

  if (!authUser.linked_id) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
          <p className="font-bold">Akses Terhad</p>
          <p>Sila log keluar dan log masuk semula untuk mengemaskini sesi anda.</p>
        </div>
        <button onClick={onLogout} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-100 hover:bg-red-700 transition-all">
          LOG KELUAR & LOG MASUK SEMULA
        </button>
      </div>
    );
  }

  const student = dashboardData?.student;
  const stats = [
    { label: 'Kemajuan Semasa',  value: `${dashboardData?.juzukCompleted ?? 0} Juzuk`, icon: <BookOpen size={28} />, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Pangkat Semasa',   value: dashboardData?.rankName ?? 'Beginner',         icon: <Trophy size={28} />,   color: '#8b5cf6', bg: '#faf5ff' },
    { label: 'Hari Berturutan',  value: `${dashboardData?.streak ?? 0} hari`,          icon: <Target size={28} />,   color: '#f59e0b', bg: '#fffbeb' },
  ];

  const studentClass = state.classes.find(c => c.id === student?.class_id);
  const todayName = new Date().toLocaleDateString('ms-MY', { weekday: 'long' });
  const todaySchedule = (studentClass?.schedule ?? []).filter(s => s.day === todayName);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
          <p className="text-gray-500">Memuatkan data papan pemuka anda...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'schedule':     return <LearningSchedule />;
      case 'target':       return <HafazanTarget />;
      case 'achievements': return <Achievements />;
      case 'ai':           return <StudentAIPrediction />;
      case 'penilaian-ai': return <HafazanAI />;
      case 'pembelajaran': return <StudyRoadmap />;
      case 'profile':      return <ProfileView userId={authUser?.id || ''} />;
      case 'info-center':  return <InfoCenter />;
      case 'tajwid-buddy': return <AITajwidBuddy />;
      case 'level-selection': return <HafazanLevelSelector currentRank={dashboardData?.rankName} />;
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111', margin: 0 }}>
                Assalamualaikum, {dashboardData?.student?.name || userName} !
              </h2>
              <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                Semoga Allah memberkati perjalanan hafazan anda 🌿
              </p>
            </div>

            {/* Profile card */}
            <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#faf5ff)', borderRadius: '16px', padding: '1.25rem', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center', flex: 1 }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 700, flexShrink: 0 }}>
                  {userName.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: '#111' }}>{dashboardData?.student?.name || userName}</p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>Kelas: <strong>{dashboardData?.student?.className || 'Tiada Kelas'}</strong> · Ustaz: <strong>{dashboardData?.student?.teacherName || 'Tiada Murabbi'}</strong></p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 700, borderRadius: '999px', padding: '2px 10px' }}>🏆 {dashboardData?.rankName || 'Beginner'}</span>
                    <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.72rem', fontWeight: 700, borderRadius: '999px', padding: '2px 10px' }}>{dashboardData?.juzukCompleted ?? 0} Juzuk Dihafal</span>
                  </div>
                </div>

                <button 
                  onClick={() => setCurrentView('level-selection')}
                  style={{ 
                    padding: '0.75rem', 
                    borderRadius: '12px', 
                    background: '#fff', 
                    border: '1px solid #7c3aed', 
                    color: '#7c3aed',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#faf5ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                >
                  <Award size={24} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>LEVEL</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111', margin: '0.4rem 0 0' }}>{s.value}</p>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Today's Schedule */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111', margin: '0 0 1rem' }}>Jadual Hari Ini</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {todaySchedule.length === 0 && (
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>Tiada sesi dijadualkan hari ini — berehat sejenak! 🌿</p>
                )}
                {todaySchedule.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', background: '#f9fafb', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#16a34a', minWidth: '75px' }}>{item.time}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: '#111' }}>{item.topic}</p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280' }}>{studentClass?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivation */}
            <div style={{ background: 'linear-gradient(135deg,#ede9fe,#dbeafe)', borderRadius: '16px', padding: '1.25rem', border: '2px solid #c4b5fd' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#5b21b6', fontSize: '0.9rem' }}>🌟 Motivasi Harian</p>
              <p style={{ margin: '0.4rem 0 0', color: '#4c1d95', fontStyle: 'italic', fontSize: '0.85rem' }}>
                "Sebaik-baik kamu ialah orang yang mempelajari Al-Quran dan mengajarkannya." – Nabi Muhammad (ﷺ)
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 dark:bg-slate-950 transition-colors duration-500">
      {/* ─── SIDEBAR ─── */}
      {sidebarOpen && (
        <aside className="transition-colors duration-500 from-[#1A4D50] to-[#6FC7CB] dark:from-slate-900 dark:to-slate-800" style={{
          width: '200px', flexShrink: 0,
          background: 'linear-gradient(180deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%)',
          display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto',
          boxShadow: '8px 0 30px rgba(0,0,0,0.1)',
        }}>
          <div style={{ padding: '1.5rem 1rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <img src="/images/logo.png" alt="Logo" style={{ height: '55px', marginBottom: '0.75rem' }} />
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', margin: 0, letterSpacing: '0.05em' }}>PORTAL PELAJAR</p>
            <p style={{ color: '#E8F6F7', fontSize: '0.75rem', margin: '0.2rem 0 0', opacity: 0.9 }}>{userName}</p>
          </div>
          <nav style={{ flex: 1, padding: '0.5rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button key={item.id} onClick={() => setCurrentView(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 0.8rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                    background: isActive ? '#fff' : 'transparent',
                    color: isActive ? '#6FC7CB' : '#fff',
                    fontWeight: isActive ? 800 : 500, fontSize: '0.82rem', width: '100%', textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: '0.75rem 0.6rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <ThemeToggle />
            <button onClick={onLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 0.8rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                background: 'transparent', color: '#f87171', fontWeight: 600, fontSize: '0.82rem', width: '100%',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.12)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <LogOut size={20} /> Log Keluar
            </button>
          </div>
        </aside>
      )}

      {/* ─── MAIN ─── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '0.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
          <X size={22} />
        </button>
        {renderContent()}
      </main>
    </div>
  );
}
