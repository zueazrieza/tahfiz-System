import { useState, useEffect } from 'react';
import { BookOpen, User, Phone, Mail, Award, CheckCircle2, ChevronRight, ChevronLeft, Shield, Sparkles, Building2, Wallet } from 'lucide-react';
import axios from 'axios';

const extractDobFromIc = (ic: string): string => {
  const digits = ic.replace(/\D/g, '');
  if (digits.length < 6) return '';
  const yy = digits.substring(0, 2);
  const mm = digits.substring(2, 4);
  const dd = digits.substring(4, 6);
  
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';

  const currentYear = new Date().getFullYear();
  const currentShortYear = currentYear % 100;
  const yearPrefix = parseInt(yy, 10) <= currentShortYear ? '20' : '19';
  const fullYear = `${yearPrefix}${yy}`;
  
  return `${fullYear}-${mm}-${dd}`;
};

export function PublicRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Referrer
    referrer: 'MURABBI IDHAM',
    
    // Parent Data
    parentName: '',
    parentIc: '',
    parentPhone: '',
    parentEmail: '',
    parentSpousePhone: '',
    parentJob: '',
    parentIncome: 'RM2,000 ke bawah',
    password: '',
    confirmPassword: '',
    
    // Student Data
    studentName: '',
    studentIc: '',
    studentGender: 'Lelaki',
    studentDob: '',
    studentAge: 9,
    studentAddress: '',
    state: 'Terengganu',
    
    // Application Details
    applyYear: 'Permohonan 2026',
    applyLocation: 'AKMAL HQ - Terengganu',
    agreeOtherBranch: 'SETUJU',
    interviewDate: '3 JULAI 2026 (AKMAL Terengganu, Kelantan)',
    quranLevel: 'Belum Pandai Membaca',
    infoSource: 'Dari kawan-kawan',
    successReason: '',
  });

  // Auto-calc age
  useEffect(() => {
    if (formData.studentDob) {
      const birthDate = new Date(formData.studentDob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 9 && age <= 12) {
        setFormData(prev => ({ ...prev, studentAge: age }));
      }
    }
  }, [formData.studentDob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Adakah anda pasti ingin menghantar permohonan pendaftaran ini?')) {
      return;
    }
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Kata laluan tidak sepadan.');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post('/api/public/register-enrollment', {
        ...formData,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghantar permohonan. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = 'w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#6FC7CB] focus:bg-white outline-none transition-all text-slate-700';
  const labelCls = 'block text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2.5';
  const hintCls = 'block text-[11px] text-slate-400 mt-2 font-medium leading-relaxed';

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A4D50] to-[#6FC7CB] p-6">
        <div className="bg-white rounded-[40px] max-w-xl w-full p-12 text-center shadow-2xl animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Permohonan Berjaya!</h2>
          <p className="text-slate-500 leading-relaxed mb-10 text-sm">
            Terima kasih En/Puan <strong>{formData.parentName}</strong>. Rekod permohonan untuk <strong>{formData.studentName}</strong> telah diterima. 
            <br/><br/>
            Sila semak e-mel anda di <strong>{formData.parentEmail}</strong> untuk makluman lanjut dan pengesahan rasmi.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-100"
          >
            KEMBALI KE LAMAN UTAMA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center py-12 px-6">
      {/* HEADER */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl shadow-cyan-100 mb-6">
          <Sparkles className="w-10 h-10 text-[#6FC7CB]" />
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">BORANG PENDAFTARAN ONLINE</h1>
        <p className="text-slate-500 font-medium">Sila lengkapkan butiran permohonan kemasukan Akademi Al-Quran Amalillah (AKMAL).</p>
      </div>

      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 overflow-hidden relative border border-slate-50">
        {/* Step Indicator */}
        <div className="flex border-b border-slate-50">
          {[
            { n: 1, label: 'Waris & Rujukan', icon: <User className="w-4 h-4" /> },
            { n: 2, label: 'Pelajar & Temuduga', icon: <BookOpen className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.n} className={`flex-1 flex items-center justify-center py-5 gap-3 transition-all ${
              currentStep === s.n ? 'bg-slate-50/50 border-b-4 border-[#6FC7CB]' : 'opacity-40'
            }`}>
              <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep === s.n ? 'bg-[#6FC7CB] text-white' : 'bg-slate-200 text-slate-500'
              }`}>{s.icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
              <span className="p-1 bg-red-100 rounded-lg">✕</span> {error}
            </div>
          )}

          {currentStep === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
               {/* REFERRER SELECTOR */}
               <div className="p-6 bg-cyan-50/30 rounded-3xl border border-cyan-100/50 mb-6">
                 <h4 className="flex items-center gap-2 text-[#1A4D50] font-black uppercase text-xs tracking-widest mb-4">
                   <Shield className="w-4 h-4 text-[#6FC7CB]" /> NAMA REFERRER *
                 </h4>
                 
                 <div className="grid grid-cols-2 gap-4">
                   {[
                     { name: 'MURABBI IDHAM', img: '/images/murbi_idham.png', fallbackImg: '/images/murabbi_idham.png' },
                     { name: 'MURABBI ARASH', img: '/images/murbi_arash.png', fallbackImg: '/images/murabbi_arash.png' }
                   ].map(r => (
                     <button
                       key={r.name}
                       type="button"
                       onClick={() => setFormData({ ...formData, referrer: r.name })}
                       className={`relative p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 overflow-hidden ${
                         formData.referrer === r.name 
                           ? 'border-[#6FC7CB] bg-white shadow-lg shadow-cyan-50 ring-2 ring-cyan-100' 
                           : 'border-slate-100 bg-white hover:border-slate-200'
                       }`}
                     >
                       <div className="size-20 rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-50">
                         <img 
                           src={r.fallbackImg} 
                           alt={r.name} 
                           className="w-full h-full object-cover" 
                         />
                       </div>
                       <span className={`text-[10px] font-bold uppercase tracking-wider ${
                         formData.referrer === r.name ? 'text-[#1A4D50]' : 'text-slate-400'
                       }`}>{r.name}</span>
                       
                       {formData.referrer === r.name && (
                         <div className="absolute top-3 right-3 bg-[#6FC7CB] text-white p-1 rounded-full">
                           <CheckCircle2 className="size-4" />
                         </div>
                       )}
                     </button>
                   ))}
                 </div>
                 <p className="text-[#1A4D50]/60 text-[10px] font-medium leading-relaxed mt-4 text-center">
                   Sila pilih salah satu referrer yang anda berhubung, tekan pada gambar.
                 </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                   <label className={labelCls}>Nama Ibu / Bapa / Penjaga *</label>
                   <input required className={inputCls} placeholder="Nama penuh penjaga" value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })} />
                 </div>
                 <div>
                   <label className={labelCls}>IC Ibu / Bapa / Penjaga *</label>
                   <input required className={inputCls} placeholder="Contoh: 850101115566" value={formData.parentIc} onChange={e => setFormData({ ...formData, parentIc: e.target.value })} />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                   <label className={labelCls}>No Tel Ibu / Bapa / Penjaga *</label>
                   <input type="tel" required className={inputCls} placeholder="Contoh: 0192837465" value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} />
                   <span className={hintCls}>*Masukkan nombor telefon ibu atau bapa yang mudah dihubungi (melalui WhatsApp) — sebaiknya nombor yang sedang berhubung dengan Unit Pendaftaran AKMAL.</span>
                 </div>
                 <div>
                   <label className={labelCls}>No Tel Pasangan Ibu / Bapa / Penjaga</label>
                   <input type="tel" className={inputCls} placeholder="Contoh: 0192837466" value={formData.parentSpousePhone} onChange={e => setFormData({ ...formData, parentSpousePhone: e.target.value })} />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                   <label className={labelCls}>Email Anda *</label>
                   <input type="email" required className={inputCls} placeholder="contoh@email.com" value={formData.parentEmail} onChange={e => setFormData({ ...formData, parentEmail: e.target.value })} />
                   <span className={hintCls}>*Pastikan e-Mail adalah VALID. Segala urusan permohonan akan melalui e-Mail.</span>
                 </div>
                 <div>
                   <label className={labelCls}>Pekerjaan Ibu / Bapa / Penjaga *</label>
                   <input required className={inputCls} placeholder="Guru, Peniaga, dsb." value={formData.parentJob} onChange={e => setFormData({ ...formData, parentJob: e.target.value })} />
                 </div>
               </div>

               <div>
                 <label className={labelCls}>Jumlah Pendapatan Isi Rumah *</label>
                 <select required className={inputCls} value={formData.parentIncome} onChange={e => setFormData({ ...formData, parentIncome: e.target.value })}>
                   <option>RM2,000 ke bawah</option>
                   <option>RM2,001 - RM4,000</option>
                   <option>RM4,001 - RM8,000</option>
                   <option>RM8,001 ke atas</option>
                 </select>
               </div>

               <div className="pt-6 border-t border-slate-50 mt-8">
                  <h4 className="text-[10px] font-bold text-[#1A4D50] uppercase tracking-widest mb-4">Akses Akaun Waris (Untuk Login)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Cipta Password *</label>
                      <input type="password" required className={inputCls} placeholder="Password minimum 8 aksara" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Sahkan Password *</label>
                      <input type="password" required className={inputCls} placeholder="Sahkan password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
                    </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Nama Pemohon (Anak) *</label>
                    <input required className={inputCls} placeholder="Nama penuh anak" value={formData.studentName} onChange={e => setFormData({ ...formData, studentName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>IC/MyKid Pemohon *</label>
                    <input
                      required
                      className={inputCls}
                      placeholder="Contoh: 170101114455"
                      value={formData.studentIc}
                      onChange={e => {
                        const val = e.target.value;
                        const extractedDob = extractDobFromIc(val);
                        setFormData(prev => ({
                          ...prev,
                          studentIc: val,
                          studentDob: extractedDob || prev.studentDob
                        }));
                      }}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelCls}>Tarikh Lahir Anak *</label>
                    <input type="date" required className={inputCls} value={formData.studentDob} onChange={e => setFormData({ ...formData, studentDob: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Jantina *</label>
                    <select required className={inputCls} value={formData.studentGender} onChange={e => setFormData({ ...formData, studentGender: e.target.value })}>
                      <option>Lelaki</option>
                      <option>Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Usia Pemohon *</label>
                    <select required className={inputCls} value={formData.studentAge} onChange={e => setFormData({ ...formData, studentAge: parseInt(e.target.value) })}>
                      <option value={9}>Umur - 9 Tahun</option>
                      <option value={10}>Umur - 10 Tahun</option>
                      <option value={11}>Umur - 11 Tahun</option>
                      <option value={12}>Umur - 12 Tahun</option>
                    </select>
                  </div>
               </div>

               <div>
                 <label className={labelCls}>Alamat Lengkap *</label>
                 <textarea required className={`${inputCls} min-h-[100px] h-auto py-3`} placeholder="No.Rumah/Lot Rumah/Jalan/Kampung/Poskod/Daerah/Negeri" value={formData.studentAddress} onChange={e => setFormData({ ...formData, studentAddress: e.target.value })} />
               </div>

               <div>
                 <label className={labelCls}>Negeri *</label>
                 <select required className={inputCls} value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })}>
                   <option>Terengganu</option>
                   <option>Selangor</option>
                   <option>Johor</option>
                   <option>Kelantan</option>
                   <option>Pahang</option>
                   <option>Penang</option>
                   <option>Kedah</option>
                   <option>Perlis</option>
                   <option>Perak</option>
                   <option>Negeri Sembilan</option>
                   <option>Melaka</option>
                   <option>Sabah</option>
                   <option>Sarawak</option>
                   <option>Kuala Lumpur</option>
                 </select>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-50 mt-6">
                  <div>
                    <label className={labelCls}>Permohonan Untuk Tahun *</label>
                    <select required className={inputCls} value={formData.applyYear} onChange={e => setFormData({ ...formData, applyYear: e.target.value })}>
                      <option>Permohonan 2026</option>
                      <option>Permohonan 2027</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Lokasi Memohon *</label>
                    <select required className={inputCls} value={formData.applyLocation} onChange={e => setFormData({ ...formData, applyLocation: e.target.value })}>
                      <option>AKMAL HQ - Terengganu</option>
                      <option>AKMAL SHAH ALAM - Perempuan & Lelaki (10-12 Tahun) sahaja</option>
                      <option>AKMAL PENANG - Pemohon Lelaki (10-12 Tahun)</option>
                    </select>
                    <span className={hintCls}>
                      *Permohonan Tertakluk Kepada Kekosongan Semasa.<br />
                      *AKMAL SHAH ALAM - Perempuan & Lelaki (10-12 Tahun) sahaja.<br />
                      *AKMAL PENANG - Pemohon Lelaki (10-12 Tahun).
                    </span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Adakah Anda Setuju Jika Ditempatkan Di Cawangan Lain? *</label>
                    <select required className={inputCls} value={formData.agreeOtherBranch} onChange={e => setFormData({ ...formData, agreeOtherBranch: e.target.value })}>
                      <option>SETUJU</option>
                      <option>TIDAK SETUJU</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Pilihan Tarikh Temuduga *</label>
                    <select required className={inputCls} value={formData.interviewDate} onChange={e => setFormData({ ...formData, interviewDate: e.target.value })}>
                      <option>3 JULAI 2026 (AKMAL Terengganu, Kelantan)</option>
                      <option>4 JULAI 2026 (AKMAL Shah Alam, Selangor)</option>
                      <option>5 JULAI 2026 (AKMAL Penang, Kedah)</option>
                      <option>6 JULAI 2026 (AKMAL Johor)</option>
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Tahap Bacaan Al-Quran Pemohon *</label>
                    <select required className={inputCls} value={formData.quranLevel} onChange={e => setFormData({ ...formData, quranLevel: e.target.value })}>
                      <option>Belum Pandai Membaca</option>
                      <option>Tahu Huruf Sahaja (Iqra 1-3)</option>
                      <option>Eja Merangkak (Iqra 4-6)</option>
                      <option>Lancar Membaca Al-Quran</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Dari Mana Anda Mendapat Maklumat Tentang AKMAL? *</label>
                    <select required className={inputCls} value={formData.infoSource} onChange={e => setFormData({ ...formData, infoSource: e.target.value })}>
                      <option>Dari kawan-kawan</option>
                      <option>Facebook / Media Sosial</option>
                      <option>Laman Web Rasmi</option>
                      <option>Brosur / Banner</option>
                      <option>Lain-lain</option>
                    </select>
                  </div>
               </div>

               <div>
                 <label className={labelCls}>Kenapa Anda Rasa Anda Boleh Berjaya Menjadi Hafiz Al-Quran Di AKMAL? *</label>
                 <textarea required className={`${inputCls} min-h-[100px] h-auto py-3`} placeholder="Sila berikan jawapan anda..." value={formData.successReason} onChange={e => setFormData({ ...formData, successReason: e.target.value })} />
               </div>

               <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-white rounded-2xl shadow-sm text-[#6FC7CB]"><Sparkles className="w-6 h-6" /></div>
                     <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Analisis Kelayakan Awal</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Data anda akan diproses menggunakan AI sistem untuk menentukan ranking temuduga. Pastikan semua maklumat adalah benar.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          <div className="flex gap-4 mt-12 pt-8 border-t border-slate-50">
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={() => setCurrentStep(1)} 
                className="px-8 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                KEMBALI
              </button>
            )}
            {currentStep === 1 ? (
              <button 
                type="button" 
                onClick={() => setCurrentStep(2)} 
                className="flex-1 py-4 bg-[#6FC7CB] text-white rounded-2xl font-bold hover:bg-[#5FB3B7] shadow-xl shadow-cyan-100 transition-all flex items-center justify-center gap-3"
              >
                TERUSKAN <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isLoading}
                className={`flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-100 transition-all flex items-center justify-center gap-3 ${isLoading ? 'opacity-50' : ''}`}
              >
                {isLoading ? 'MENGHANTAR...' : 'DAFTAR'} <Sparkles className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* FOOTER */}
      <div className="mt-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
        &copy; 2026 Akademi Al-Quran Amalillah — Guest Enrollment System
      </div>
    </div>
  );
}
