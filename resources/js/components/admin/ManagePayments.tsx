import { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAppStore, getMonthlyRevenue, getTotalRevenue, getPendingRevenue } from '../../store/AppContext';
import axios from 'axios';

const MONTHS = ['','Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];

export function ManagePayments() {
  const { state, dispatch } = useAppStore();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 1300 });
  const inputCls = 'w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsRes, studentsRes] = await Promise.all([
          axios.get('/api/payments'),
          axios.get('/api/students')
        ]);
        dispatch({ type: 'SET_PAYMENTS', payload: paymentsRes.data });
        dispatch({ type: 'SET_STUDENTS', payload: studentsRes.data });
      } catch (err) {
        console.error('Error fetching payments:', err);
      }
    };
    fetchData();
  }, [dispatch]);

  const total = getTotalRevenue(state);
  const monthly = getMonthlyRevenue(state);
  const pending = getPendingRevenue(state);

  const getStudentName = (id: string | number) => state.students.find(s => String(s.id) === String(id))?.name ?? id;

  const sortedPayments = [...state.payments].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const handleInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.studentId) return;
    const dueDate = new Date(invoiceForm.year, invoiceForm.month - 1, 5).toISOString().split('T')[0];
    try {
      const res = await axios.post('/api/payments', {
        ...invoiceForm,
        status: 'Belum Bayar',
        dueDate
      });
      dispatch({ type: 'ADD_PAYMENT', payload: res.data });
      setShowInvoiceModal(false);
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('Gagal menjana invois.');
    }
  };

  const handleToggle = async (p: any) => {
    const newStatus = p.status === 'Dibayar' ? 'Belum Bayar' : 'Dibayar';
    try {
      const res = await axios.put(`/api/payments/${p.id}`, { status: newStatus });
      dispatch({ type: 'TOGGLE_PAYMENT', payload: { id: p.id, status: newStatus } });
      // Reload for side effects (activity log handled in reducer but maybe date changed)
      const paymentsRes = await axios.get('/api/payments');
      dispatch({ type: 'SET_PAYMENTS', payload: paymentsRes.data });
    } catch (err) {
      console.error('Error updating payment:', err);
      alert('Gagal mengemaskini status bayaran.');
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Dibayar: 'bg-green-100 text-green-700', 'Belum Bayar': 'bg-orange-100 text-orange-700', Tertunggak: 'bg-red-100 text-red-700' };
    return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${map[s] ?? ''}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Manage Payments & Invoices</h2>
          <p className="text-gray-600 mt-1">Track and manage student payments</p>
        </div>
        <button onClick={() => setShowInvoiceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <FileText className="w-5 h-5" /> Jana Invois
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Jumlah Terkumpul', value: `RM ${total.toLocaleString()}`, icon: <DollarSign className="w-6 h-6 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Dibayar Bulan Ini', value: `RM ${monthly.toLocaleString()}`, icon: <CheckCircle className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Belum Dibayar', value: `RM ${pending.toLocaleString()}`, icon: <Clock className="w-6 h-6 text-orange-600" />, bg: 'bg-orange-50' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-3 ${c.bg} rounded-lg`}>{c.icon}</div>
              <div>
                <p className="text-sm text-gray-600">{c.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Pelajar','Bulan','Jumlah','Status','Tarikh Akhir','Tarikh Bayar','Tindakan'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPayments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getStudentName(p.studentId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{MONTHS[p.month]} {p.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">RM {p.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{statusBadge(p.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.paidDate ?? '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleToggle(p)}
                      className={`px-3 py-1 text-xs rounded font-medium ${p.status === 'Dibayar' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                      {p.status === 'Dibayar' ? 'Tandakan Belum Bayar' : 'Tandakan Dibayar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Jana Invois</h3>
            <form className="space-y-4" onSubmit={handleInvoice}>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Pilih Pelajar</label>
                <select required className={inputCls} value={invoiceForm.studentId} onChange={e => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}>
                  <option value="">Pilih pelajar...</option>
                  {state.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
                  <select className={inputCls} value={invoiceForm.month} onChange={e => setInvoiceForm({ ...invoiceForm, month: Number(e.target.value) })}>
                    {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                  <input type="number" className={inputCls} value={invoiceForm.year} onChange={e => setInvoiceForm({ ...invoiceForm, year: Number(e.target.value) })} />
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Jumlah (RM)</label>
                <input type="number" required className={inputCls} value={invoiceForm.amount} onChange={e => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })} />
                <p className="text-xs text-slate-500 mt-1">* RM 1300 (Yuran Pembelajaran RM950 + Yuran Asrama RM350)</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Jana</button>
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}