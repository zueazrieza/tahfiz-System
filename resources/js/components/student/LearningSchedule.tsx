import { Calendar, Clock, BookOpen } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function LearningSchedule() {
  const { state } = useAppStore();
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const studentUser = state.users.find(u => u.name === authUser.name && u.role === 'student') ?? state.users.find(u => u.role === 'student')!;
  const student = state.students.find(s => s.id === studentUser?.linkedId || s.id === (authUser as any).linked_id) ?? state.students[0];
  const classRoom = state.classes.find(c => c.id === student?.classId || c.id === (student as any)?.class_id);
  const teacher = state.teachers.find(t => t.id === classRoom?.teacherId || t.id === (classRoom as any)?.teacher_id);

  const todayName = DAYS[new Date().getDay()];
  const todaySessions = (classRoom?.schedule ?? []).filter(s => s.day === todayName);
  const allSessions = classRoom?.schedule ?? [];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-semibold text-gray-900">Jadual Pelajaran</h2><p className="text-gray-600 mt-1">Pelan hafazan harian dan mingguan anda</p></div>

      {/* Class card */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center"><BookOpen className="text-white" size={26} /></div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Kelas {classRoom?.name ?? '—'}</h3>
            <p className="text-sm text-gray-600">Murabbi/Murabbiah: <strong>{teacher?.name ?? '—'}</strong></p>
            <p className="text-sm text-gray-600">Kapasiti: {classRoom?.studentIds?.length ?? 0} / {classRoom?.capacity ?? 0} pelajar</p>
          </div>
        </div>
      </div>

      {/* Today */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hari Ini — {todayName}</h3>
        {todaySessions.length === 0 ? (
          <p className="text-gray-400 text-sm">Tiada sesi dijadualkan hari ini. Berehat sejenak! 🌿</p>
        ) : (
          <div className="space-y-3">
            {todaySessions.map((session, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0"><Clock className="text-white" size={18} /></div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{session.time}</p>
                  <p className="text-green-700 font-medium text-sm">{session.topic}</p>
                  <p className="text-xs text-gray-500">Class {classRoom?.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full week schedule */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Jadual Mingguan</h3>
        <div className="space-y-4">
          {allSessions.map((session, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex items-center gap-2"><Calendar className="text-green-600" size={18} /><span className="font-semibold text-gray-900 text-sm w-24">{session.day}</span></div>
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{session.time}</p>
                <p className="text-sm text-gray-700 mt-0.5">{session.topic}</p>
              </div>
            </div>
          ))}
          {allSessions.length === 0 && <p className="text-gray-400 text-sm">Tiada jadual ditetapkan lagi.</p>}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">📚 Tips Pembelajaran</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Tiba 5 minit awal sebelum sesi bermula</li>
          <li>• Bawa Mushaf dan buku nota anda</li>
          <li>• Ulang kaji pelajaran semalam sebelum hafazan baharu</li>
          <li>• Tanya murabbi/murabbiah jika ada kemusykilan</li>
        </ul>
      </div>
    </div>
  );
}
