import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../../store/AppContext';
import { AttendanceStatus } from '../../store/mockData';
import { CheckCircle2, XCircle, Clock, Camera } from 'lucide-react';
import { ConfirmModal } from '../shared/ConfirmModal';

export function ManageAttendance() {
  const { state, dispatch } = useAppStore();
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const teacher = state.teachers.find(t => 
    t.email === authUser.email || 
    (authUser.name && t.name.toLowerCase().includes(authUser.name.toLowerCase().split(' ').slice(-1)[0]))
  ) ?? state.teachers[0];
  const teacherClasses = state.classes.filter(c => teacher?.classIds.some(cid => String(cid) === String(c.id)));
  const [selectedClassId, setSelectedClassId] = useState(teacherClasses[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; remarks: string; reasonType: string }>>({});
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [classImage, setClassImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const studentsInClass = state.students.filter(s => String(s.classId) === String(selectedClassId));

  useEffect(() => {
    if (selectedClassId && date) {
      fetchAttendance();
    }
  }, [selectedClassId, date]);

  const fetchAttendance = async () => {
    try {
      if (viewMode === 'daily') {
        const resp = await axios.get(`/api/attendance`, { params: { class_id: selectedClassId, date: date } });
        const data = resp.data;
        const map: Record<string, { status: AttendanceStatus; remarks: string }> = {};
        const presetValues = ['Sakit','Kecemasan','Ponteng','Cuti Rasmi','Urusan Keluarga','Urusan Perubatan'];
        data.forEach((row: any) => {
          const remarks = row.remarks || '';
          const reasonType = presetValues.includes(remarks) ? remarks : (remarks ? 'Lain-lain' : '');
          map[row.student_id] = { status: row.status, remarks, reasonType };
        });
        setAttendanceMap(map);
      } else {
        const resp = await axios.get(`/api/attendance`, { 
            params: { class_id: selectedClassId, month: selectedMonth, year: selectedYear } 
        });
        setMonthlyData(resp.data);
      }
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  };

  useEffect(() => {
    if (selectedClassId && viewMode === 'monthly') {
      fetchAttendance();
    }
  }, [selectedClassId, viewMode, selectedMonth, selectedYear]);

  const ABSENCE_REASONS = [
    { value: 'Sakit',            label: '🤒 Sakit' },
    { value: 'Kecemasan',        label: '🚨 Kecemasan' },
    { value: 'Ponteng',          label: '🚫 Ponteng' },
    { value: 'Cuti Rasmi',       label: '📅 Cuti Rasmi' },
    { value: 'Urusan Keluarga',  label: '🏠 Urusan Keluarga' },
    { value: 'Urusan Perubatan', label: '🏥 Urusan Perubatan' },
    { value: 'Lain-lain',        label: '📝 Lain-lain' },
  ];

  const toggle = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        status,
        remarks: status === 'Tidak Hadir' ? (prev[studentId]?.remarks || '') : '',
        reasonType: status === 'Tidak Hadir' ? (prev[studentId]?.reasonType || '') : '',
      },
    }));
  };

  const getStatusForStudent = (studentId: string): AttendanceStatus => {
    if (attendanceMap[studentId]) return attendanceMap[studentId].status;
    const existing = state.attendance.find(a => a.studentId === studentId && a.date === date);
    return existing?.status ?? 'Hadir';
  };

  const handleSave = async () => {
    if (!classImage) {
      alert('Sila muat naik Wins Gambar (Gambar Kelas) terlebih dahulu sebelum menyimpan kehadiran.');
      return;
    }
    setShowConfirm(true);
  };

  const doSave = async () => {
    setShowConfirm(false);
    const records = studentsInClass.map(s => ({
      studentId: s.id,
      classId: selectedClassId,
      date,
      status: getStatusForStudent(s.id),
      remarks: attendanceMap[s.id]?.remarks ?? '',
      reasonType: attendanceMap[s.id]?.reasonType ?? '',
    }));

    try {
      await axios.post('/api/attendance/bulk', { records });
      dispatch({ type: 'MARK_ATTENDANCE', payload: records });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setClassImage(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      alert('Gagal menyimpan kehadiran: ' + (error.response?.data?.message || 'Ralat sambungan rangkaian.'));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setClassImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const todayStats = {
    present: studentsInClass.filter(s => getStatusForStudent(s.id) === 'Hadir').length,
    absent: studentsInClass.filter(s => getStatusForStudent(s.id) === 'Tidak Hadir').length,
    late: studentsInClass.filter(s => getStatusForStudent(s.id) === 'Lewat').length,
    total: studentsInClass.length,
  };

  const statusBtn = (sid: string, status: AttendanceStatus, label: string, color: string) => (
    <button onClick={() => toggle(sid, status)}
      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${getStatusForStudent(sid) === status ? `${color} border-current` : 'text-gray-400 border-gray-200 hover:border-gray-400'}`}>
      {status === 'Hadir' ? <CheckCircle2 size={13} /> : status === 'Tidak Hadir' ? <XCircle size={13} /> : <Clock size={13} />}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={showConfirm}
        title="Simpan Rekod Kehadiran"
        message="Adakah anda pasti ingin menyimpan rekod kehadiran ini? Data kehadiran akan dihantar dan ibu bapa akan dimaklumkan."
        confirmLabel="Ya, Simpan"
        confirmColor="green"
        onConfirm={doSave}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Urus Kehadiran</h2>
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => setViewMode('daily')}
              className={`text-sm font-bold pb-1 border-b-2 transition-all ${viewMode === 'daily' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-400'}`}
            >
              Tanda Kehadiran
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`text-sm font-bold pb-1 border-b-2 transition-all ${viewMode === 'monthly' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-400'}`}
            >
              Laporan Bulanan
            </button>
          </div>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <p className="font-semibold text-green-900">Kehadiran disimpan! Ibu bapa telah dimaklumkan.</p>
        </div>
      )}

      {/* Controls */}
      {viewMode === 'daily' ? (
        <div className="flex gap-4">
          <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setAttendanceMap({}); }} className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            {teacherClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {state.teachers.find(t => String(t.id) === String(c.teacherId))?.name ?? 'Tiada Murabbi'}</option>)}
          </select>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setAttendanceMap({}); }} className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      ) : (
        <div className="flex gap-4">
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            {teacherClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {state.teachers.find(t => String(t.id) === String(c.teacherId))?.name ?? 'Tiada Murabbi'}</option>)}
          </select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            {['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'].map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {viewMode === 'daily' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Jumlah', value: todayStats.total, color: 'text-gray-900', bg: 'bg-gray-50' },
              { label: 'Hadir', value: todayStats.present, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Tidak Hadir', value: todayStats.absent, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Lewat', value: todayStats.late, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Pelajar — {state.classes.find(c => String(c.id) === String(selectedClassId))?.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => { const m: typeof attendanceMap = {}; studentsInClass.forEach(s => { m[s.id] = { status: 'Hadir', remarks: '' }; }); setAttendanceMap(m); }} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200">Tandakan Semua Hadir</button>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {studentsInClass.map(student => (
                <div key={student.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.juzukCompleted} Juzuk dihafal</p>
                  </div>
                  <div className="flex gap-2">
                    {statusBtn(student.id, 'Hadir', 'Hadir', 'text-green-600 bg-green-50')}
                    {statusBtn(student.id, 'Lewat', 'Lewat', 'text-orange-600 bg-orange-50')}
                    {statusBtn(student.id, 'Tidak Hadir', 'Tidak Hadir', 'text-red-600 bg-red-50')}
                  </div>
                  {getStatusForStudent(student.id) === 'Tidak Hadir' && (
                    <div className="flex flex-col gap-1.5 min-w-[170px]">
                      <select
                        value={attendanceMap[student.id]?.reasonType ?? ''}
                        onChange={e => {
                          const reasonType = e.target.value;
                          setAttendanceMap(prev => ({
                            ...prev,
                            [student.id]: {
                              status: 'Tidak Hadir',
                              reasonType,
                              remarks: reasonType === 'Lain-lain' ? '' : reasonType,
                            },
                          }));
                        }}
                        className={`text-xs px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          attendanceMap[student.id]?.reasonType === 'Ponteng'
                            ? 'border-red-400 bg-red-50 text-red-700 font-bold focus:ring-red-300'
                            : 'border-gray-200 bg-white text-gray-700 focus:ring-teal-300'
                        }`}
                      >
                        <option value="">-- Pilih Sebab --</option>
                        {ABSENCE_REASONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      {attendanceMap[student.id]?.reasonType === 'Lain-lain' && (
                        <input
                          type="text"
                          placeholder="Nyatakan sebab..."
                          className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                          value={attendanceMap[student.id]?.remarks ?? ''}
                          onChange={e => setAttendanceMap(prev => ({
                            ...prev,
                            [student.id]: { ...prev[student.id], remarks: e.target.value },
                          }))}
                        />
                      )}
                      {attendanceMap[student.id]?.reasonType === 'Ponteng' && (
                        <p className="text-[10px] text-red-600 font-semibold">⚠️ Akan mempengaruhi skor AI</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {studentsInClass.length === 0 && <p className="px-6 py-10 text-center text-gray-400 text-sm">Tiada pelajar dalam kelas ini.</p>}
            </div>
            
            <div className="p-6 bg-white border-t border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Camera size={18} className="text-teal-600" />
                Wins Gambar <span className="text-red-500 text-xs">(Wajib)</span>
              </h3>
              <p className="text-sm text-gray-500">Sila muat naik gambar aktiviti kelas sebagai bukti selesai sesi pembelajaran.</p>
              
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-full max-w-xs h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-teal-400 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500 font-medium">Klik untuk muat naik imej</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {imagePreview && (
                  <button onClick={() => { setClassImage(null); setImagePreview(null); }} className="text-xs text-red-500 font-bold hover:underline">Buang Gambar</button>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <button 
                onClick={handleSave} 
                className={`w-full py-3 text-white font-bold rounded-xl transition-all ${classImage ? 'bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-900/20' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                {classImage ? 'Simpan Kehadiran & Selesai Kelas' : 'Sila Muat Naik Wins Gambar Dahulu'}
              </button>
            </div>
          </div>
        </>
      )}

      {viewMode === 'monthly' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nama Pelajar</th>
                <th className="px-6 py-3 text-[11px] font-bold text-green-600 uppercase tracking-wider text-center">Hadir</th>
                <th className="px-6 py-3 text-[11px] font-bold text-orange-600 uppercase tracking-wider text-center">Lewat</th>
                <th className="px-6 py-3 text-[11px] font-bold text-red-600 uppercase tracking-wider text-center">T. Hadir</th>
                <th className="px-6 py-3 text-[11px] font-bold text-purple-600 uppercase tracking-wider text-center">Ponteng</th>
                <th className="px-6 py-3 text-[11px] font-bold text-blue-600 uppercase tracking-wider text-right">Peratus (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 italic text-sm">
              {studentsInClass.map(s => {
                const sData    = monthlyData.filter(d => String(d.student_id) === String(s.id));
                const hadir    = sData.filter(d => d.status === 'Hadir').length;
                const lewat    = sData.filter(d => d.status === 'Lewat').length;
                const takHadir = sData.filter(d => d.status === 'Tidak Hadir').length;
                const ponteng  = sData.filter(d => d.status === 'Tidak Hadir' && d.remarks?.toLowerCase() === 'ponteng').length;
                const total    = hadir + lewat + takHadir;
                const percent  = total > 0 ? Math.round(((hadir + lewat) / total) * 100) : 0;

                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 not-italic">{s.name}</td>
                    <td className="px-6 py-4 text-center font-bold text-green-600">{hadir}</td>
                    <td className="px-6 py-4 text-center font-bold text-orange-600">{lewat}</td>
                    <td className="px-6 py-4 text-center font-bold text-red-600">{takHadir}</td>
                    <td className="px-6 py-4 text-center">
                      {ponteng > 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                          🚫 {ponteng}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${percent >= 90 ? 'bg-green-100 text-green-700' : percent >= 70 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {studentsInClass.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Tiada data untuk kelas ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
