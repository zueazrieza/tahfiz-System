import { useState, useEffect, useRef } from 'react';
import { Pagination } from '../shared/Pagination';
import { Search, Eye, FileSpreadsheet, User, Phone, Briefcase, DollarSign, Users, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import axios from 'axios';

export function ManageParents() {
  const { state, dispatch } = useAppStore();
  const [parents, setParents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [parentsPage, setParentsPage] = useState(1);
  const PARENTS_PER_PAGE = 15;
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; skipped: number; errors: string[]; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/parents');
      setParents(response.data);
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleImport = async () => {
    if (!importFile) return;
    if (!confirm('Adakah anda pasti ingin mengimport data penjaga dari fail ini?')) {
      return;
    }
    setImportLoading(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', importFile);
    try {

      const res = await axios.post('/api/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      // Refresh list
      fetchParents();
    } catch (error: any) {
      const errData = error?.response?.data;
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: errData?.errors ?? [errData?.message ?? 'Ralat tidak diketahui.'],
        message: errData?.message ?? 'Import gagal.',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setImportFile(file); setImportResult(null); }
  };

  const filtered = parents.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.father?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.mother?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.father?.icNo?.includes(searchTerm) ||
    p.mother?.icNo?.includes(searchTerm) ||
    p.icNo?.includes(searchTerm)
  );

  const totalParentPages = Math.ceil(filtered.length / PARENTS_PER_PAGE);
  const paginatedParents = filtered.slice((parentsPage - 1) * PARENTS_PER_PAGE, parentsPage * PARENTS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pengurusan Ibu Bapa / Penjaga</h2>
          <p className="text-slate-500 mt-1 text-sm leading-relaxed">Lihat dan eksport maklumat penjaga serta pautan dengan pelajar.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowImportModal(true); setImportFile(null); setImportResult(null); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all font-bold text-sm shadow-sm"
          >
            <Upload className="w-4 h-4" /> IMPORT EXCEL
          </button>
          <a
            href="/api/export/parents"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#6FC7CB] text-[#6FC7CB] rounded-xl hover:bg-cyan-50 transition-all font-bold text-sm shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> EXPORT EXCEL
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => { setSearchTerm(e.target.value); setParentsPage(1); }}
            placeholder="Cari nama, IC, atau emel..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#6FC7CB] outline-none" 
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                {['Nama Penjaga', 'No. Telefon', 'Pekerjaan', 'Pendapatan', 'Anak / Pelajar', 'Tindakan'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400">Memuatkan data...</td></tr>
              ) : paginatedParents.map(parent => (
                <tr key={parent.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {parent.father && (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] bg-blue-50 text-blue-500 px-1 py-0 rounded font-black uppercase">Ayah</span>
                            <span className="font-bold text-slate-800">{parent.father.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono ml-10">IC: {parent.father.icNo || '—'}</div>
                        </div>
                      )}
                      {parent.mother && (
                        <div className={parent.father ? 'mt-2 border-t border-slate-50 pt-2' : ''}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] bg-pink-50 text-pink-500 px-1 py-0 rounded font-black uppercase">Ibu</span>
                            <span className="font-bold text-slate-800">{parent.mother.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono ml-10">IC: {parent.mother.icNo || '—'}</div>
                        </div>
                      )}
                      {!parent.father && !parent.mother && (
                         <>
                           <div className="font-bold text-slate-800">{parent.name}</div>
                           <div className="text-[10px] text-slate-400 font-mono">IC: {parent.icNo || '—'}</div>
                         </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{parent.phone || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{parent.occupation || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-bold">RM {parent.income || '0.00'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {parent.children.map((c: any) => (
                        <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                          {c.name}
                        </span>
                      ))}
                      {parent.children.length === 0 && <span className="text-slate-300 text-xs italic">Tiada anak</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => { setSelectedParent(parent); setShowViewModal(true); }} 
                      className="p-2 bg-slate-50 text-slate-400 hover:text-[#6FC7CB] rounded-xl transition-all"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-500">Tiada rekod ibu bapa ditemui.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <Pagination currentPage={parentsPage} totalPages={totalParentPages} onPageChange={setParentsPage} totalItems={filtered.length} itemsPerPage={PARENTS_PER_PAGE} />
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedParent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[40px] max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 my-8">
            <div className="p-10 pb-0 shrink-0">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">Profil Penjaga</h3>
               <p className="text-[#6FC7CB] font-bold text-xs uppercase tracking-widest mt-1">Maklumat Peribadi & Keluarga</p>
            </div>
            
            <div className="p-10 pt-8 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                {selectedParent.father && (
                  <div className="bg-blue-50/50 rounded-[32px] p-6 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Maklumat Ayah
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Nama Penuh</p>
                        <p className="font-bold text-slate-700 text-sm">{selectedParent.father.name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">No. IC</p>
                        <p className="font-bold text-slate-700 text-sm">{selectedParent.father.icNo}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pekerjaan</p>
                        <p className="font-bold text-slate-700 text-sm">{selectedParent.father.occupation || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pendapatan</p>
                        <p className="font-bold text-emerald-600 text-sm">RM {selectedParent.father.income || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedParent.mother && (
                  <div className="bg-pink-50/50 rounded-[32px] p-6 border border-pink-100">
                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" /> Maklumat Ibu
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Nama Penuh</p>
                        <p className="font-bold text-slate-700 text-sm">{selectedParent.mother.name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">No. IC</p>
                        <p className="font-bold text-slate-700 text-sm">{selectedParent.mother.icNo}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pekerjaan</p>
                        <p className="font-bold text-slate-700 text-sm">{selectedParent.mother.occupation || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pendapatan</p>
                        <p className="font-bold text-emerald-600 text-sm">RM {selectedParent.mother.income || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedParent.father && !selectedParent.mother && (
                  <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Nama Penuh</p>
                        <p className="font-bold text-slate-700 text-sm">{selectedParent.name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Hubungan</p>
                        <p className="font-bold text-slate-700 text-sm capitalize">{selectedParent.relationshipType}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pekerjaan</p>
                        <p className="font-bold text-slate-700 text-sm">{selectedParent.occupation || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pendapatan</p>
                        <p className="font-bold text-emerald-600 text-sm">RM {selectedParent.income || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-slate-50" />

              <section>
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-400"><Users className="w-5 h-5" /></div>
                    <p className="text-sm font-bold text-slate-800">Senarai Anak di Akademi</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {selectedParent.children.map((student: any) => (
                     <div key={student.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="font-bold text-slate-700 text-sm">{student.name}</p>
                        <p className="text-xs text-slate-400 mt-1">Kelas: <span className="text-[#6FC7CB]">{student.className}</span></p>
                     </div>
                   ))}
                 </div>
              </section>

              <div className="pt-4">
                <button 
                  onClick={() => setShowViewModal(false)} 
                  className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                >
                  TUTUP PROFIL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── IMPORT MODAL ── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-8 shadow-2xl animate-in zoom-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Import Data Pelajar & Penjaga</h3>
                  <p className="text-slate-400 text-xs">Muat naik fail Excel / CSV mengikut format</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Area */}
            {!importResult && (
              <div 
                className={`relative border-2 border-dashed rounded-3xl p-10 transition-all duration-200 text-center ${
                  dragOver ? 'border-[#6FC7CB] bg-cyan-50' : 'border-slate-100 hover:border-slate-200'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".xlsx,.xls,.csv"
                  onChange={e => { if (e.target.files?.[0]) { setImportFile(e.target.files[0]); setImportResult(null); } }}
                />
                
                {importFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">{importFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{(importFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button onClick={() => setImportFile(null)} className="text-xs font-bold text-red-500 hover:underline">Padam Fail</button>
                  </div>
                ) : (
                  <div className="space-y-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 group-hover:text-slate-400">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-600">Pilih fail atau tarik ke sini</p>
                      <p className="text-xs text-slate-400">Excel (.xlsx) atau CSV sahaja</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results Display */}
            {importResult && (
              <div className={`rounded-3xl p-6 mb-6 ${importResult.success ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {importResult.success ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                  <h4 className={`font-bold ${importResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                    {importResult.message}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/50 p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Pelajar Berjaya</p>
                    <p className="text-2xl font-black text-emerald-600">{importResult.imported}</p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-xl border border-orange-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Langkau/Ralat</p>
                    <p className="text-2xl font-black text-orange-500">{importResult.skipped}</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="bg-white/50 p-3 rounded-xl text-xs text-red-600 border border-red-100/50">
                        {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              {!importResult ? (
                <>
                  <button
                    disabled={!importFile || importLoading}
                    onClick={handleImport}
                    className="flex-1 py-4 bg-[#6FC7CB] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5FB3B7] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-50 flex items-center justify-center gap-2"
                  >
                    {importLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        PROSES IMPORT...
                      </>
                    ) : (
                      <>MULAKAN IMPORT</>
                    )}
                  </button>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                  >
                    BATAL
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  SELESAI
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
