// ─── Types ───────────────────────────────────────────────────────────────────

export type Grade = 'Mumtaz' | 'Jayyid' | 'Maqbul' | 'Perlu Penambahbaikan' | '';
export type AttendanceStatus = 'Hadir' | 'Tidak Hadir' | 'Lewat';
export type PaymentStatus = 'Dibayar' | 'Belum Bayar' | 'Tertunggak';
export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // plain mock
  role: UserRole;
  linkedId?: string; // studentId for parent/student, teacherId for teacher
  wage?: number; // for parents
  phone?: string;
  address?: string;
  
  // Detailed Parent Profile
  relation?: string;
  postcode?: string;
  city?: string;
  district?: string;
  stateName?: string;
  country?: string;
  parliament?: string;
  job?: string;
  sector?: string;
  officePhone?: string;
  childCount?: number;
  reference?: string;
  status: 'active' | 'pending';
}

export interface Student {
  id: string;
  name: string;
  age: number;
  classId: string;
  teacherId: string;
  parentId: string; // userId of parent
  juzukCompleted: number;
  status: 'Aktif' | 'Tidak Aktif' | 'PROSPECT' | 'SCHEDULED' | 'INTERVIEW' | 'ACCEPTED' | 'OFFERED' | 'WAITING_PAYMENT' | 'ENROLLED' | string;
  enrolledDate: string;
  phone?: string; 
  
  // New profile fields
  icNo?: string;
  matricNo?: string;
  matric_no?: string; // fallback
  intake?: string;
  intakeJuzuk?: number;
  gender?: 'F' | 'M';
  maritalStatus?: string;
  bloodType?: string;
  dob?: string;
  pob?: string;
  citizenship?: string;
  race?: string;
  religion?: string;
  educationBackground?: string; // UPSR, SPM, etc.
  intakeDate?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  familyIncome?: string;
  admissionType?: 'tetap' | 'interview';
  ranking?: number;
  teacherName?: string;
  className?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  classIds: string[];
  specialization: string;
  status: 'Aktif' | 'Tidak Aktif';
  joinedDate: string;
  gender?: 'M' | 'F' | string;
  userId?: string;
  
  // New profile fields
  icNo?: string;
  qualification?: string;
  experience?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dependentsCount?: number;
  residence?: string;
  serviceStartDate?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  teacherId: string;
  capacity: number;
  studentIds: string[];
  schedule: { day: string; time: string; topic: string }[];
}

export interface HafazanRecord {
  id: string;
  studentId: string;
  teacherId: string;
  date: string; // ISO date
  sabaq: { surah: string; from: number; to: number; grade: Grade };
  sabaqi: { surah: string; from: number; to: number; grade: Grade };
  manzil: { surah: string; from: number; to: number; grade: Grade };
  remarks: string;
  ayahCount: number; // total ayah recorded this session
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // ISO date
  status: AttendanceStatus;
  remarks: string;
}

export interface Payment {
  id: string;
  studentId: string;
  month: number; // 1-12
  year: number;
  amount: number; // RM
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
}

export interface Report {
  id: string;
  teacherId: string;
  classId: string;
  date: string;
  content: string;
  fileName?: string;
}

export interface ActivityLog {
  id: string;
  type: 'student_added' | 'student_deleted' | 'student_edited' | 'teacher_added' | 'teacher_deleted' | 'payment_received' | 'hafazan_updated' | 'report_submitted';
  description: string;
  subDescription?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  studentId: string;
  type: 'hafazan' | 'attendance' | 'payment' | 'achievement' | 'announcement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const SEED_USERS: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@akmal.edu.my', password: 'admin123', role: 'admin', status: 'active' },
  { id: 'u2', name: 'Murabbi Abdullah', email: 'abdullah@akmal.edu.my', password: 'teacher123', role: 'teacher', linkedId: 't1', status: 'active' },
  { id: 'u3', name: 'Murabbiah Sarah', email: 'sarah@akmal.edu.my', password: 'teacher123', role: 'teacher', linkedId: 't2', status: 'active' },
  { id: 'u4', name: 'Hassan bin Ahmad', email: 'hassan@gmail.com', password: 'parent123', role: 'parent', linkedId: 's1', status: 'active' },
  { id: 'u5', name: 'Ali bin Omar', email: 'ali@gmail.com', password: 'parent123', role: 'parent', linkedId: 's2', status: 'active' },
  { id: 'u6', name: 'Ahmad bin Hassan', email: 'ahmad@student.akmal.edu.my', password: 'student123', role: 'student', linkedId: 's1', status: 'active' },
  { id: 'u7', name: 'Fatimah binti Ali', email: 'fatimah@student.akmal.edu.my', password: 'student123', role: 'student', linkedId: 's2', status: 'active' },
  { id: 'u8', name: 'Zul bin Akmal (New)', email: 'zul@gmail.com', password: 'password123', role: 'parent', status: 'pending' },
];

export const SEED_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Murabbi Abdullah', email: 'abdullah@akmal.edu.my', phone: '+60 12-111 2222', classIds: ['c1', 'c3'], specialization: 'Hafazan & Tajwid', status: 'Aktif', joinedDate: '2023-01-10' },
  { id: 't2', name: 'Murabbiah Sarah', email: 'sarah@akmal.edu.my', phone: '+60 13-333 4444', classIds: ['c2'], specialization: 'Hafazan', status: 'Aktif', joinedDate: '2023-06-01' },
  { id: 't3', name: 'Murabbi Yusuf', email: 'yusuf@akmal.edu.my', phone: '+60 14-555 6666', classIds: ['c4'], specialization: 'Qiraat', status: 'Aktif', joinedDate: '2024-01-15' },
];

export const SEED_CLASSES: ClassRoom[] = [
  {
    id: 'c1', name: 'Al-Falah', teacherId: 't1', capacity: 30,
    studentIds: ['s1', 's3', 's5', 's7'],
    schedule: [
      { day: 'Monday', time: '8:00 PG – 10:00 PG', topic: 'Surah Al-Baqarah' },
      { day: 'Wednesday', time: '10:30 PG – 12:30 TG', topic: 'Sesi Ulang Kaji (Sabki)' },
      { day: 'Friday', time: '2:00 PTG – 4:00 PTG', topic: 'Semakan Manzil' },
    ],
  },
  {
    id: 'c2', name: 'Al-Iman', teacherId: 't2', capacity: 25,
    studentIds: ['s2', 's4', 's6'],
    schedule: [
      { day: 'Tuesday', time: '8:00 PG – 10:00 PG', topic: 'Surah Ali Imran' },
      { day: 'Thursday', time: '10:30 PG – 12:30 TG', topic: 'Ulang Kaji Sabki' },
    ],
  },
  {
    id: 'c3', name: 'Al-Firdaus', teacherId: 't1', capacity: 20,
    studentIds: ['s8', 's9'],
    schedule: [
      { day: 'Monday', time: '10:30 PG – 12:30 TG', topic: 'Surah An-Nisa' },
      { day: 'Thursday', time: '2:00 PTG – 4:00 PTG', topic: 'Ulang Kaji Manzil' },
    ],
  },
  {
    id: 'c4', name: 'Al-Najah', teacherId: 't3', capacity: 20,
    studentIds: [],
    schedule: [
      { day: 'Wednesday', time: '8:00 PG – 10:00 PG', topic: 'Asas Qiraat' },
    ],
  },
];

export const SEED_STUDENTS: Student[] = [
  { id: 's1', name: 'Ahmad bin Hassan', age: 12, classId: 'c1', teacherId: 't1', parentId: 'u4', juzukCompleted: 5, status: 'Aktif', enrolledDate: '2024-01-10', admissionType: 'tetap', ranking: 1 },
  { id: 's2', name: 'Fatimah binti Ali', age: 11, classId: 'c2', teacherId: 't2', parentId: 'u5', juzukCompleted: 3, status: 'Aktif', enrolledDate: '2024-02-05', admissionType: 'tetap', ranking: 3 },
  { id: 's3', name: 'Muhammad bin Ibrahim', age: 13, classId: 'c1', teacherId: 't1', parentId: 'u4', juzukCompleted: 8, status: 'Aktif', enrolledDate: '2023-09-01', admissionType: 'tetap', ranking: 2 },
  { id: 's4', name: 'Aisha binti Hassan', age: 12, classId: 'c2', teacherId: 't2', parentId: 'u5', juzukCompleted: 4, status: 'Aktif', enrolledDate: '2024-01-20', admissionType: 'interview' },
  { id: 's5', name: 'Yusuf bin Omar', age: 14, classId: 'c1', teacherId: 't1', parentId: 'u4', juzukCompleted: 10, status: 'Aktif', enrolledDate: '2023-07-15', admissionType: 'tetap', ranking: 4 },
  { id: 's6', name: 'Maryam binti Idris', age: 10, classId: 'c2', teacherId: 't2', parentId: 'u5', juzukCompleted: 2, status: 'Aktif', enrolledDate: '2025-01-05', admissionType: 'interview' },
  { id: 's7', name: 'Ibrahim bin Khalil', age: 13, classId: 'c1', teacherId: 't1', parentId: 'u4', juzukCompleted: 6, status: 'Aktif', enrolledDate: '2023-11-10', admissionType: 'tetap', ranking: 5 },
  { id: 's8', name: 'Zainab binti Yusuf', age: 11, classId: 'c3', teacherId: 't1', parentId: 'u5', juzukCompleted: 7, status: 'Aktif', enrolledDate: '2024-03-01', admissionType: 'tetap', ranking: 6 },
  { id: 's9', name: 'Umar bin Rashid', age: 12, classId: 'c3', teacherId: 't1', parentId: 'u4', juzukCompleted: 1, status: 'Aktif', enrolledDate: '2025-02-01', admissionType: 'interview' },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

export const SEED_HAFAZAN_RECORDS: HafazanRecord[] = [
  { id: 'h1', studentId: 's1', teacherId: 't1', date: daysAgo(0), sabaq: { surah: 'Al-Baqarah', from: 50, to: 60, grade: 'Mumtaz' }, sabaqi: { surah: 'Al-Baqarah', from: 30, to: 50, grade: 'Jayyid' }, manzil: { surah: 'Al-Fatihah', from: 1, to: 7, grade: 'Mumtaz' }, remarks: 'Progres yang baik hari ini!', ayahCount: 17 },
  { id: 'h2', studentId: 's1', teacherId: 't1', date: daysAgo(1), sabaq: { surah: 'Al-Baqarah', from: 40, to: 50, grade: 'Jayyid' }, sabaqi: { surah: 'Al-Baqarah', from: 20, to: 40, grade: 'Mumtaz' }, manzil: { surah: 'Al-Fatihah', from: 1, to: 7, grade: 'Mumtaz' }, remarks: '', ayahCount: 17 },
  { id: 'h3', studentId: 's1', teacherId: 't1', date: daysAgo(2), sabaq: { surah: 'Al-Baqarah', from: 30, to: 40, grade: 'Jayyid' }, sabaqi: { surah: 'Al-Baqarah', from: 10, to: 30, grade: 'Jayyid' }, manzil: { surah: 'Al-Ikhlas', from: 1, to: 4, grade: 'Mumtaz' }, remarks: '', ayahCount: 14 },
  { id: 'h4', studentId: 's1', teacherId: 't1', date: daysAgo(4), sabaq: { surah: 'Al-Baqarah', from: 20, to: 30, grade: 'Maqbul' }, sabaqi: { surah: 'Al-Baqarah', from: 1, to: 20, grade: 'Jayyid' }, manzil: { surah: 'Al-Ikhlas', from: 1, to: 4, grade: 'Jayyid' }, remarks: 'Perlu ulang kaji lebih banyak', ayahCount: 14 },
  { id: 'h5', studentId: 's2', teacherId: 't2', date: daysAgo(0), sabaq: { surah: 'Ali Imran', from: 1, to: 10, grade: 'Jayyid' }, sabaqi: { surah: 'Al-Baqarah', from: 280, to: 286, grade: 'Mumtaz' }, manzil: { surah: 'An-Nas', from: 1, to: 6, grade: 'Mumtaz' }, remarks: 'Peningkatan yang konsisten', ayahCount: 13 },
  { id: 'h6', studentId: 's3', teacherId: 't1', date: daysAgo(0), sabaq: { surah: 'Al-Baqarah', from: 200, to: 210, grade: 'Mumtaz' }, sabaqi: { surah: 'Al-Baqarah', from: 180, to: 200, grade: 'Mumtaz' }, manzil: { surah: 'Yasin', from: 1, to: 20, grade: 'Mumtaz' }, remarks: 'Luar biasa!', ayahCount: 30 },
];

export const SEED_ATTENDANCE: AttendanceRecord[] = [
  ...['s1','s2','s3','s4','s5','s6','s7'].map((sid, i) => ({ id: `a_today_${sid}`, studentId: sid, classId: sid <= 's4' ? (sid <= 's2' ? 'c2' : 'c1') : 'c1', date: fmt(today), status: (i === 5 ? 'Tidak Hadir' : 'Hadir') as AttendanceStatus, remarks: i === 5 ? 'Temu janji perubatan' : '' })),
  ...['s1','s2','s3','s4','s5','s7'].map((sid) => ({ id: `a_1_${sid}`, studentId: sid, classId: 'c1', date: daysAgo(1), status: 'Hadir' as AttendanceStatus, remarks: '' })),
  ...['s1','s2','s3','s5','s7'].map((sid) => ({ id: `a_2_${sid}`, studentId: sid, classId: 'c1', date: daysAgo(2), status: 'Hadir' as AttendanceStatus, remarks: '' })),
  { id: 'a_2_s4', studentId: 's4', classId: 'c2', date: daysAgo(2), status: 'Lewat', remarks: 'Bas lambat' },
];

export const SEED_PAYMENTS: Payment[] = [
  { id: 'p1', studentId: 's1', month: 3, year: 2026, amount: 200, status: 'Dibayar', dueDate: '2026-03-05', paidDate: '2026-03-02' },
  { id: 'p2', studentId: 's1', month: 2, year: 2026, amount: 200, status: 'Dibayar', dueDate: '2026-02-05', paidDate: '2026-02-03' },
  { id: 'p3', studentId: 's1', month: 1, year: 2026, amount: 200, status: 'Dibayar', dueDate: '2026-01-05', paidDate: '2026-01-04' },
  { id: 'p4', studentId: 's2', month: 3, year: 2026, amount: 200, status: 'Belum Bayar', dueDate: '2026-03-05' },
  { id: 'p5', studentId: 's2', month: 2, year: 2026, amount: 200, status: 'Dibayar', dueDate: '2026-02-05', paidDate: '2026-02-10' },
  { id: 'p6', studentId: 's3', month: 3, year: 2026, amount: 200, status: 'Dibayar', dueDate: '2026-03-05', paidDate: '2026-03-01' },
  { id: 'p7', studentId: 's4', month: 3, year: 2026, amount: 200, status: 'Tertunggak', dueDate: '2026-02-05' },
  { id: 'p8', studentId: 's5', month: 3, year: 2026, amount: 200, status: 'Dibayar', dueDate: '2026-03-05', paidDate: '2026-03-03' },
  { id: 'p9', studentId: 's6', month: 3, year: 2026, amount: 200, status: 'Belum Bayar', dueDate: '2026-03-05' },
];

export const SEED_REPORTS: Report[] = [
  { id: 'r1', teacherId: 't1', classId: 'c1', date: daysAgo(0), content: 'Kelas Al-Falah telah menyelesaikan Surah Al-Baqarah muka surat 1-3. Semua pelajar hadir. Ahmad menunjukkan peningkatan yang cemerlang.', fileName: undefined },
  { id: 'r2', teacherId: 't1', classId: 'c1', date: daysAgo(2), content: 'Sesi ulang kaji dijalankan. Tumpuan diberikan kepada Sabaqi untuk semua pelajar. Muhammad menghafal 10 ayat baharu hari ini.', fileName: 'laporan_kelas_alfalah.pdf' },
  { id: 'r3', teacherId: 't2', classId: 'c2', date: daysAgo(1), content: 'Kelas Al-Iman menjalani sesi yang produktif. Fatimah dan Aisha menunjukkan prestasi cemerlang dalam ulang kaji Manzil.' },
];

export const SEED_ACTIVITY_LOG: ActivityLog[] = [
  { id: 'log1', type: 'student_added', description: 'Pelajar Baharu Didaftarkan', subDescription: 'Ahmad bin Ali', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'log2', type: 'payment_received', description: 'Yuran Diterima', subDescription: 'Keluarga Hassan', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 'log3', type: 'hafazan_updated', description: 'Rekod Hafazan Dikemas Kini', subDescription: 'Kelas Al-Falah', timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString() },
  { id: 'log4', type: 'teacher_added', description: 'Guru Ditambah', subDescription: 'Murabbiah Fatimah', timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString() },
];

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', studentId: 's1', type: 'hafazan', title: 'Rekod Hafazan Dikemas Kini', message: 'Ahmad telah melengkapkan Sabaq Al-Baqarah 50-60 dengan gred Mumtaz. Catatan Murabbi: Progres yang baik hari ini!', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), read: false },
  { id: 'n2', studentId: 's1', type: 'attendance', title: 'Kehadiran Dicatat', message: 'Ahmad telah dicatat Hadir untuk sesi hari ini.', timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(), read: false },
  { id: 'n3', studentId: 's1', type: 'achievement', title: '🏆 Pencapaian Dibuka!', message: 'Ahmad telah mendapat lencana "Kehadiran Sempurna" selama 30 hari berturut-turut!', timestamp: new Date(Date.now() - 24 * 60 * 60000).toISOString(), read: true },
  { id: 'n4', studentId: 's1', type: 'payment', title: 'Peringatan Yuran', message: 'Yuran Mac 2026 (RM 200) telah diterima. Terima kasih!', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(), read: true },
  { id: 'n5', studentId: 's2', type: 'hafazan', title: 'Rekod Hafazan Dikemas Kini', message: 'Fatimah telah melengkapkan Sabaq Ali Imran 1-10 dengan gred Jayyid.', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), read: false },
  { id: 'n6', studentId: 's2', type: 'payment', title: 'Yuran Perlu Dibayar', message: 'Yuran Mac 2026 sebanyak RM 200 perlu dibayar. Sila bayar sebelum 5 Mac 2026.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(), read: false },
];

// ─── Helper: generate unique ID ───────────────────────────────────────────────
export function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Initial state builder ────────────────────────────────────────────────────
export function buildInitialState() {
  return {
    users: SEED_USERS,
    students: SEED_STUDENTS,
    teachers: SEED_TEACHERS,
    classes: SEED_CLASSES,
    hafazanRecords: SEED_HAFAZAN_RECORDS,
    attendance: SEED_ATTENDANCE,
    payments: SEED_PAYMENTS,
    reports: SEED_REPORTS,
    activityLog: SEED_ACTIVITY_LOG,
    notifications: SEED_NOTIFICATIONS,
  };
}

export type AppState = ReturnType<typeof buildInitialState>;
