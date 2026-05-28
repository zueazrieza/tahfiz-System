import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  AppState, buildInitialState, genId,
  Student, Teacher, ClassRoom, HafazanRecord, AttendanceRecord, Payment, Report,
  ActivityLog, Notification, AttendanceStatus, Grade, User
} from './mockData';

// ─── Action Types ─────────────────────────────────────────────────────────────

type Action =
  // Students
  | { type: 'SET_STUDENTS'; payload: Student[] }
  | { type: 'ADD_STUDENT'; payload: Student }
  | { type: 'EDIT_STUDENT'; payload: Partial<Student> & { id: string | number } }
  | { type: 'DELETE_STUDENT'; payload: { id: string | number } }
  // Users
  | { type: 'ADD_USER'; payload: User }
  | { type: 'EDIT_USER'; payload: Partial<User> & { id: string } }
  // Teachers
  | { type: 'SET_TEACHERS'; payload: Teacher[] }
  | { type: 'ADD_TEACHER'; payload: Teacher }
  | { type: 'EDIT_TEACHER'; payload: Partial<Teacher> & { id: string | number } }
  | { type: 'DELETE_TEACHER'; payload: { id: string | number } }
  // Classes
  | { type: 'SET_CLASSES'; payload: ClassRoom[] }
  | { type: 'ADD_CLASS'; payload: ClassRoom }
  // Hafazan
  | { type: 'RECORD_HAFAZAN'; payload: Omit<HafazanRecord, 'id'> }
  // Attendance
  | { type: 'MARK_ATTENDANCE'; payload: Omit<AttendanceRecord, 'id'>[] }
  // Payments
  | { type: 'SET_PAYMENTS'; payload: Payment[] }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'TOGGLE_PAYMENT'; payload: { id: string | number; status: 'Dibayar' | 'Belum Bayar' } }
  // Reports
  | { type: 'SUBMIT_REPORT'; payload: Omit<Report, 'id'> }
  // Activity Log
  | { type: 'LOG_ACTIVITY'; payload: Omit<ActivityLog, 'id' | 'timestamp'> }
  // Notifications
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { id: string } }
  | { type: 'MARK_ALL_READ'; payload: { studentId: string } };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  const now = new Date().toISOString();

  switch (action.type) {
    // ── Students ──
    case 'SET_STUDENTS': {
      return { ...state, students: action.payload };
    }
    case 'ADD_STUDENT': {
      const student = action.payload;
      return {
        ...state,
        students: [...state.students, student],
        activityLog: [
          { id: genId('log'), type: 'student_added', description: 'Pelajar Baharu Didaftarkan', subDescription: student.name, timestamp: now },
          ...state.activityLog,
        ],
        notifications: [
          ...state.notifications,
          { id: genId('n'), studentId: String(student.id), type: 'announcement', title: 'Selamat Datang!', message: `Selamat datang ke AKMAL, ${student.name}! Perjalanan hafazan anda bermula hari ini.`, timestamp: now, read: false },
        ],
      };
    }

    case 'EDIT_STUDENT': {
      return {
        ...state,
        students: state.students.map(s => String(s.id) === String(action.payload.id) ? { ...s, ...action.payload } : s),
        activityLog: [
          { id: genId('log'), type: 'student_edited', description: 'Profil Pelajar Dikemas Kini', subDescription: state.students.find(s => String(s.id) === String(action.payload.id))?.name ?? '', timestamp: now },
          ...state.activityLog,
        ],
      };
    }

    case 'DELETE_STUDENT': {
      const name = state.students.find(s => String(s.id) === String(action.payload.id))?.name ?? '';
      return {
        ...state,
        students: state.students.filter(s => String(s.id) !== String(action.payload.id)),
        activityLog: [
          { id: genId('log'), type: 'student_deleted', description: 'Pelajar Dipadam', subDescription: name, timestamp: now },
          ...state.activityLog,
        ],
      };
    }

    case 'ADD_USER': {
      return {
        ...state,
        users: [...state.users, action.payload],
        activityLog: [
          { id: genId('log'), type: 'student_added' as any, description: 'Pengguna Baharu Mendaftar', subDescription: action.payload.name, timestamp: now },
          ...state.activityLog,
        ],
      };
    }
    case 'EDIT_USER': {
      return {
        ...state,
        users: state.users.map(u => String(u.id) === String(action.payload.id) ? { ...u, ...action.payload } : u),
      };
    }

    // ── Teachers ──
    case 'SET_TEACHERS': {
      return {
        ...state,
        teachers: action.payload,
      };
    }

    case 'ADD_TEACHER': {
      const teacher = action.payload;
      return {
        ...state,
        teachers: [...state.teachers, teacher],
        activityLog: [
          { id: genId('log'), type: 'teacher_added', description: 'Guru Ditambah', subDescription: teacher.name, timestamp: now },
          ...state.activityLog,
        ],
      };
    }

    case 'EDIT_TEACHER': {
      return {
        ...state,
        teachers: state.teachers.map(t => String(t.id) === String(action.payload.id) ? { ...t, ...action.payload } : t),
      };
    }

    case 'DELETE_TEACHER': {
      const teacherIdString = String(action.payload.id);
      const name = state.teachers.find(t => String(t.id) === teacherIdString)?.name ?? '';
      return {
        ...state,
        teachers: state.teachers.filter(t => String(t.id) !== teacherIdString),
        activityLog: [
          { id: genId('log'), type: 'teacher_deleted', description: 'Guru Dipadam', subDescription: name, timestamp: now },
          ...state.activityLog,
        ],
      };
    }

    // ── Classes ──
    case 'SET_CLASSES': {
      return { ...state, classes: action.payload };
    }

    case 'ADD_CLASS': {
      const cls = action.payload;
      return {
        ...state,
        classes: [...state.classes, cls],
        activityLog: [
          { id: genId('log'), type: 'report_submitted', description: 'Kelas Baharu Dicipta', subDescription: cls.name, timestamp: now },
          ...state.activityLog,
        ],
      };
    }

    // ── Hafazan ──
    case 'RECORD_HAFAZAN': {
      const record: HafazanRecord = { ...action.payload, id: genId('h') };
      const student = state.students.find(s => s.id === record.studentId);
      const gradeLabel = (g: Grade) => g === 'Mumtaz' ? 'Mumtaz (ممتاز)' : g === 'Jayyid' ? 'Jayyid (جيد)' : g === 'Maqbul' ? 'Maqbul (مقبول)' : g;
      const notif: Notification = {
        id: genId('n'), studentId: record.studentId, type: 'hafazan',
        title: 'Rekod Hafazan Dikemas Kini',
        message: `${student?.name ?? 'Pelajar'} telah melengkapkan Sabaq ${record.sabaq.surah} ${record.sabaq.from}–${record.sabaq.to} dengan gred ${gradeLabel(record.sabaq.grade)}.${record.remarks ? ' Catatan: ' + record.remarks : ''}`,
        timestamp: now, read: false,
      };
      return {
        ...state,
        hafazanRecords: [record, ...state.hafazanRecords],
        notifications: [notif, ...state.notifications],
        activityLog: [
          { id: genId('log'), type: 'hafazan_updated', description: 'Rekod Hafazan Dikemas Kini', subDescription: student?.name ?? '', timestamp: now },
          ...state.activityLog,
        ],
      };
    }

    // ── Attendance ──
    case 'MARK_ATTENDANCE': {
      const newIds = new Set(action.payload.map(r => `${r.studentId}_${r.date}`));
      const filtered = state.attendance.filter(r => !newIds.has(`${r.studentId}_${r.date}`));
      const records: AttendanceRecord[] = action.payload.map(r => ({ ...r, id: genId('att') }));
      const absentNotifs: Notification[] = records
        .filter(r => r.status === 'Tidak Hadir')
        .map(r => ({
          id: genId('n'), studentId: r.studentId, type: 'attendance',
          title: 'Amaran Ketidakhadiran',
          message: `Anak anda telah dicatat Tidak Hadir hari ini. ${r.remarks ? 'Sebab: ' + r.remarks : 'Sila hubungi sekolah jika ini adalah kesilapan.'}`,
          timestamp: now, read: false,
        }));
      const presentNotifs: Notification[] = records
        .filter(r => r.status === 'Hadir')
        .map(r => ({
          id: genId('n'), studentId: r.studentId, type: 'attendance',
          title: 'Kehadiran Dicatat',
          message: `${state.students.find(s => s.id === r.studentId)?.name ?? 'Pelajar'} telah dicatat Hadir untuk sesi hari ini.`,
          timestamp: now, read: false,
        }));
      return {
        ...state,
        attendance: [...filtered, ...records],
        notifications: [...absentNotifs, ...presentNotifs, ...state.notifications],
      };
    }

    // ── Payments ──
    case 'SET_PAYMENTS': {
      return { ...state, payments: action.payload };
    }
    case 'ADD_PAYMENT': {
      const payment: Payment = action.payload;
      return { ...state, payments: [...state.payments, payment] };
    }

    case 'TOGGLE_PAYMENT': {
      const paidDate = action.payload.status === 'Dibayar' ? now.split('T')[0] : undefined;
      const updated = state.payments.map(p =>
        p.id === action.payload.id ? { ...p, status: action.payload.status, paidDate } : p
      );
      const payment = state.payments.find(p => p.id === action.payload.id);
      const student = state.students.find(s => s.id === payment?.studentId);
      const newLog = action.payload.status === 'Dibayar'
        ? [{ id: genId('log'), type: 'payment_received' as const, description: 'Yuran Diterima', subDescription: student?.name ?? '', timestamp: now }, ...state.activityLog]
        : state.activityLog;
      const newNotifs = action.payload.status === 'Dibayar' && student
        ? [{ id: genId('n'), studentId: student.id, type: 'payment' as const, title: 'Yuran Diterima', message: `Yuran RM ${payment?.amount} bagi ${new Date().toLocaleString('ms-MY', { month: 'long', year: 'numeric' })} telah diterima. Terima kasih!`, timestamp: now, read: false }, ...state.notifications]
        : state.notifications;
      return { ...state, payments: updated, activityLog: newLog, notifications: newNotifs };
    }

    // ── Reports ──
    case 'SUBMIT_REPORT': {
      const report: Report = { ...action.payload, id: genId('r') };
      return {
        ...state,
        reports: [report, ...state.reports],
        activityLog: [
          { id: genId('log'), type: 'report_submitted', description: 'Laporan Diserahkan', subDescription: state.classes.find(c => c.id === report.classId)?.name ?? '', timestamp: now },
          ...state.activityLog,
        ],
      };
    }

    // ── Activity Log ──
    case 'LOG_ACTIVITY': {
      return {
        ...state,
        activityLog: [{ ...action.payload, id: genId('log'), timestamp: now }, ...state.activityLog],
      };
    }

    // ── Notifications ──
    case 'ADD_NOTIFICATION': {
      return {
        ...state,
        notifications: [{ ...action.payload, id: genId('n'), timestamp: now, read: false }, ...state.notifications],
      };
    }

    case 'MARK_NOTIFICATION_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n => n.id === action.payload.id ? { ...n, read: true } : n),
      };
    }

    case 'MARK_ALL_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n => n.studentId === action.payload.studentId ? { ...n, read: true } : n),
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const LS_KEY = 'tahfiz_app_state';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch { /* ignore */ }
  return buildInitialState();
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider');
  return ctx;
}

// ─── Selector helpers (pure functions, call inside components) ────────────────

export function getStudentAttendanceRate(state: AppState, studentId: string): number {
  const records = state.attendance.filter(a => a.studentId === studentId);
  if (!records.length) return 0;
  const present = records.filter(a => a.status === 'Hadir' || a.status === 'Lewat').length;
  return Math.round((present / records.length) * 100);
}

export function getStudentLastRecords(state: AppState, studentId: string, limit = 5): HafazanRecord[] {
  return state.hafazanRecords
    .filter(h => h.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function getStudentStreak(state: AppState, studentId: string): number {
  const dates = [...new Set(
    state.hafazanRecords
      .filter(h => h.studentId === studentId)
      .map(h => h.date)
  )].sort((a, b) => b.localeCompare(a));

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
    if (diff <= 1) { streak++; cursor = d; }
    else break;
  }
  return streak;
}

export function getStudentRank(juzuk: number): { name: string; icon: string; image: string; level: number; nextRank: string; progressToNext: number } {
  if (juzuk >= 30) return { name: 'Legend Al-Hafiz', icon: '🏆', image: '/images/logo/level_1_hafiz.jpeg', level: 3, nextRank: 'Completed!', progressToNext: 100 };
  if (juzuk >= 20) return { name: 'Master', icon: '💎', image: '/images/logo/master.jpeg', level: 2.5, nextRank: 'Legend Al-Hafiz', progressToNext: Math.round((juzuk / 30) * 100) };
  if (juzuk >= 10) return { name: 'Elite', icon: '🥈', image: '/images/logo/elite.jpeg', level: 2, nextRank: 'Master', progressToNext: Math.round((juzuk / 20) * 100) };
  if (juzuk >= 5)  return { name: 'Warrior', icon: '🛡️', image: '/images/logo/warrior.jpeg', level: 1, nextRank: 'Elite', progressToNext: Math.round((juzuk / 10) * 100) };
  if (juzuk >= 1)  return { name: 'Beginner', icon: '📖', image: '/images/logo/level_1.jpeg', level: 0.5, nextRank: 'Warrior', progressToNext: Math.round((juzuk / 5) * 100) };
  return { name: 'Peringkat Asas', icon: '🌱', image: '/images/logo/level_1.jpeg', level: 0, nextRank: 'Beginner', progressToNext: 0 };
}

export function computeAIPrediction(state: AppState, studentId: string) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return null;

  // --- 1. Hafazan Progress & Performance ---
  const records = state.hafazanRecords.filter(h => h.studentId === studentId);
  let totalSabaqAyah = 0;
  let gradeScoreTotal = 0;
  let gradeCount = 0;

  records.forEach(r => {
    // Sabaq (new verses rate)
    totalSabaqAyah += Math.max(0, (r.sabaq.to || 0) - (r.sabaq.from || 0));
    
    // Performance Grades affecting quality of memorization
    const gradeVal = (g?: Grade) => g === 'Mumtaz' ? 1.15 : g === 'Jayyid' ? 1.0 : g === 'Maqbul' ? 0.8 : g === 'Perlu Penambahbaikan' ? 0.5 : null;
    
    [r.sabaq.grade, r.sabaqi.grade, r.manzil.grade].forEach(g => {
      const val = gradeVal(g);
      if (val !== null) { gradeScoreTotal += val; gradeCount++; }
    });
  });

  const avgSabaqPerDay = records.length ? totalSabaqAyah / records.length : 5;
  const qualityMultiplier = gradeCount > 0 ? gradeScoreTotal / gradeCount : 1.0; // Defaults to 1.0 if no grades

  // --- 2. Attendance Patterns ---
  const attendanceRate = getStudentAttendanceRate(state, studentId) / 100;

  // --- 3. Payment Consistency ---
  const payments = state.payments.filter(p => p.studentId === studentId);
  const paymentScore = payments.length
    ? payments.filter(p => p.status === 'Dibayar').length / payments.length
    : 0.8;

  // --- AI Engine Processing ---
  // Core speed adjusted by memorization quality, attendance consistency, and financial stability trends
  const effectiveRate = avgSabaqPerDay * qualityMultiplier * (0.6 + (attendanceRate * 0.3) + (paymentScore * 0.1));
  
  // Remaining work: 30 juzuk ≈ 6236 ayat; each juzuk ≈ 208 ayat
  const remainingJuzuk = 30 - student.juzukCompleted;
  const remainingAyat = remainingJuzuk * 208;
  const validEffectiveRate = Math.max(effectiveRate, 0.5); // Fallback for extremely slow/zero progress
  const daysLeft = Math.ceil(remainingAyat / validEffectiveRate);

  // Output 1: Estimated Completion Date
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysLeft);

  // Output 2: Confidence Level (based on data volume, attendance stability, and grade consistency)
  const dataVolumeScore = Math.min(1, records.length / 30); // Maxes out after 30 records
  const confidence = Math.min(99, Math.round(
    60 + (dataVolumeScore * 15) + (attendanceRate * 15) + (paymentScore * 5) + ((qualityMultiplier - 1) * 10)
  ));

  // Determine trend for UI styling
  const trend = (attendanceRate >= 0.9 && qualityMultiplier >= 1.0) ? 'Cemerlang' :
                (attendanceRate >= 0.75 && qualityMultiplier >= 0.8) ? 'Baik' : 'Perlu Perhatian';

  // Output 3: AI Recommendations (Personalized actionable feedback)
  const recommendation =
    qualityMultiplier < 0.85 ? 'Tumpukan kepada ulang kaji Sabaqi/Manzil untuk meningkatkan kualiti ingatan.' :
    attendanceRate < 0.85 ? 'Kehadiran yang lebih konsisten diperlukan untuk ramalan yang stabil.' :
    paymentScore < 1.0 ? 'Yuran yang belum dijelaskan mungkin mempengaruhi trend kestabilan.' :
    'Progres konsisten dikekalkan. Dijangka tamat lebih awal.';

  // Avg total ayah (including revisions) for display purposes
  const avgTotalAyahPerDay = records.length
    ? records.reduce((sum, r) => sum + (r.ayahCount || 0), 0) / records.length
    : avgSabaqPerDay;

  return {
    studentName: student.name,
    currentProgress: `${student.juzukCompleted} Juzuk (${Math.round((student.juzukCompleted / 30) * 100)}%)`,
    estimatedCompletion: completionDate.toISOString().split('T')[0],
    performanceTrend: trend,
    confidence: `${confidence}%`,
    recommendation,
    attendanceRate: `${Math.round(attendanceRate * 100)}%`,
    avgAyahPerDay: Math.round(avgTotalAyahPerDay),
  };
}

export function getMonthlyRevenue(state: AppState): number {
  const now = new Date();
  return state.payments
    .filter(p => p.month === now.getMonth() + 1 && p.year === now.getFullYear() && p.status === 'Dibayar')
    .reduce((sum, p) => sum + p.amount, 0);
}

export function getTotalRevenue(state: AppState): number {
  return state.payments.filter(p => p.status === 'Dibayar').reduce((sum, p) => sum + p.amount, 0);
}

export function getPendingRevenue(state: AppState): number {
  return state.payments.filter(p => p.status !== 'Dibayar').reduce((sum, p) => sum + p.amount, 0);
}

export function getClassLeaderboard(state: AppState, classId: string) {
  const cls = state.classes.find(c => c.id === classId);
  if (!cls) return [];
  return cls.studentIds
    .map(sid => state.students.find(s => s.id === sid))
    .filter(Boolean)
    .sort((a, b) => (b!.juzukCompleted - a!.juzukCompleted))
    .map((s, i) => ({
      rank: i + 1,
      name: s!.name,
      progress: `${s!.juzukCompleted} Juzuk`,
      badge: i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '',
      id: s!.id,
    }));
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru sahaja';
  if (mins < 60) return `${mins} minit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}
