import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, UserPlus, Shield, User, Key, Check, X, Loader2, AlertTriangle } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  interview_at: string | null;
}

interface StudentData {
  id: number;
  name: string;
  matric_no?: string;
  has_account: boolean;
  account_email?: string;
}

interface ConfirmModal {
  open: boolean;
  type: 'approve' | 'reject' | null;
  userId: number | null;
  userName: string;
  confirmed: boolean;
}

export function UserApproval() {
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [studentsWithoutAccounts, setStudentsWithoutAccounts] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approve' | 'create'>('approve');
  const [modal, setModal] = useState<ConfirmModal>({ open: false, type: null, userId: null, userName: '', confirmed: false });

  // Student account form
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pendingResp = await axios.get('/api/users/pending');
      setPendingUsers(Array.isArray(pendingResp.data) ? pendingResp.data : []);
    } catch (err) {
      console.error('Error fetching pending users', err);
    }

    try {
      const studentsResp = await axios.get('/api/users/students-no-account');
      setStudentsWithoutAccounts(Array.isArray(studentsResp.data) ? studentsResp.data : []);
    } catch (err) {
      console.error('Error fetching students without accounts', err);
    }
    setLoading(false);
  };

  const handleRecordInterview = async (user: UserData) => {
    if (!confirm(`Rekod sesi temuduga untuk ${user.name}?\n\nIni mengesahkan bahawa sesi temuduga dan pengesahan telah dijalankan secara rasmi.`)) return;
    try {
      const res = await axios.post(`/api/users/${user.id}/interview`);
      setPendingUsers(prev => prev.map(u => u.id === user.id ? { ...u, interview_at: res.data.interview_at } : u));
    } catch {
      alert('Gagal merekod sesi temuduga.');
    }
  };

  const openModal = (type: 'approve' | 'reject', user: UserData) => {
    setModal({ open: true, type, userId: user.id, userName: user.name, confirmed: false });
  };

  const closeModal = () => {
    setModal({ open: false, type: null, userId: null, userName: '', confirmed: false });
  };

  const handleConfirm = async () => {
    if (!modal.confirmed || !modal.userId || !modal.type) return;
    const { type, userId } = modal;
    closeModal();
    try {
      if (type === 'approve') {
        await axios.post(`/api/users/${userId}/approve`);
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        alert('Akaun telah diluluskan!');
      } else {
        await axios.post(`/api/users/${userId}/reject`);
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        alert('Akaun telah ditolak dan dipadam.');
      }
    } catch (err) {
      alert(type === 'approve' ? 'Gagal meluluskan akaun.' : 'Gagal menolak akaun.');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    if (!confirm('Adakah anda pasti ingin mencipta akaun pelajar ini?')) {
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/users/student-account', {

        student_id: selectedStudent,
        username,
        password
      });
      alert('Akaun pelajar berjaya dicipta!');
      setUsername('');
      setPassword('');
      setSelectedStudent(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mencipta akaun.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Confirmation Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 flex items-center gap-3 ${modal.type === 'approve' ? 'bg-amber-50 border-b border-amber-100' : 'bg-red-50 border-b border-red-100'}`}>
              <AlertTriangle className={`shrink-0 ${modal.type === 'approve' ? 'text-amber-500' : 'text-red-500'}`} size={22} />
              <div>
                <p className="font-bold text-gray-900">
                  {modal.type === 'approve' ? 'Pengesahan Kelulusan Akaun' : 'Pengesahan Penolakan Akaun'}
                </p>
                <p className="text-sm text-gray-500">{modal.userName}</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Amaran Penting</p>
                <p className="text-sm text-amber-700">
                  Butang ini <strong>hanya boleh digunakan</strong> setelah sesi temuduga dan pengesahan pelajar telah selesai dijalankan secara rasmi oleh admin.
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Sila pastikan perkara berikut telah dilakukan sebelum meneruskan:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Sesi temuduga dengan pelajar/ibu bapa telah dijalankan</li>
                <li>Dokumen pengesahan telah disemak</li>
                <li>Keputusan penerimaan/penolakan telah dibuat secara rasmi</li>
              </ul>

              <label className="flex items-start gap-3 cursor-pointer group mt-2">
                <input
                  type="checkbox"
                  checked={modal.confirmed}
                  onChange={e => setModal(m => ({ ...m, confirmed: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  Saya mengesahkan bahawa <strong>sesi temuduga dan pengesahan telah selesai</strong> dijalankan untuk pengguna ini.
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={!modal.confirmed}
                className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  modal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {modal.type === 'approve' ? 'Ya, Luluskan' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Pengurusan Akses</h2>
          <p className="text-gray-600 mt-1">Kelulusan akaun baru dan penyediaan akaun pelajar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('approve')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'approve' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <UserCheck size={18} /> Kelulusan Pengguna
          {pendingUsers.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingUsers.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <UserPlus size={18} /> Akaun Pelajar
          {studentsWithoutAccounts.filter(s => !s.has_account).length > 0 && (
            <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {studentsWithoutAccounts.filter(s => !s.has_account).length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {activeTab === 'approve' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & Emel</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Peranan</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tarikh Daftar</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        <Shield size={40} className="mx-auto mb-3 opacity-20" />
                        Tiada permohonan akaun baru buat masa ini.
                      </td>
                    </tr>
                  ) : (
                    pendingUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 
                            user.role === 'parent' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {user.role === 'teacher' ? 'Guru' : user.role === 'parent' ? 'Ibu Bapa' : 'Pelajar'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('ms-MY')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {!user.interview_at ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                                  ⚠️ Sesi belum direkod
                                </span>
                                <button
                                  onClick={() => handleRecordInterview(user)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                  title="Rekod Sesi Temuduga"
                                >
                                  Rekod Sesi
                                </button>
                                <button disabled className="p-2 bg-gray-100 text-gray-300 rounded-lg cursor-not-allowed" title="Sila rekod sesi temuduga dahulu">
                                  <Check size={18} />
                                </button>
                                <button disabled className="p-2 bg-gray-100 text-gray-300 rounded-lg cursor-not-allowed" title="Sila rekod sesi temuduga dahulu">
                                  <X size={18} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                                  ✓ Sesi direkod
                                </span>
                                <button
                                  onClick={() => openModal('approve', user)}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                  title="Luluskan"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => openModal('reject', user)}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                  title="Tolak"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Account Form */}
                <div className="space-y-6 border-r border-gray-100 pr-8">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Key size={20} className="text-indigo-600" />
                    Cipta Akaun Baru
                  </h3>
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pelajar</label>
                      <select 
                        required
                        value={selectedStudent || ''}
                        onChange={(e) => setSelectedStudent(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
                      >
                        <option value="">-- Sila Pilih Pelajar --</option>
                        {studentsWithoutAccounts.filter(s => !s.has_account).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.matric_no ? `(${s.matric_no})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text" 
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. ahmad_firdaus"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kata Laluan</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 aksara"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={submitting || !selectedStudent}
                      className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Sedang Diproses...' : 'Cipta Akaun Sekarang'}
                    </button>
                  </form>
                </div>

                {/* Info / List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Pelajar Tanpa Akaun</h3>
                  <p className="text-sm text-gray-500 italic">Sila sediakan akaun log masuk untuk pelajar di bawah bagi membolehkan mereka mengakses portal pelajar.</p>
                  
                  <div className="max-h-[360px] overflow-y-auto space-y-2 pr-2">
                    {studentsWithoutAccounts.length === 0 ? (
                      <p className="text-center py-8 text-gray-400 text-sm">Tiada pelajar aktif.</p>
                    ) : (
                      studentsWithoutAccounts.map(s => (
                        <div key={s.id} className={`p-3 rounded-lg flex items-center justify-between border transition-all ${s.has_account ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-transparent hover:border-indigo-100'}`}>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                            {s.has_account ? (
                              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <Check size={11} /> {s.account_email}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400">{s.matric_no || 'Tiada no. matrik'}</p>
                            )}
                          </div>
                          {!s.has_account && (
                            <button
                              onClick={() => {
                                setSelectedStudent(s.id);
                                setUsername(s.matric_no ? s.matric_no.toLowerCase().replace(/\//g, '-') : s.name.split(' ')[0].toLowerCase());
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <UserPlus size={16} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
