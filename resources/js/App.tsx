import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, clearAuthCache } from './hooks/useAuth';

type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

// ── Lazy-load each role dashboard (P2 bundle splitting) ────────────────────
const RoleSelectionPage = React.lazy(() =>
  import('./components/auth/RoleSelectionPage').then((m) => ({ default: m.RoleSelectionPage }))
);
const AuthPage = React.lazy(() =>
  import('./components/auth/AuthPage').then((m) => ({ default: m.AuthPage }))
);
const AdminDashboard = React.lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const TeacherDashboard = React.lazy(() =>
  import('./components/teacher/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard }))
);
const ParentDashboard = React.lazy(() =>
  import('./components/parent/ParentDashboard').then((m) => ({ default: m.ParentDashboard }))
);
const StudentDashboard = React.lazy(() =>
  import('./components/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard }))
);
const PublicRegistration = React.lazy(() =>
  import('./components/auth/PublicRegistration').then((m) => ({ default: m.PublicRegistration }))
);

// ── Full-page spinner shown while /api/me loads or lazy chunk fetches ──────
function FullPageSpinner() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        gap: '1rem',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '4px solid #e2e8f0',
          borderTopColor: '#6FC7CB',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>
        MEMUATKAN…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Server-verified route guard ────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: UserRole }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/role-selection" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/role-selection" replace />;
  return <>{children}</>;
}

// ── Logout helper — clears cache + session cookie via API ─────────────────
export async function handleLogout() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // best-effort
  }
  clearAuthCache();
  // Clear legacy storage too
  sessionStorage.removeItem('authUser');
  localStorage.removeItem('authUser');
  window.location.replace('/app/role-selection');
}

// ── Root redirect — waits for auth then routes to dashboard ───────────────
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  return user
    ? <Navigate to={`/${user.role}/dashboard`} replace />
    : <Navigate to="/role-selection" replace />;
}

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Push initial state to history stack to capture popstate
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
      alert("Tindakan ini tidak dibenarkan atas sebab keselamatan.");
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  return (
    <BrowserRouter basename="/app">
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Auth flow */}
          <Route path="/role-selection" element={<RoleSelectionPage />} />
          <Route path="/auth"           element={<AuthPage />} />
          <Route path="/register/students" element={<PublicRegistration />} />

          {/* Role-guarded dashboards — server-verified */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboardWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute requiredRole="parent">
                <ParentDashboardWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboardWrapper />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/role-selection" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// ── Thin wrappers so lazy components get the name prop from auth ───────────
function AdminDashboardWrapper() {
  const { user } = useAuth();
  return <AdminDashboard userName={user?.full_name ?? user?.name ?? 'Admin'} onLogout={handleLogout} />;
}
function TeacherDashboardWrapper() {
  const { user } = useAuth();
  return <TeacherDashboard userName={user?.full_name ?? user?.name ?? 'Guru'} onLogout={handleLogout} />;
}
function ParentDashboardWrapper() {
  const { user } = useAuth();
  return <ParentDashboard userName={user?.full_name ?? user?.name ?? 'Wali'} onLogout={handleLogout} />;
}
function StudentDashboardWrapper() {
  const { user } = useAuth();
  return <StudentDashboard userName={user?.full_name ?? user?.name ?? 'Pelajar'} onLogout={handleLogout} />;
}