import React from 'react';
import { X, Download, Share2, Award, CheckCircle } from 'lucide-react';
import { AKMALLetterhead } from './AKMALLetterhead';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  achievementName: string;
  date: string;
}

export function CertificateModal({ isOpen, onClose, studentName, achievementName, date }: CertificateModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Award className="text-[#1A4D50] w-5 h-5" />
            <h3 className="font-bold text-slate-800 uppercase tracking-tight">Sijil Digital Pencapaian</h3>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={handlePrint}
               className="flex items-center gap-2 px-4 py-2 bg-[#1A4D50] text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all no-print"
             >
               <Download className="w-4 h-4" /> CETAK / SIMPAN PDF
             </button>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors no-print">
               <X className="w-6 h-6 text-slate-400" />
             </button>
          </div>
        </div>

        {/* Certificate Body (Printable Area) */}
        <div className="overflow-y-auto max-h-[80vh] bg-slate-50">
          {/* AKMAL letterhead – visible on print */}
          <div id="printable-certificate" className="certificate-paper bg-white relative shadow-xl mx-auto">
          <AKMALLetterhead docType="Sijil Penghargaan" />
          <div className="flex justify-center p-8 pt-4">
          <div className="p-1 bg-gradient-to-br from-amber-200 via-amber-100 to-amber-200 w-full max-w-2xl">
             <div className="bg-white p-12 md:p-16 border-[12px] border-double border-amber-300 relative h-full flex flex-col items-center text-center">
                
                {/* Decorative Corners */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-400 rounded-br-lg"></div>

                <div className="w-24 h-24 bg-[#1A4D50]/5 rounded-full flex items-center justify-center mb-8 border-4 border-amber-200">
                    <Award className="w-12 h-12 text-[#1A4D50]" />
                </div>

                <h1 className="text-4xl md:text-5xl font-serif text-[#1A4D50] uppercase tracking-[0.2em] mb-4">Sijil Penghargaan</h1>
                <p className="text-slate-500 italic text-lg mb-12">Dengan ini diperakui bahawa</p>

                <div className="mb-12">
                   <h2 className="text-3xl md:text-4xl font-bold text-slate-800 underline decoration-amber-400 underline-offset-8 decoration-4 uppercase mb-2">{studentName}</h2>
                   <p className="text-slate-400 font-mono text-sm uppercase tracking-widest mt-4">NAMA PELAJAR</p>
                </div>

                <p className="text-slate-600 max-w-lg leading-relaxed text-lg mb-12">
                   Telah menunjukkan kesungguhan dan kecemerlangan yang luar biasa dalam menghafal Al-Quran sehingga berjaya mencapai sasaran:
                </p>

                <div className="mb-16 py-6 px-12 bg-[#1A4D50]/5 rounded-2xl border-2 border-[#1A4D50]/20 relative">
                   <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1A4D50] text-white px-4 py-1 rounded-full text-xs font-black uppercase">MILSTONE</span>
                   <h3 className="text-2xl md:text-3xl font-black text-[#1A4D50] uppercase tracking-wider">{achievementName}</h3>
                </div>

                <div className="grid grid-cols-2 gap-20 w-full mt-auto pt-12">
                   <div className="text-center">
                      <div className="border-b-2 border-slate-300 pb-2 mb-2 font-serif text-slate-800">Murabbi Ahmad Bin Abdullah</div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">MURABBI PEMBIMBING</p>
                   </div>
                   <div className="text-center">
                      <div className="border-b-2 border-slate-300 pb-2 mb-2 font-serif text-slate-800">{new Date(date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">TARIKH PENGANUGERAHAN</p>
                   </div>
                </div>

                <div className="mt-16 text-[9px] text-slate-300 uppercase tracking-[0.5em] font-black">
                   AKADEMI TAHFIZ MAAHAD AL-AKMAL (AKMAL)
                </div>

             </div>
          </div>
          </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-8 py-4 text-center border-t border-slate-100 no-print">
            <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
               <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Sijil ini dijana secara automatik oleh Sistem AI AKMAL dan sah digunakan untuk tujuan rekod akademik dalaman.
            </p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-certificate, #printable-certificate * { visibility: visible; }
          #printable-certificate { 
            position: fixed; 
            left: 0; top: 0; 
            width: 100vw !important; 
            height: 100vh !important; 
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
        .certificate-paper {
          aspect-ratio: 1.414/1;
          width: 800px;
          max-width: 100%;
        }
      `}} />
    </div>
  );
}
