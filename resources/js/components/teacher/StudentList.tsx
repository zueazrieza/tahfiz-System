import { useAppStore, getStudentAttendanceRate, getStudentLastRecords } from '../../store/AppContext';
import { Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pagination } from '../shared/Pagination';
import { SkeletonCard } from '../shared/Skeleton';

export function StudentList() {
  const { state } = useAppStore();
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const teacherId = authUser.linked_id;

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentRecords, setStudentRecords] = useState<Record<string, any>>({});
  const [studentsPage, setStudentsPage] = useState(1);
  const STUDENTS_PER_PAGE = 10;

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      const resp = await axios.get('/api/classes');
      const data = resp.data;
      // Filter classes for this teacher
      const teacherClasses = data.filter((c: any) => String(c.teacherId) === String(teacherId));
      setClasses(teacherClasses);
      if (teacherClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(teacherClasses[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`/api/students`, { params: { classId: selectedClassId } });
      const data = resp.data;
      setStudents(data);

      // Fetch last records for each student
      data.forEach((student: any) => fetchLastRecord(student.id));
    } catch (err) {
      console.error('Failed to fetch students', err);
      // Fallback to state if API fails
      setStudents(state.students.filter(s => String(s.classId) === String(selectedClassId)));
    } finally {
      setLoading(false);
    }
  };

  const fetchLastRecord = async (studentId: string) => {
    try {
      const resp = await axios.get(`/api/hafazan-records`, { params: { student_id: studentId, limit: 1 } });
      const data = resp.data;
      if (data.length > 0) {
        setStudentRecords(prev => ({ ...prev, [studentId]: data[0] }));
      }
    } catch (err) {
      console.error('Failed to fetch record', err);
    }
  };

  const attendanceRate = (sid: string) => getStudentAttendanceRate(state, sid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Senarai Pelajar</h2>
          <p className="text-gray-600 mt-1">Lihat semua pelajar dalam kelas anda</p>
        </div>
        <select
          value={selectedClassId}
          onChange={e => { setSelectedClassId(e.target.value); setStudentsPage(1); }}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true" aria-label="Memuatkan senarai pelajar...">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {students.slice((studentsPage - 1) * STUDENTS_PER_PAGE, studentsPage * STUDENTS_PER_PAGE).map(student => {
            const lastRec = studentRecords[student.id];
            const attRate = attendanceRate(student.id);
            return (
              <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">Umur {student.age} · Sejak {student.enrolledDate}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${student.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {student.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kemajuan Hafazan:</span>
                    <span className="font-semibold text-green-600">{student.juzukCompleted ?? 0} / 30 Juzuk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kadar Kehadiran:</span>
                    <span className="font-semibold text-gray-900">{attRate}%</span>
                  </div>
                  {lastRec && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sabak Terakhir:</span>
                      <span className="text-gray-900">{lastRec.sabaq.surah} · {lastRec.sabaq.grade}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(((student.juzukCompleted ?? 0) / 30) * 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Eye className="w-4 h-4" /> Lihat Profil
                </button>
              </div>
            );
          })}
          {students.length === 0 && <div className="col-span-2 p-10 text-center text-gray-400">Tiada pelajar dalam kelas ini.</div>}
        </div>
        <Pagination currentPage={studentsPage} totalPages={Math.ceil(students.length / STUDENTS_PER_PAGE)} onPageChange={setStudentsPage} totalItems={students.length} itemsPerPage={STUDENTS_PER_PAGE} />
        </>
      )}

      {/* View student modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Profil Pelajar</h3><button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">✕</button></div>
            <div className="space-y-3">
              {[
                ['Nama', selectedStudent.name],
                ['Umur', selectedStudent.age],
                ['Kelas', state.classes.find(c => c.id === selectedStudent.classId)?.name],
                ['Juzuk Dihafal', `${selectedStudent.juzukCompleted} / 30`],
                ['Kehadiran', `${getStudentAttendanceRate(state, selectedStudent.id)}%`],
                ['Status', selectedStudent.status],
                ['Tarikh Daftar', selectedStudent.enrolledDate],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500 text-sm">{k}</span>
                  <span className="font-medium text-gray-900 text-sm">{String(v)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedStudent(null)} className="w-full mt-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
