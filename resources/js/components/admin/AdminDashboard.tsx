import { useState } from 'react';
import { Users, GraduationCap, DollarSign, FileText, Brain, LogOut, LayoutDashboard, X, UserPlus, Shield, Home } from 'lucide-react';
import { ManageStudents } from './ManageStudents';
import { ManageTeachers } from './ManageTeachers';
import { ManagePayments } from './ManagePayments';
import { ManageHostels } from './ManageHostels';
import { ViewReports } from './ViewReports';
import { AIPrediction } from './AIPrediction';
import { EnrollmentHub } from './EnrollmentHub';
import { UserApproval } from './UserApproval';
import { ManageParents } from './ManageParents';
import { FinancialAnalytics } from './FinancialAnalytics';
import { MudirEvaluation } from './MudirEvaluation';
import { Announcements } from '../shared/Announcements';
import { useAppStore, getMonthlyRevenue, timeAgo } from '../../store/AppContext';

interface AdminDashboardProps {
  userName: string;
  onLogout: () => void;
}

type AdminView = 'home' | 'students' | 'enrollment' | 'teachers' | 'parents' | 'payments' | 'reports' | 'ai' | 'users' | 'hostels' | 'analytics' | 'announcements' | 'mudir-eval';

const navItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
  { id: 'home',       label: 'Papan Pemuka',        icon: <LayoutDashboard size={20} /> },
  { id: 'announcements', label: 'Pengumuman',       icon: <FileText size={20} /> },
  { id: 'enrollment', label: 'Kemasukan Pelajar',    icon: <UserPlus size={20} /> },
  { id: 'students',   label: 'Urus Pelajar',         icon: <Users size={20} /> },
  { id: 'teachers',   label: 'Urus Murabbi',         icon: <GraduationCap size={20} /> },
  { id: 'parents',    label: 'Urus Penjaga',         icon: <Users size={20} /> },
  { id: 'hostels',    label: 'Pengurusan Asrama',    icon: <Home size={20} /> },
  { id: 'users',      label: 'Pengurusan Akses',     icon: <Shield size={20} /> },
  { id: 'payments',   label: 'Bayaran & Invois',     icon: <DollarSign size={20} /> },
  { id: 'reports',    label: 'Lihat Laporan',        icon: <FileText size={20} /> },
  { id: 'mudir-eval', label: 'Ujian Mudir',          icon: <Shield size={20} /> },
  { id: 'ai',         label: 'Ramalan AI',           icon: <Brain size={20} /> },
  { id: 'analytics',  label: 'Analitik Kewangan',    icon: <DollarSign size={20} /> },
];

export function AdminDashboard({ userName, onLogout }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { state } = useAppStore();

  const monthlyRev = getMonthlyRevenue(state);
  const stats = [
    { label: 'Jumlah Pelajar',   value: String(state.students.length),              icon: <Users size={28} />,        color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Jumlah Murabbi',   value: String(state.teachers.length),              icon: <GraduationCap size={28} />, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Pendapatan Bulanan', value: `RM ${monthlyRev.toLocaleString()}`,      icon: <DollarSign size={28} />,   color: '#8b5cf6', bg: '#faf5ff' },
    { label: 'Kelas Aktif',      value: String(state.classes.length),               icon: <FileText size={28} />,     color: '#f59e0b', bg: '#fffbeb' },
  ];

  const recentActivities = state.activityLog.slice(0, 6).map(a => ({
    action: a.description,
    name: a.subDescription,
    time: timeAgo(a.timestamp),
  }));

  const renderContent = () => {
    switch (currentView) {
      case 'announcements': return <Announcements />;
      case 'students':   return <ManageStudents />;
      case 'enrollment': return <EnrollmentHub />;
      case 'teachers':   return <ManageTeachers />;
      case 'parents':    return <ManageParents />;
      case 'payments':   return <ManagePayments />;
      case 'hostels':    return <ManageHostels />;
      case 'reports':    return <ViewReports />;
      case 'mudir-eval': return <MudirEvaluation />;
      case 'ai':         return <AIPrediction />;
      case 'users':      return <UserApproval />;
      case 'analytics':  return <FinancialAnalytics />;
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111', margin: 0 }}>
                Selamat Kembali, {userName} !
              </h2>
              <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                Berikut adalah ringkasan sistem pengurusan Tahfiz anda.
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: stat.bg,
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111', margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Activities */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111', margin: '0 0 1rem' }}>
                Aktiviti Terkini
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {recentActivities.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem 0',
                      borderBottom: i < recentActivities.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}
                  >
                    <span style={{
                      marginTop: '5px',
                      flexShrink: 0,
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      display: 'inline-block',
                    }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#111' }}>{a.action}</p>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>{a.name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f3f4f6', overflow: 'hidden' }}>
      {/* ─── SIDEBAR ─── */}
      {sidebarOpen && (
        <aside style={{
          width: '200px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, #1A4D50 0%, #6FC7CB 100%)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          boxShadow: '8px 0 30px rgba(0,0,0,0.1)',
        }}>
          {/* Header */}
          <div style={{ padding: '1.5rem 1rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <img src="/images/logo.png" alt="Logo" style={{ height: '60px', marginBottom: '0.75rem' }} />
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', margin: 0, letterSpacing: '0.05em' }}>ADMIN / MUDIR</p>
            <p style={{ color: '#E8F6F7', fontSize: '0.75rem', margin: '0.2rem 0 0', opacity: 0.9 }}>{userName}</p>
          </div>

          {/* Nav Items */}
          <nav style={{ flex: 1, padding: '0.5rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? '#fff' : 'transparent',
                    color: isActive ? '#6FC7CB' : '#fff',
                    fontWeight: isActive ? 800 : 500,
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    width: '100%',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: '0.75rem 0.6rem 1.25rem' }}>
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.6rem 0.8rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#f87171',
                fontWeight: 600,
                fontSize: '0.82rem',
                width: '100%',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.12)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <LogOut size={20} />
              Log Keluar
            </button>
          </div>
        </aside>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        {/* Sidebar toggle / close */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#374151',
            padding: '0.2rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Toggle sidebar"
        >
          <X size={22} />
        </button>

        {renderContent()}
      </main>
    </div>
  );
}
