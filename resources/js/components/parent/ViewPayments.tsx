import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../../store/AppContext';
import { CheckCircle, Clock, AlertCircle, Bell } from 'lucide-react';
import { Payment } from '../../store/mockData';
import { SkeletonStatCards, SkeletonTable } from '../shared/Skeleton';

const MONTHS = ['','Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];

interface ViewPaymentsProps {
  childId: string;
  readOnly?: boolean;
  childData?: { name?: string };
}

export function ViewPayments({ childId, readOnly = false, childData }: ViewPaymentsProps) {
  const { state } = useAppStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  const storeChild = state.students.find(s => String(s.id) === String(childId));
  const child = childData?.name ? childData : storeChild;

  useEffect(() => {
    fetchPayments();
  }, [childId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`/api/payments?student_id=${childId}`);
      setPayments(resp.data);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  const pending = payments.filter(p => p.status !== 'Dibayar');
  const totalPaid = payments.filter(p => p.status === 'Dibayar').reduce((s, p) => s + Number(p.amount || 0), 0);

  const handlePay = async (paymentId: string) => {
    if (confirm('Sahkan pembayaran? Invois akan ditandakan sebagai Dibayar.')) {
      try {
        await axios.put(`/api/payments/${paymentId}`, { status: 'Dibayar' });
        alert('Pembayaran disahkan!');
        fetchPayments();
      } catch (err) {
        alert('Gagal mengemaskini pembayaran.');
      }
    }
  };

  const notifyAdmin = async (paymentId: string, month: number, year: number) => {
    setNotifyingId(paymentId);
    try {
      await axios.post(`/api/payments/${paymentId}/notify-paid`, {
        student_name: child?.name,
        period: `${MONTHS[month]} ${year}`,
      });
      setNotifiedIds(prev => new Set(prev).add(paymentId));
      alert(`Terima kasih! Admin telah dimaklumkan tentang bayaran ${MONTHS[month]} ${year}. Mereka akan mengesahkan dan mengeluarkan invois.`);
    } catch (err) {
      alert('Gagal menghantar makluman. Sila cuba lagi.');
    } finally {
      setNotifyingId(null);
    }
  };

  const statusIcon = (s: string) =>
    s === 'Dibayar' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
    s === 'Tertunggak' ? <AlertCircle className="w-4 h-4 text-red-600" /> :
    <Clock className="w-4 h-4 text-orange-500" />;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Dibayar: 'bg-green-100 text-green-700', 'Belum Bayar': 'bg-orange-100 text-orange-700', Tertunggak: 'bg-red-100 text-red-700' };
    return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${map[s] ?? ''}`}>{s}</span>;
  };

  if (loading) return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuatkan pembayaran...">
      <div className="h-7 bg-slate-200 rounded-lg w-48 animate-pulse" />
      <SkeletonStatCards count={3} />
      <SkeletonTable rows={5} cols={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-semibold text-gray-900">Sejarah Pembayaran</h2><p className="text-gray-600 mt-1">Jejak pembayaran yuran untuk {child?.name}</p></div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Jumlah Dibayar', value: `RM ${totalPaid}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Belum Bayar', value: pending.length, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Yuran Bulanan', value: 'RM 1112.50', color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="font-semibold text-orange-800">⚠️ Anda mempunyai {pending.length} pembayaran yang belum selesai</p>
          <p className="text-sm text-orange-700 mt-1">Sila jelaskan sebelum tarikh akhir untuk mengelakkan caj tertunggak.</p>
        </div>
      )}

      {/* Payment list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Tempoh','Jumlah','Status','Tarikh Akhir','Tarikh Bayar','Tindakan'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...payments].sort((a,b) => b.year - a.year || b.month - a.month).map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{MONTHS[p.month]} {p.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">RM {p.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2">{statusIcon(p.status)}{statusBadge(p.status)}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.paidDate ?? '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.status !== 'Dibayar' && !readOnly && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => window.open('https://asis.awfatech.com/main/appfee/adm/index.php?sysapp=asis0077', '_blank')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg cursor-pointer border-none transition-all shadow-sm"
                        >
                          Bayar Sekarang
                        </button>
                        {notifiedIds.has(String(p.id)) ? (
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg text-center border border-blue-200">
                            ✓ Admin Dimaklumkan
                          </span>
                        ) : (
                          <button
                            onClick={() => notifyAdmin(String(p.id), p.month, p.year)}
                            disabled={notifyingId === String(p.id)}
                            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg cursor-pointer border border-orange-300 transition-all flex items-center gap-1 justify-center disabled:opacity-50"
                          >
                            <Bell className="w-3 h-3" />
                            {notifyingId === String(p.id) ? 'Menghantar...' : 'Dah Bayar? Beritahu Admin'}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">Tiada rekod pembayaran lagi.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}