import { useState } from 'react';
import axios from 'axios';
import { Users, GraduationCap, DollarSign, FileText, Brain, LogOut, LayoutDashboard, X, UserPlus, Shield, Home, RefreshCw, Menu } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { usePolling } from '../../hooks/usePolling';
import { ManageStudents } from './ManageStudents';
import { ManageTeachers } from './ManageTeachers';
import { ManagePayments } from './ManagePayments';
import { ViewReports } from './ViewReports';
import { AIPrediction } from './AIPrediction';
import { EnrollmentHub } from './EnrollmentHub';
import { UserApproval } from './UserApproval';
import { ManageParents } from './ManageParents';
import { FinancialAnalytics } from './FinancialAnalytics';
import { MudirEvaluation } from './MudirEvaluation';
import { Announcements } from '../shared/Announcements';


interface AdminDashboardProps {
  userName: string;
  onLogout: () => void;
}

type AdminView = 'home' | 'students' | 'enrollment' | 'teachers' | 'parents' | 'payments' | 'reports' | 'ai' | 'users' | 'analytics' | 'announcements' | 'mudir-eval';

const navItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
  { id: 'home',       label: 'Papan Pemuka',        icon: <LayoutDashboard size={20} /> },
  { id: 'announcements', label: 'Pengumuman',       icon: <FileText size={20} /> },
  { id: 'enrollment', label: 'Kemasukan Pelajar',    icon: <UserPlus size={20} /> },
  { id: 'students',   label: 'Urus Pelajar',         icon: <Users size={20} /> },
  { id: 'teachers',   label: 'Urus Murabbi',         icon: <GraduationCap size={20} /> },
  { id: 'parents',    label: 'Urus Penjaga',         icon: <Users size={20} /> },
  { id: 'users',      label: 'Pengurusan Akses',     icon: <Shield size={20} /> },
  { id: 'payments',   label: 'Bayaran & Invois',     icon: <DollarSign size={20} /> },
  { id: 'reports',    label: 'Lihat Laporan',        icon: <FileText size={20} /> },
  { id: 'mudir-eval', label: 'Ujian Mudir',          icon: <Shield size={20} /> },
  { id: 'ai',         label: 'Ramalan AI',           icon: <Brain size={20} /> },
  { id: 'analytics',  label: 'Analitik Kewangan',    icon: <DollarSign size={20} /> },
];

interface LiveStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalClasses: number;
  monthlyRevenue: number;
  pendingPayments: number;
  todayPresent: number;
  todayAbsent: number;
  newThisWeek: number;
  avgJuzuk: number;
  lastUpdated: string | null;
}

export function AdminDashboard({ userName, onLogout }: AdminDashboardProps) {
  const isMobile = useIsMobile();
  const [currentView, setCurrentView] = useState<AdminView>('home');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    totalStudents: 0, activeStudents: 0, totalTeachers: 0, totalClasses: 0,
    monthlyRevenue: 0, pendingPayments: 0, todayPresent: 0, todayAbsent: 0,
    newThisWeek: 0, avgJuzuk: 0, lastUpdated: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Helper to format activity time relatively
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru sahaja';
    if (diffMins < 60) return `${diffMins} minit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  };

  // ── Live polling: refetch admin stats & activities from DB every 30 s ─────────────────
  usePolling(async () => {
    try {
      const { data } = await axios.get('/api/admin/stats');
      setLiveStats(data);
    } catch { /* silent – keep stale data */ }
    finally { setStatsLoading(false); }

    try {
      const { data } = await axios.get('/api/admin/activities');
      setActivities(data);
    } catch { /* silent – keep stale data */ }
    finally { setActivitiesLoading(false); }
  }, 30_000);

  const stats = [
    { label: 'Jumlah Pelajar',    value: statsLoading ? '…' : String(liveStats.totalStudents),                    icon: <Users size={28} />,        color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Jumlah Murabbi',    value: statsLoading ? '…' : String(liveStats.totalTeachers),                    icon: <GraduationCap size={28} />, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Pendapatan Bulanan', value: statsLoading ? '…' : `RM ${liveStats.monthlyRevenue.toLocaleString()}`, icon: <DollarSign size={28} />,   color: '#8b5cf6', bg: '#faf5ff' },
    { label: 'Kelas Aktif',       value: statsLoading ? '…' : String(liveStats.totalClasses),                     icon: <FileText size={28} />,     color: '#f59e0b', bg: '#fffbeb' },
  ];

  const extraStats = [
    { label: 'Pelajar Aktif',         value: statsLoading ? '…' : String(liveStats.activeStudents),  color: '#10b981' },
    { label: 'Hadir Hari Ini',        value: statsLoading ? '…' : String(liveStats.todayPresent),    color: '#3b82f6' },
    { label: 'Tidak Hadir',           value: statsLoading ? '…' : String(liveStats.todayAbsent),     color: '#ef4444' },
    { label: 'Bayaran Tertunggak',    value: statsLoading ? '…' : String(liveStats.pendingPayments), color: '#f59e0b' },
    { label: 'Pelajar Baru (7 hari)', value: statsLoading ? '…' : String(liveStats.newThisWeek),     color: '#8b5cf6' },
    { label: 'Purata Juzuk',          value: statsLoading ? '…' : String(liveStats.avgJuzuk),         color: '#06b6d4' },
  ];

  const lastUpdatedStr = liveStats.lastUpdated
    ? new Date(liveStats.lastUpdated).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const renderContent = () => {
    switch (currentView) {
      case 'announcements': return <Announcements />;
      case 'students':   return <ManageStudents />;
      case 'enrollment': return <EnrollmentHub />;
      case 'teachers':   return <ManageTeachers />;
      case 'parents':    return <ManageParents />;
      case 'payments':   return <ManagePayments />;
      case 'reports':    return <ViewReports />;
      case 'mudir-eval': return <MudirEvaluation />;
      case 'ai':         return <AIPrediction />;
      case 'users':      return <UserApproval />;
      case 'analytics':  return <FinancialAnalytics />;
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header with LIVE badge */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111', margin: 0 }}>
                  Selamat Kembali, {userName} !
                </h2>
                <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                  Berikut adalah ringkasan sistem pengurusan Tahfiz anda.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '4px 12px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>LANGSUNG</span>
                  <RefreshCw size={12} style={{ color: '#16a34a' }} />
                </div>
                {lastUpdatedStr && (
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Kemas kini: {lastUpdatedStr}</span>
                )}
              </div>
            </div>

            {/* Primary Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem' }}>
              {stats.map((stat) => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111', margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Extra Live Stats Row */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111', margin: 0 }}>Statistik Hari Ini</h3>
                <span style={{ fontSize: '0.7rem', background: '#eff6ff', color: '#3b82f6', borderRadius: '999px', padding: '2px 8px', fontWeight: 600 }}>Dikemas kini setiap 30 saat</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: '0.75rem' }}>
                {extraStats.map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                    <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '4px 0 0', lineHeight: 1.3 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Live Activities */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111', margin: 0 }}>
                  Aktiviti Terkini (Semua Pengguna)
                </h3>
                <span style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#6b7280', borderRadius: '999px', padding: '2px 8px' }}>Aktiviti Langsung</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {activitiesLoading ? (
                  <div style={{ padding: '1rem 0', color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center' }}>Memuatkan aktiviti...</div>
                ) : activities.length === 0 ? (
                  <div style={{ padding: '1.5rem 0', color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center' }}>Tiada aktiviti dikesan lagi.</div>
                ) : (
                  activities.slice(0, 8).map((a, i) => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem 0',
                        borderBottom: i < Math.min(activities.length, 8) - 1 ? '1px solid #f3f4f6' : 'none',
                      }}
                    >
                      <span style={{
                        marginTop: '5px',
                        flexShrink: 0,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        display: 'inline-block',
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#111' }}>{a.description}</p>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{timeAgo(a.created_at)}</span>
                        </div>
                        {a.sub_description && (
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>{a.sub_description}</p>
                        )}
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>Oleh: {a.operator_name || 'Sistem'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  const sidebarBg = 'linear-gradient(180deg, #1A4D50 0%, #6FC7CB 100%)';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f3f4f6', overflow: 'hidden' }}>
      {/* ─── Mobile backdrop ─── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      {(!isMobile ? sidebarOpen : true) && (
        <aside style={{
          width: '200px',
          flexShrink: 0,
          background: sidebarBg,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          boxShadow: '8px 0 30px rgba(0,0,0,0.1)',
          ...(isMobile ? {
            position: 'fixed' as const,
            left: 0,
            top: 0,
            zIndex: 50,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-200px)',
            transition: 'transform 0.25s ease',
          } : {}),
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
                  onClick={() => { setCurrentView(item.id); if (isMobile) setSidebarOpen(false); }}
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
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
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
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 0.8rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                background: 'transparent', color: '#f87171', fontWeight: 600, fontSize: '0.82rem', width: '100%',
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
      <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem 1rem' : '1.5rem 2rem' }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '0.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}
          title="Toggle sidebar"
        >
          {sidebarOpen && !isMobile ? <X size={22} /> : <Menu size={22} />}
        </button>

        {renderContent()}
      </main>
    </div>
  );
}
