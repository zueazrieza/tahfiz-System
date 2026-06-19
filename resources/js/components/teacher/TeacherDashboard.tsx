import { useState } from 'react';
import { BookOpen, Users, Calendar, FileText, Brain, LogOut, LayoutDashboard, Upload, X, Mic2, Layers, Trophy, Menu } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { RecordHafazan } from './RecordHafazan';
import { ManageAttendance } from './ManageAttendance';
import { UploadReport } from './UploadReport';
import { StudentList } from './StudentList';
import { TeacherAIPrediction } from './TeacherAIPrediction';
import { TeacherAIAssessment } from './TeacherAIAssessment';
import { ManageAchievements } from './ManageAchievements';
import { Announcements } from '../shared/Announcements';
import { StudyRoadmap } from '../shared/StudyRoadmap';
import { ProfileView } from '../profile/ProfileView';
import { useAppStore } from '../../store/AppContext';

interface TeacherDashboardProps {
  userName: string;
  onLogout: () => void;
}

type TeacherView = 'home' | 'hafazan' | 'attendance' | 'report' | 'students' | 'ai' | 'semak-ai' | 'sukatan' | 'pencapaian' | 'profile' | 'announcements';

const navItems: { id: TeacherView; label: string; icon: React.ReactNode }[] = [
  { id: 'home',       label: 'Papan Pemuka',         icon: <LayoutDashboard size={20} /> },
  { id: 'hafazan',    label: 'Rekod Hafazan',        icon: <BookOpen size={20} /> },
  { id: 'attendance', label: 'Urus Kehadiran',       icon: <Calendar size={20} /> },
  { id: 'announcements', label: 'Pengumuman',        icon: <FileText size={20} /> },
  { id: 'report',     label: 'Muat Naik Laporan',     icon: <Upload size={20} /> },
  { id: 'sukatan',    label: 'Sukatan Pelajaran',    icon: <Layers size={20} /> },
  { id: 'semak-ai',   label: 'Semak Rakaman',         icon: <Mic2 size={20} /> },
  { id: 'students',   label: 'Lihat Pelajar',        icon: <Users size={20} /> },
  { id: 'pencapaian', label: 'Urus Pencapaian',     icon: <Trophy size={20} /> },
  { id: 'ai',         label: 'Ramalan AI',            icon: <Brain size={20} /> },
  { id: 'profile',    label: 'Profil Saya',           icon: <Users size={20} /> },
];

export function TeacherDashboard({ userName, onLogout }: TeacherDashboardProps) {
  const isMobile = useIsMobile();
  const [currentView, setCurrentView] = useState<TeacherView>('home');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const { state } = useAppStore();

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const teacher = state.teachers.find(t => 
    String(t.userId) === String(authUser.id) || 
    t.email === authUser.email || 
    (authUser.name && t.name.toLowerCase().includes(authUser.name.toLowerCase().split(' ').slice(-1)[0]))
  ) ?? state.teachers[0];
  const teacherClasses = state.classes.filter(c => teacher?.classIds.some(cid => String(cid) === String(c.id)));
  const myStudentCount = state.students.filter(s => 
    String(s.teacherId) === String(teacher?.id) || 
    teacherClasses.some(c => String(c.id) === String(s.classId))
  ).length;
  const todayName = new Date().toLocaleDateString('ms-MY', { weekday: 'long' });

  const pendingRecords = new Set(
    state.students.filter(s => s.teacherId === teacher?.id).map(s => s.id)
  ).size - new Set(state.hafazanRecords.filter(h => h.date === new Date().toISOString().split('T')[0]).map(h => h.studentId)).size;

  const stats = [
    { label: 'Pelajar Saya',     value: String(myStudentCount),              icon: <Users size={28} />,    color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Jumlah Kelas',     value: String(teacherClasses.length),       icon: <Calendar size={28} />, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Rekod Tertunggak', value: String(Math.max(0, pendingRecords)), icon: <FileText size={28} />, color: '#f59e0b', bg: '#fffbeb' },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'announcements': return <Announcements />;
      case 'hafazan':    return <RecordHafazan />;
      case 'attendance': return <ManageAttendance />;
      case 'report':     return <UploadReport />;
      case 'students':   return <StudentList />;
      case 'ai':         return <TeacherAIPrediction />;
      case 'semak-ai':   return <TeacherAIAssessment />;
      case 'sukatan':    return <StudyRoadmap />;
      case 'pencapaian': return <ManageAchievements />;
      case 'profile':    return <ProfileView userId={authUser?.id || ''} />;
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111', margin: 0 }}>
                Selamat Kembali, {userName} !
              </h2>
              <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                Hari ini ialah {todayName} — berikut adalah ringkasan anda.
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111', margin: '0.4rem 0 0' }}>{s.value}</p>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button onClick={() => setCurrentView('hafazan')}
                style={{ padding: '1.25rem', background: 'linear-gradient(135deg,#16a34a,#14532d)', color: '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', textAlign: 'left' }}>
                <BookOpen size={28} style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Rekod Hafazan</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', opacity: 0.8 }}>Rekod Sabak, Sabki, Manzil</p>
              </button>
              <button onClick={() => setCurrentView('attendance')}
                style={{ padding: '1.25rem', background: 'linear-gradient(135deg,#2563eb,#1e3a8a)', color: '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', textAlign: 'left' }}>
                <Calendar size={28} style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Urus Kehadiran</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', opacity: 0.8 }}>Tandakan kehadiran hari ini</p>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f3f4f6', overflow: 'hidden' }}>
      {/* ─── Mobile backdrop ─── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }} />
      )}

      {/* ─── SIDEBAR ─── */}
      {(!isMobile ? sidebarOpen : true) && (
        <aside style={{
          width: '200px', flexShrink: 0,
          background: 'linear-gradient(180deg, #1A4D50 0%, #6FC7CB 100%)',
          display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto',
          boxShadow: '8px 0 30px rgba(0,0,0,0.1)',
          ...(isMobile ? {
            position: 'fixed' as const, left: 0, top: 0, zIndex: 50,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-200px)',
            transition: 'transform 0.25s ease',
          } : {}),
        }}>
          <div style={{ padding: '1.5rem 1rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <img src="/images/logo.png" alt="Logo" style={{ height: '55px', marginBottom: '0.75rem' }} />
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', margin: 0, letterSpacing: '0.05em' }}>
              {(teacher?.gender === 'F') ? 'MURABBIAH' : 'MURABBI'}
            </p>
            <p style={{ color: '#E8F6F7', fontSize: '0.75rem', margin: '0.2rem 0 0', opacity: 0.9 }}>{userName}</p>
          </div>
          <nav style={{ flex: 1, padding: '0.5rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button key={item.id} onClick={() => { setCurrentView(item.id); if (isMobile) setSidebarOpen(false); }}
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
          <div style={{ padding: '0.75rem 0.6rem 1.25rem' }}>
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
      <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem 1rem' : '1.5rem 2rem' }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '0.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
          {sidebarOpen && !isMobile ? <X size={22} /> : <Menu size={22} />}
        </button>
        {renderContent()}
      </main>
    </div>
  );
}
