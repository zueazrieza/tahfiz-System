import { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle, Clock, AlertCircle, Printer, X } from 'lucide-react';
import { useAppStore, getMonthlyRevenue, getTotalRevenue, getPendingRevenue } from '../../store/AppContext';
import axios from 'axios';

const MONTHS = ['','Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];

export function ManagePayments() {
  const { state, dispatch } = useAppStore();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 1300 });
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const inputCls = 'w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500';

  const [activeTab, setActiveTab] = useState<'semua' | 'dibayar' | 'belum_bayar'>('semua');
  const [filterFeeType, setFilterFeeType] = useState<string>('semua');
  const [filterMonth, setFilterMonth] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');


  const feeTypes = [
    { value: 'semua', label: 'Semua Jenis Yuran' },
    { value: 'bulanan', label: 'Yuran Bulanan (RM1300/RM1350)' },
    { value: 'pendaftaran', label: 'Yuran Pendaftaran Masuk (RM1000)' },
    { value: 'asrama', label: 'Yuran Pengurusan Asrama (RM350)' },
    { value: 'lain', label: 'Yuran Pembelajaran Lain' }
  ];

  const monthsFilter = [
    { value: 'semua', label: 'Semua Bulan' },
    ...MONTHS.slice(1).map((m, idx) => ({ value: String(idx + 1), label: m }))
  ];

  const getFeeType = (amount: number) => {
    const amt = Number(amount);
    if (amt === 1350 || amt === 1300) return 'bulanan';
    if (amt === 1000) return 'pendaftaran';
    if (amt === 350) return 'asrama';
    return 'lain';
  };

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

  const getStudentName = (id: string | number) => state.students.find(s => String(s.id) === String(id))?.name ?? id;
  const getClassName = (classId: string | number | undefined) => {
    if (!classId) return '—';
    return state.classes.find(c => String(c.id) === String(classId))?.name ?? '—';
  };

  const sortedPayments = [...state.payments].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const filteredPayments = sortedPayments.filter(p => {
    // Tab Filter
    if (activeTab === 'dibayar' && p.status !== 'Dibayar') return false;
    if (activeTab === 'belum_bayar' && p.status !== 'Belum Bayar' && p.status !== 'Tertunggak') return false;

    // Search Query (Student Name)
    const studentName = getStudentName(p.studentId).toLowerCase();
    if (searchQuery && !studentName.includes(searchQuery.toLowerCase())) return false;

    // Month Filter
    if (filterMonth !== 'semua' && String(p.month) !== filterMonth) return false;

    // Fee Type Filter
    const feeType = getFeeType(Number(p.amount));
    if (filterFeeType !== 'semua' && feeType !== filterFeeType) return false;

    return true;
  });

  const total = filteredPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const paid = filteredPayments.filter(p => p.status === 'Dibayar').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const pending = filteredPayments.filter(p => p.status !== 'Dibayar').reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.studentId) return;
    if (!confirm('Adakah anda pasti ingin menjana invois baharu ini?')) {
      return;
    }
    const dueDate = new Date(invoiceForm.year, invoiceForm.month - 1, 5).toISOString().split('T')[0];
    try {
      const res = await axios.post('/api/payments', {
        ...invoiceForm,
        status: 'Belum Bayar',
        dueDate
      });
      dispatch({ type: 'ADD_PAYMENT', payload: res.data });
      setShowInvoiceModal(false);
      setViewingInvoice(res.data);
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('Gagal menjana invois.');
    }
  };

  const handleToggle = async (p: any) => {
    const newStatus = p.status === 'Dibayar' ? 'Belum Bayar' : 'Dibayar';
    const confirmText = newStatus === 'Dibayar' 
      ? `Adakah anda pasti ingin menukar status bayaran kepada DIBAYAR untuk ${getStudentName(p.studentId)}?`
      : `Adakah anda pasti ingin menukar status bayaran kepada BELUM BAYAR untuk ${getStudentName(p.studentId)}?`;
    if (!confirm(confirmText)) {
      return;
    }
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
          <h2 className="text-2xl font-semibold text-gray-900">Urus Bayaran & Invois</h2>
          <p className="text-gray-600 mt-1">Jejak dan uruskan bayaran yuran pelajar</p>
        </div>
        <button onClick={() => setShowInvoiceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <FileText className="w-5 h-5" /> Jana Invois
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'semua', label: 'Semua Bayaran' },
          { id: 'dibayar', label: 'Telah Dibayar (Status Bayar)' },
          { id: 'belum_bayar', label: 'Belum Dibayar (Status Belum Bayar)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-white text-green-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama pelajar..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
          />
        </div>

        {/* Jenis Yuran */}
        <div>
          <select
            value={filterFeeType}
            onChange={e => setFilterFeeType(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
          >
            {feeTypes.map(ft => (
              <option key={ft.value} value={ft.value}>{ft.label}</option>
            ))}
          </select>
        </div>

        {/* Bulan */}
        <div>
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
          >
            {monthsFilter.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Quick Reset */}
        <div>
          <button
            onClick={() => {
              setActiveTab('semua');
              setFilterFeeType('semua');
              setFilterMonth('semua');
              setSearchQuery('');
            }}
            className="w-full py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all"
          >
            Set Semula Penapis
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Jumlah Kasar Terpilih', value: `RM ${total.toLocaleString()}`, icon: <DollarSign className="w-6 h-6 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Dibayar (Tapis)', value: `RM ${paid.toLocaleString()}`, icon: <CheckCircle className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Belum Dibayar (Tapis)', value: `RM ${pending.toLocaleString()}`, icon: <Clock className="w-6 h-6 text-orange-600" />, bg: 'bg-orange-50' },
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
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getStudentName(p.studentId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{MONTHS[p.month]} {p.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">RM {p.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{statusBadge(p.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.paidDate ?? '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {p.status === 'Dibayar' ? (
                        <span className="text-gray-400 text-xs mr-2">—</span>
                      ) : (
                        <button onClick={() => handleToggle(p)}
                          className="px-3 py-1 text-xs rounded font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
                          Tandakan Dibayar
                        </button>
                      )}
                      <button onClick={() => setViewingInvoice(p)}
                        className="p-1.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                        title="Lihat Invois"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    Tiada rekod bayaran ditemui mengikut penapis semasa.
                  </td>
                </tr>
              )}
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

      {/* Invoice View Modal */}
      {viewingInvoice && (
        <InvoiceViewModal
          payment={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          getClassName={getClassName}
        />
      )}
    </div>
  );
}

function InvoiceViewModal({ payment, onClose, getClassName }: { payment: any; onClose: () => void; getClassName: (id: any) => string }) {
  const { state } = useAppStore();
  const student = state.students.find(s => String(s.id) === String(payment.studentId));

  const invoiceNo = `INV-${payment.year}-${String(payment.month).padStart(2, '0')}-${String(payment.id).padStart(4, '0')}`;
  const invoiceDate = payment.paidDate || payment.dueDate || new Date().toISOString().split('T')[0];

  const getPaymentDescription = (amount: number) => {
    const amt = Number(amount);
    if (amt === 1350) return 'Yuran Bulanan Pengajian (RM1000) & Asrama (RM350)';
    if (amt === 1300) return 'Yuran Bulanan Pengajian (RM950) & Asrama (RM350)';
    if (amt === 1000) return 'Yuran Pendaftaran Masuk';
    if (amt === 350) return 'Yuran Pengurusan Asrama';
    return 'Yuran Pembelajaran';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 24px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden no-print">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" /> Paparan Invois
          </h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-bold transition-all shadow-sm">
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button onClick={onClose} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {/* Invoice Page Container */}
          <div id="printable-invoice" className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm text-slate-800">
            {/* Invoice Header */}
            <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <img src="/images/logo.png" alt="AKMAL Logo" className="h-16 w-auto object-contain" onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }} />
                <div>
                  <h1 className="text-lg font-black text-emerald-800 tracking-tight">AKMAL HQ</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Akademi Al-Quran Amalillah Terengganu</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Lot 2123, Kampung Tebakang Bukit Payung,<br />
                    21400 Marang, Terengganu<br />
                    Tel: 011-1987 4963 | E-mel: info@akmal.edu.my
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full mb-3 ${
                  payment.status === 'Dibayar' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {payment.status}
                </span>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No. Invois</p>
                <p className="text-sm font-bold text-slate-800 mb-2">{invoiceNo}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tarikh</p>
                <p className="text-xs font-bold text-slate-800">{invoiceDate}</p>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dibilkan Kepada</h3>
                <p className="text-sm font-black text-slate-800">{student?.name || 'Pelajar'}</p>
                <p className="text-xs text-slate-500 mt-1">Kelas: {getClassName(student?.classId)}</p>
                {student?.icNo && <p className="text-xs text-slate-500">No. IC: {student.icNo}</p>}
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Maklumat Penjaga</h3>
                <p className="text-xs font-bold text-slate-700">{student?.parentName || '—'}</p>
                {student?.parentPhone && <p className="text-xs text-slate-500 mt-1">Tel: {student.parentPhone}</p>}
                {student?.address && <p className="text-xs text-slate-500 mt-1">{student.address}</p>}
              </div>
            </div>

            {/* Invoice Table */}
            <table className="w-full text-left border-collapse mb-8">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Butiran Caj</th>
                  <th className="py-2.5 px-3 text-center w-20">Kuantiti</th>
                  <th className="py-2.5 px-3 text-right w-32">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                <tr>
                  <td className="py-4 px-3 font-semibold">
                    {getPaymentDescription(payment.amount)}
                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">Yuran bagi sesi {MONTHS[payment.month]} {payment.year}</span>
                  </td>
                  <td className="py-4 px-3 text-center font-mono">1</td>
                  <td className="py-4 px-3 text-right font-bold text-slate-900">RM {Number(payment.amount).toFixed(2)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-100 text-sm font-bold">
                  <td colSpan={2} className="py-4 px-3 text-right text-xs text-slate-400 uppercase tracking-wider">Jumlah Kasar</td>
                  <td className="py-4 px-3 text-right text-slate-900">RM {Number(payment.amount).toFixed(2)}</td>
                </tr>
                <tr className="border-t border-slate-100 text-base font-bold bg-slate-50/50">
                  <td colSpan={2} className="py-4 px-3 text-right text-xs uppercase tracking-wider text-emerald-800">Jumlah Bersih (RM)</td>
                  <td className="py-4 px-3 text-right text-emerald-800">RM {Number(payment.amount).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Terms and notes */}
            <div className="border-t border-slate-100 pt-6 text-[10px] text-slate-400 leading-relaxed">
              <p className="font-bold text-slate-500 mb-1">Nota Khas:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Resit ini dijanakan secara berkomputer dan sah tanpa tandatangan fizikal.</li>
                <li>Sila simpan invois/resit ini untuk rujukan masa hadapan.</li>
                <li>Sebarang pertanyaan mengenai yuran, sila hubungi pejabat pentadbiran AKMAL.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen duplicate strictly for clean system-level printing */}
      <div className="hidden print:block" style={{ width: '100%' }}>
        <div id="printable-invoice" className="bg-white p-8 text-slate-800" style={{ width: '100%', fontFamily: 'sans-serif' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/images/logo.png" alt="AKMAL Logo" style={{ height: '64px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#065f46' }}>AKMAL HQ</h1>
                <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#0f766e', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Akademi Al-Quran Amalillah Terengganu</p>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                  Lot 2123, Kampung Tebakang Bukit Payung,<br />
                  21400 Marang, Terengganu<br />
                  Tel: 011-1987 4963 | E-mel: info@akmal.edu.my
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'inline-block', padding: '4px 12px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '9999px', background: payment.status === 'Dibayar' ? '#dcfce7' : '#fee2e2', color: payment.status === 'Dibayar' ? '#15803d' : '#b91c1c', marginBottom: '8px' }}>
                {payment.status}
              </span>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>No. Invois</p>
              <p style={{ margin: '2px 0 8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{invoiceNo}</p>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Tarikh</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>{invoiceDate}</p>
            </div>
          </div>

          {/* Bill to */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dibilkan Kepada</h3>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>{student?.name || 'Pelajar'}</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Kelas: {getClassName(student?.classId)}</p>
              {student?.icNo && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>No. IC: {student.icNo}</p>}
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maklumat Penjaga</h3>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{student?.parentName || '—'}</p>
              {student?.parentPhone && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Tel: {student.parentPhone}</p>}
              {student?.address && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{student.address}</p>}
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px' }}>Butiran Caj</th>
                <th style={{ padding: '10px', textAlign: 'center', width: '80px' }}>Kuantiti</th>
                <th style={{ padding: '10px', textAlign: 'right', width: '120px' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '12px', color: '#334155' }}>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 10px' }}>
                  <strong style={{ display: 'block', color: '#1e293b' }}>{getPaymentDescription(payment.amount)}</strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Yuran bagi sesi {MONTHS[payment.month]} {payment.year}</span>
                </td>
                <td style={{ padding: '16px 10px', textAlign: 'center' }}>1</td>
                <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>RM {Number(payment.amount).toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', fontSize: '12px' }}>
                <td colSpan={2} style={{ padding: '16px 10px', textAlign: 'right', color: '#94a3b8', textTransform: 'uppercase' }}>Jumlah Kasar</td>
                <td style={{ padding: '16px 10px', textAlign: 'right', color: '#0f172a' }}>RM {Number(payment.amount).toFixed(2)}</td>
              </tr>
              <tr style={{ fontWeight: 'bold', fontSize: '14px', background: '#f8fafc' }}>
                <td colSpan={2} style={{ padding: '16px 10px', textAlign: 'right', color: '#065f46', textTransform: 'uppercase' }}>Jumlah Bersih (RM)</td>
                <td style={{ padding: '16px 10px', textAlign: 'right', color: '#065f46' }}>RM {Number(payment.amount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Notes */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', fontSize: '10px', color: '#94a3b8', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#64748b' }}>Nota Khas:</p>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              <li>Resit ini dijanakan secara berkomputer dan sah tanpa tandatangan fizikal.</li>
              <li>Sila simpan invois/resit ini untuk rujukan masa hadapan.</li>
              <li>Sebarang pertanyaan mengenai yuran, sila hubungi pejabat pentadbiran AKMAL.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}