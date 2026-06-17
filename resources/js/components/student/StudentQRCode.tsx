import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '../../store/AppContext';
import { Download, User } from 'lucide-react';

interface StudentQRCodeProps {
  student?: any;
}

export function StudentQRCode({ student: propStudent }: StudentQRCodeProps) {
  const { state } = useAppStore();
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  
  // Use prop if provided, otherwise fallback to store logic
  const studentUser = state.users.find(u => u.name === authUser.name && u.role === 'student') ?? state.users.find(u => u.role === 'student')!;
  const student = propStudent ?? (state.students.find(s => s.id === studentUser?.linkedId) ?? state.students[0]);

  const qrValue = JSON.stringify({
    type: 'student_attendance',
    id: student?.id,
    name: student?.name
  });

  const downloadQR = () => {
    const svg = document.getElementById('student-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${student?.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-teal-900/5 animate-in zoom-in duration-500">
      <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6">
        <User className="text-teal-600" size={40} />
      </div>
      
      <h3 className="text-2xl font-black text-slate-800 mb-2">{student?.name}</h3>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">ID Pelajar: {student?.id}</p>

      <div className="p-6 bg-white rounded-3xl border-4 border-teal-500/10 shadow-inner mb-8">
        <QRCodeSVG 
          id="student-qr"
          value={qrValue} 
          size={200}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: "/images/logo.png",
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>

      <p className="text-center text-slate-500 text-sm max-w-xs mb-8 font-medium">
        Tunjukkan kod QR ini kepada Murabbi/Murabbiah untuk merekod kehadiran anda secara automatik.
      </p>

      <button 
        onClick={downloadQR}
        className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
      >
        <Download size={20} /> Simpan Kod QR
      </button>

      <div className="mt-8 flex gap-2">
        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Sistem Kehadiran Digital Akmal</p>
      </div>
    </div>
  );
}
