import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import axios from 'axios';
import { usePolling } from '../../hooks/usePolling';
import { User, BookOpen, Calendar, DollarSign, Bell, Brain, LogOut, LayoutDashboard, X, Menu } from 'lucide-react';
import { ViewProgress } from './ViewProgress';
import { ViewAttendance } from './ViewAttendance';
import { ViewPayments } from './ViewPayments';
import { InfoCenter } from '../shared/InfoCenter';
import { ParentAIPrediction } from './ParentAIPrediction';
import { ProfileView } from '../profile/ProfileView';
import { useAppStore } from '../../store/AppContext';
import { EnrollmentView } from './EnrollmentView';

interface ParentDashboardProps {
  userName: string;
  onLogout: () => void;
}

type ParentView = 'home' | 'progress' | 'attendance' | 'payment' | 'inbox' | 'ai' | 'profile';

const navItems: { id: ParentView; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'home',          label: 'Profil Anak',          icon: <LayoutDashboard size={20} /> },
  { id: 'progress',      label: 'Kemajuan Hafazan',      icon: <BookOpen size={20} /> },
  { id: 'attendance',    label: 'Lihat Kehadiran',       icon: <Calendar size={20} /> },
  { id: 'payment',       label: 'Status Yuran',          icon: <DollarSign size={20} /> },
  { id: 'inbox',         label: 'Pusat Maklumat',        icon: <Bell size={20} /> },
  { id: 'ai',            label: 'Ramalan AI',            icon: <Brain size={20} /> },
  { id: 'profile',       label: 'Profil Saya',           icon: <User size={20} /> },
];

export function ParentDashboard({ userName, onLogout }: ParentDashboardProps) {
  const isMobile = useIsMobile();
  const [currentView, setCurrentView] = useState<ParentView>('home');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const { state } = useAppStore();
  const initializedRef = useRef(false);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  // ── Live polling: refresh children data & notif count every 30 s (also fires on mount) ────────
  usePolling(() => {
    fetchChildren();
    fetchUnreadCount();
  }, 30_000);


  const fetchUnreadCount = async () => {
    try {
      const resp = await axios.get('/api/notifications');
      const count = resp.data.filter((n: any) => !n.is_read).length;
      setNotifCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  const fetchChildren = async () => {
    try {
      if (!initializedRef.current) setLoading(true);
      const resp = await axios.get('/api/parent/children');
      setChildren(resp.data);
      if (resp.data.length > 0 && !selectedChildId) {
        setSelectedChildId(String(resp.data[0].id));
      }
    } catch (err) {
      console.error('Failed to fetch children', err);
    } finally {
      if (!initializedRef.current) {
        setLoading(false);
        initializedRef.current = true;
      }
    }
  };

  const child = children.find(c => String(c.id) === selectedChildId) || children[0];
  const parentUser = state.users.find(u => u.name === authUser.name && u.role === 'parent') ?? state.users.find(u => u.role === 'parent')!;

  const [hasPending, setHasPending] = useState(false);
  useEffect(() => {
    if (!child?.id) return;
    axios.get(`/api/payments?student_id=${child.id}`)
      .then(res => {
        const pending = (res.data as any[]).some((p: any) => p.status !== 'Dibayar');
        setHasPending(pending);
      })
      .catch(() => {});
  }, [child?.id]);

  const attendanceRate = child?.attendance_rate ?? 0;

  const navItemsWithBadge = navItems.map(n =>
    n.id === 'inbox' ? { ...n, badge: notifCount > 0 ? String(notifCount) : undefined } : n
  );

  const stats = [
    { label: 'Kemajuan Hafazan', value: `${child?.juzuk_completed ?? 0} Juzuk`, icon: <BookOpen size={28} />, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Kadar Kehadiran',  value: `${attendanceRate}%`,                    icon: <Calendar size={28} />, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Status Yuran',     value: hasPending ? 'Belum Bayar' : 'Dibayar',  icon: <DollarSign size={28} />, color: '#8b5cf6', bg: '#faf5ff' },
    { label: 'Pemberitahuan',    value: `${notifCount} Baharu`,                  icon: <Bell size={28} />,     color: '#f59e0b', bg: '#fffbeb' },
  ];

  const childInfo = {
    name: child?.name ?? '—',
    class: child?.class_name ?? '—',
    teacher: child?.teacher_name ?? '—',
    currentProgress: `${child?.juzuk_completed ?? 0} / 30 Juzuk (${Math.round(((child?.juzuk_completed ?? 0) / 30) * 100)}%)`,
  };

  const renderContent = () => {
    switch (currentView) {
      case 'progress':      return <ViewProgress childId={String(child?.id || '')} childData={child ? { name: child.name, juzukCompleted: child.juzuk_completed ?? child.juzukCompleted, className: child.class_name, teacherName: child.teacher_name } : undefined} />;
      case 'attendance':    return <ViewAttendance childId={String(child?.id || '')} childData={child ? { name: child.name } : undefined} />;
      case 'payment':       return <ViewPayments childId={String(child?.id || '')} childData={child ? { name: child.name } : undefined} />;
      case 'inbox':         return <InfoCenter />;
      case 'ai':            return <ParentAIPrediction childId={String(child?.id || '')} />;
      case 'profile':       return <ProfileView userId={parentUser?.id || ''} />;
      default:
        if (loading) return <div className="p-8 text-slate-500">Memuatkan data anak...</div>;
        if (children.length === 0) return <div className="p-8 text-slate-500">Tiada data anak dijumpai. Sila hubungi Admin.</div>;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111', margin: 0 }}>
                  Selamat Kembali, {userName} !
                </h2>
                <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                  Pantau kemajuan Tahfiz anak anda
                </p>
              </div>

              {/* Child Selector if multiple */}
              {children.length > 1 && (
                <select 
                  value={selectedChildId || ''} 
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '0.9rem' }}
                >
                  {children.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Child Profile Card */}
            <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#eff6ff)', borderRadius: '16px', padding: '1.25rem', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 700, flexShrink: 0 }}>
                  {childInfo.name.charAt(0)}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#111' }}>{childInfo.name}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>Kelas: <strong>{childInfo.class}</strong></p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>Murabbi/Murabbiah: <strong>{childInfo.teacher}</strong></p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.82rem', color: '#16a34a', fontWeight: 600 }}>Kemajuan: {childInfo.currentProgress}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem' }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '1.1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111', margin: '0.4rem 0 0' }}>{s.value}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Updates */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111', margin: '0 0 1rem' }}>Kemas Kini Terkini</h3>
              {[
                { type: 'Hafazan',      msg: 'Diselesaikan Sabak: Al-Baqarah 1-10',       time: '2 jam lalu',  dot: '#16a34a' },
                { type: 'Kehadiran',    msg: 'Hadir – Sesi Pagi',                          time: '4 jam lalu',  dot: '#3b82f6' },
                { type: 'Pencapaian',   msg: 'Prestasi cemerlang dalam Sabki',            time: '1 hari lalu', dot: '#8b5cf6' },
              ].map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                  <span style={{ marginTop: '5px', flexShrink: 0, width: '10px', height: '10px', borderRadius: '50%', background: u.dot, display: 'inline-block' }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#111' }}>{u.type}: {u.msg}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>{u.time}</p>
                  </div>
                </div>
              ))}
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
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', margin: 0, letterSpacing: '0.05em' }}>IBU BAPA / PENJAGA</p>
            <p style={{ color: '#E8F6F7', fontSize: '0.75rem', margin: '0.2rem 0 0', opacity: 0.9 }}>{userName}</p>
          </div>
          <nav style={{ flex: 1, padding: '0.5rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {navItemsWithBadge.map((item) => {
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
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background: '#f97316', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '999px', padding: '1px 6px' }}>
                      {item.badge}
                    </span>
                  )}
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
