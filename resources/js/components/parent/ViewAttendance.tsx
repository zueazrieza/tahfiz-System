import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppStore, getStudentAttendanceRate } from '../../store/AppContext';
import { AttendanceRecord } from '../../store/mockData';
import { SkeletonStatCards, SkeletonTable } from '../shared/Skeleton';

interface ViewAttendanceProps {
  childId: string;
  childData?: { name?: string };
}

export function ViewAttendance({ childId, childData }: ViewAttendanceProps) {
  const { state } = useAppStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const storeChild = state.students.find(s => String(s.id) === String(childId));
  const child = childData?.name ? childData : storeChild;
  const total = records.length;
  const present = records.filter(r => r.status === 'Hadir' || r.status === 'Lewat').length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const resp = await axios.get(`/api/attendance?student_id=${childId}`);
        setRecords(resp.data);
      } catch (err) {
        console.error('Failed to fetch attendance', err);
      } finally {
        setLoading(false);
      }
    };
    if (childId) fetchAttendance();
  }, [childId]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Hadir: 'bg-green-100 text-green-700', 'Tidak Hadir': 'bg-red-100 text-red-700', Lewat: 'bg-orange-100 text-orange-700' };
    return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${map[s] ?? ''}`}>{s}</span>;
  };

  const presentCount = records.filter(r => r.status === 'Hadir').length;
  const absentCount = records.filter(r => r.status === 'Tidak Hadir').length;
  const lateCount = records.filter(r => r.status === 'Lewat').length;

  if (loading) return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuatkan kehadiran...">
      <div className="h-7 bg-slate-200 rounded-lg w-48 animate-pulse" />
      <SkeletonStatCards count={4} />
      <SkeletonTable rows={6} cols={3} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-semibold text-gray-900">Sejarah Kehadiran</h2><p className="text-gray-600 mt-1">Rekod kehadiran untuk {child?.name}</p></div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Kadar Kehadiran', value: `${rate}%`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Hadir', value: presentCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Tidak Hadir', value: absentCount, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Lewat', value: lateCount, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rate bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">Kadar Kehadiran</span><span className="font-bold text-green-700">{rate}%</span></div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${rate}%` }} />
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b"><h3 className="font-semibold text-gray-900">Butiran Kehadiran</h3></div>
        {records.length === 0 && <p className="px-6 py-10 text-center text-gray-400 text-sm">Tiada rekod lagi.</p>}
        <div className="divide-y divide-gray-100">
          {[...records].sort((a,b) => b.date.localeCompare(a.date)).map(rec => (
            <div key={rec.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900 text-sm">{new Date(rec.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {rec.remarks && <p className="text-xs text-gray-500 mt-0.5">📝 {rec.remarks}</p>}
              </div>
              {statusBadge(rec.status)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
