import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  BookOpen, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Search, Globe2, ChevronRight, Loader2, Mic2, CheckCircle2, Lock
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import type { StudentView } from '../student/StudentDashboard';

// ─── Static Data ────────────────────────────────────────────────────────────

const SURAHS = [
  { id: 1,  ar: 'الفاتحة',     en: 'Al-Fatihah',     ayahs: 7,   juz: 1  },
  { id: 2,  ar: 'البقرة',      en: 'Al-Baqarah',     ayahs: 286, juz: 1  },
  { id: 3,  ar: 'آل عمران',    en: "Ali 'Imran",     ayahs: 200, juz: 3  },
  { id: 4,  ar: 'النساء',      en: "An-Nisa'",       ayahs: 176, juz: 4  },
  { id: 5,  ar: 'المائدة',     en: "Al-Ma'idah",     ayahs: 120, juz: 6  },
  { id: 6,  ar: 'الأنعام',     en: "Al-An'am",       ayahs: 165, juz: 7  },
  { id: 7,  ar: 'الأعراف',     en: "Al-A'raf",       ayahs: 206, juz: 8  },
  { id: 8,  ar: 'الأنفال',     en: 'Al-Anfal',       ayahs: 75,  juz: 9  },
  { id: 9,  ar: 'التوبة',      en: 'At-Tawbah',      ayahs: 129, juz: 10 },
  { id: 10, ar: 'يونس',        en: 'Yunus',           ayahs: 109, juz: 11 },
  { id: 11, ar: 'هود',         en: 'Hud',             ayahs: 123, juz: 11 },
  { id: 12, ar: 'يوسف',        en: 'Yusuf',           ayahs: 111, juz: 12 },
  { id: 13, ar: 'الرعد',       en: "Ar-Ra'd",        ayahs: 43,  juz: 13 },
  { id: 14, ar: 'إبراهيم',     en: 'Ibrahim',         ayahs: 52,  juz: 13 },
  { id: 15, ar: 'الحجر',       en: 'Al-Hijr',         ayahs: 99,  juz: 14 },
  { id: 16, ar: 'النحل',       en: 'An-Nahl',         ayahs: 128, juz: 14 },
  { id: 17, ar: 'الإسراء',     en: "Al-Isra'",       ayahs: 111, juz: 15 },
  { id: 18, ar: 'الكهف',       en: 'Al-Kahf',         ayahs: 110, juz: 15 },
  { id: 19, ar: 'مريم',        en: 'Maryam',          ayahs: 98,  juz: 16 },
  { id: 20, ar: 'طه',          en: 'Ta-Ha',           ayahs: 135, juz: 16 },
  { id: 21, ar: 'الأنبياء',    en: "Al-Anbiya'",     ayahs: 112, juz: 17 },
  { id: 22, ar: 'الحج',        en: 'Al-Hajj',         ayahs: 78,  juz: 17 },
  { id: 23, ar: 'المؤمنون',    en: "Al-Mu'minun",    ayahs: 118, juz: 18 },
  { id: 24, ar: 'النور',       en: 'An-Nur',          ayahs: 64,  juz: 18 },
  { id: 25, ar: 'الفرقان',     en: 'Al-Furqan',       ayahs: 77,  juz: 18 },
  { id: 26, ar: 'الشعراء',     en: "Ash-Shu'ara'",   ayahs: 227, juz: 19 },
  { id: 27, ar: 'النمل',       en: 'An-Naml',         ayahs: 93,  juz: 19 },
  { id: 28, ar: 'القصص',       en: 'Al-Qasas',        ayahs: 88,  juz: 20 },
  { id: 29, ar: 'العنكبوت',    en: "Al-'Ankabut",    ayahs: 69,  juz: 20 },
  { id: 30, ar: 'الروم',       en: 'Ar-Rum',          ayahs: 60,  juz: 21 },
  { id: 31, ar: 'لقمان',       en: 'Luqman',          ayahs: 34,  juz: 21 },
  { id: 32, ar: 'السجدة',      en: 'As-Sajdah',       ayahs: 30,  juz: 21 },
  { id: 33, ar: 'الأحزاب',     en: 'Al-Ahzab',        ayahs: 73,  juz: 21 },
  { id: 34, ar: 'سبأ',         en: "Saba'",           ayahs: 54,  juz: 22 },
  { id: 35, ar: 'فاطر',        en: 'Fatir',           ayahs: 45,  juz: 22 },
  { id: 36, ar: 'يس',          en: 'Ya-Sin',          ayahs: 83,  juz: 22 },
  { id: 37, ar: 'الصافات',     en: 'As-Saffat',       ayahs: 182, juz: 23 },
  { id: 38, ar: 'ص',           en: 'Sad',             ayahs: 88,  juz: 23 },
  { id: 39, ar: 'الزمر',       en: 'Az-Zumar',        ayahs: 75,  juz: 23 },
  { id: 40, ar: 'غافر',        en: 'Ghafir',          ayahs: 85,  juz: 24 },
  { id: 41, ar: 'فصلت',        en: 'Fussilat',        ayahs: 54,  juz: 24 },
  { id: 42, ar: 'الشورى',      en: 'Ash-Shura',       ayahs: 53,  juz: 25 },
  { id: 43, ar: 'الزخرف',      en: 'Az-Zukhruf',      ayahs: 89,  juz: 25 },
  { id: 44, ar: 'الدخان',      en: 'Ad-Dukhan',       ayahs: 59,  juz: 25 },
  { id: 45, ar: 'الجاثية',     en: 'Al-Jathiyah',     ayahs: 37,  juz: 25 },
  { id: 46, ar: 'الأحقاف',     en: 'Al-Ahqaf',        ayahs: 35,  juz: 26 },
  { id: 47, ar: 'محمد',        en: 'Muhammad',        ayahs: 38,  juz: 26 },
  { id: 48, ar: 'الفتح',       en: 'Al-Fath',         ayahs: 29,  juz: 26 },
  { id: 49, ar: 'الحجرات',     en: 'Al-Hujurat',      ayahs: 18,  juz: 26 },
  { id: 50, ar: 'ق',           en: 'Qaf',             ayahs: 45,  juz: 26 },
  { id: 51, ar: 'الذاريات',    en: 'Ad-Dhariyat',     ayahs: 60,  juz: 26 },
  { id: 52, ar: 'الطور',       en: 'At-Tur',          ayahs: 49,  juz: 27 },
  { id: 53, ar: 'النجم',       en: 'An-Najm',         ayahs: 62,  juz: 27 },
  { id: 54, ar: 'القمر',       en: 'Al-Qamar',        ayahs: 55,  juz: 27 },
  { id: 55, ar: 'الرحمن',      en: 'Ar-Rahman',       ayahs: 78,  juz: 27 },
  { id: 56, ar: 'الواقعة',     en: "Al-Waqi'ah",     ayahs: 96,  juz: 27 },
  { id: 57, ar: 'الحديد',      en: 'Al-Hadid',        ayahs: 29,  juz: 27 },
  { id: 58, ar: 'المجادلة',    en: 'Al-Mujadilah',    ayahs: 22,  juz: 28 },
  { id: 59, ar: 'الحشر',       en: 'Al-Hashr',        ayahs: 24,  juz: 28 },
  { id: 60, ar: 'الممتحنة',    en: 'Al-Mumtahanah',   ayahs: 13,  juz: 28 },
  { id: 61, ar: 'الصف',        en: 'As-Saff',         ayahs: 14,  juz: 28 },
  { id: 62, ar: 'الجمعة',      en: "Al-Jumu'ah",     ayahs: 11,  juz: 28 },
  { id: 63, ar: 'المنافقون',   en: 'Al-Munafiqun',    ayahs: 11,  juz: 28 },
  { id: 64, ar: 'التغابن',     en: 'At-Taghabun',     ayahs: 18,  juz: 28 },
  { id: 65, ar: 'الطلاق',      en: 'At-Talaq',        ayahs: 12,  juz: 28 },
  { id: 66, ar: 'التحريم',     en: 'At-Tahrim',       ayahs: 12,  juz: 28 },
  { id: 67, ar: 'الملك',       en: 'Al-Mulk',         ayahs: 30,  juz: 29 },
  { id: 68, ar: 'القلم',       en: 'Al-Qalam',        ayahs: 52,  juz: 29 },
  { id: 69, ar: 'الحاقة',      en: 'Al-Haqqah',       ayahs: 52,  juz: 29 },
  { id: 70, ar: 'المعارج',     en: "Al-Ma'arij",     ayahs: 44,  juz: 29 },
  { id: 71, ar: 'نوح',         en: 'Nuh',             ayahs: 28,  juz: 29 },
  { id: 72, ar: 'الجن',        en: 'Al-Jinn',         ayahs: 28,  juz: 29 },
  { id: 73, ar: 'المزمل',      en: 'Al-Muzzammil',    ayahs: 20,  juz: 29 },
  { id: 74, ar: 'المدثر',      en: 'Al-Muddaththir',  ayahs: 56,  juz: 29 },
  { id: 75, ar: 'القيامة',     en: 'Al-Qiyamah',      ayahs: 40,  juz: 29 },
  { id: 76, ar: 'الإنسان',     en: 'Al-Insan',        ayahs: 31,  juz: 29 },
  { id: 77, ar: 'المرسلات',    en: 'Al-Mursalat',     ayahs: 50,  juz: 29 },
  { id: 78, ar: 'النبأ',       en: "An-Naba'",        ayahs: 40,  juz: 30 },
  { id: 79, ar: 'النازعات',    en: "An-Nazi'at",      ayahs: 46,  juz: 30 },
  { id: 80, ar: 'عبس',         en: 'Abasa',           ayahs: 42,  juz: 30 },
  { id: 81, ar: 'التكوير',     en: 'At-Takwir',       ayahs: 29,  juz: 30 },
  { id: 82, ar: 'الانفطار',    en: 'Al-Infitar',      ayahs: 19,  juz: 30 },
  { id: 83, ar: 'المطففين',    en: 'Al-Mutaffifin',   ayahs: 36,  juz: 30 },
  { id: 84, ar: 'الانشقاق',    en: 'Al-Inshiqaq',     ayahs: 25,  juz: 30 },
  { id: 85, ar: 'البروج',      en: 'Al-Buruj',        ayahs: 22,  juz: 30 },
  { id: 86, ar: 'الطارق',      en: 'At-Tariq',        ayahs: 17,  juz: 30 },
  { id: 87, ar: 'الأعلى',      en: "Al-A'la",        ayahs: 19,  juz: 30 },
  { id: 88, ar: 'الغاشية',     en: 'Al-Ghashiyah',    ayahs: 26,  juz: 30 },
  { id: 89, ar: 'الفجر',       en: 'Al-Fajr',         ayahs: 30,  juz: 30 },
  { id: 90, ar: 'البلد',       en: 'Al-Balad',        ayahs: 20,  juz: 30 },
  { id: 91, ar: 'الشمس',       en: 'Ash-Shams',       ayahs: 15,  juz: 30 },
  { id: 92, ar: 'الليل',       en: 'Al-Lail',         ayahs: 21,  juz: 30 },
  { id: 93, ar: 'الضحى',       en: 'Ad-Duha',         ayahs: 11,  juz: 30 },
  { id: 94, ar: 'الشرح',       en: 'Ash-Sharh',       ayahs: 8,   juz: 30 },
  { id: 95, ar: 'التين',       en: 'At-Tin',          ayahs: 8,   juz: 30 },
  { id: 96, ar: 'العلق',       en: "Al-'Alaq",       ayahs: 19,  juz: 30 },
  { id: 97, ar: 'القدر',       en: 'Al-Qadr',         ayahs: 5,   juz: 30 },
  { id: 98, ar: 'البينة',      en: 'Al-Bayyinah',     ayahs: 8,   juz: 30 },
  { id: 99, ar: 'الزلزلة',     en: 'Az-Zalzalah',     ayahs: 8,   juz: 30 },
  { id: 100, ar: 'العاديات',   en: "Al-'Adiyat",     ayahs: 11,  juz: 30 },
  { id: 101, ar: 'القارعة',    en: "Al-Qari'ah",     ayahs: 11,  juz: 30 },
  { id: 102, ar: 'التكاثر',    en: 'At-Takathur',     ayahs: 8,   juz: 30 },
  { id: 103, ar: 'العصر',      en: "Al-'Asr",        ayahs: 3,   juz: 30 },
  { id: 104, ar: 'الهمزة',     en: 'Al-Humazah',      ayahs: 9,   juz: 30 },
  { id: 105, ar: 'الفيل',      en: 'Al-Fil',          ayahs: 5,   juz: 30 },
  { id: 106, ar: 'قريش',       en: 'Quraish',         ayahs: 4,   juz: 30 },
  { id: 107, ar: 'الماعون',    en: "Al-Ma'un",       ayahs: 7,   juz: 30 },
  { id: 108, ar: 'الكوثر',     en: 'Al-Kawthar',      ayahs: 3,   juz: 30 },
  { id: 109, ar: 'الكافرون',   en: 'Al-Kafirun',      ayahs: 6,   juz: 30 },
  { id: 110, ar: 'النصر',      en: 'An-Nasr',         ayahs: 3,   juz: 30 },
  { id: 111, ar: 'المسد',      en: 'Al-Masad',        ayahs: 5,   juz: 30 },
  { id: 112, ar: 'الإخلاص',    en: 'Al-Ikhlas',       ayahs: 4,   juz: 30 },
  { id: 113, ar: 'الفلق',      en: 'Al-Falaq',        ayahs: 5,   juz: 30 },
  { id: 114, ar: 'الناس',      en: 'An-Nas',          ayahs: 6,   juz: 30 },
];

const JUZ_LABELS: Record<number, string> = {
  1:'Al-Fatihah – Al-Baqarah', 2:'Al-Baqarah', 3:'Al-Baqarah – Ali Imran',
  4:'Ali Imran – An-Nisa', 5:"An-Nisa'", 6:"An-Nisa' – Al-Ma'idah",
  7:"Al-Ma'idah – Al-An'am", 8:"Al-An'am – Al-A'raf", 9:"Al-A'raf – Al-Anfal",
  10:'Al-Anfal – At-Tawbah', 11:'At-Tawbah – Hud', 12:'Hud – Yusuf',
  13:'Yusuf – Ibrahim', 14:'Al-Hijr – An-Nahl', 15:"Al-Isra' – Al-Kahf",
  16:'Al-Kahf – Ta-Ha', 17:"Al-Anbiya' – Al-Hajj", 18:"Al-Mu'minun – Al-Furqan",
  19:'Al-Furqan – An-Naml', 20:"An-Naml – Al-'Ankabut", 21:"Al-'Ankabut – Al-Ahzab",
  22:'Al-Ahzab – Ya-Sin', 23:'Ya-Sin – Az-Zumar', 24:'Az-Zumar – Fussilat',
  25:'Fussilat – Al-Jathiyah', 26:'Al-Ahqaf – Adh-Dhariyat', 27:'Adh-Dhariyat – Al-Hadid',
  28:'Al-Mujadilah – At-Tahrim', 29:'Al-Mulk – Al-Mursalat', 30:"An-Naba' – An-Nas",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Ayah {
  numberInSurah: number;
  text: string;
  translation?: string;
}

interface Props {
  onNavigate?: (view: StudentView) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function QuranExplorer({ onNavigate }: Props) {
  const { state } = useAppStore();
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const student = state.students?.find(s => String(s.id) === String(authUser.linked_id));
  const juzukCompleted = student?.juzukCompleted ?? student?.juzuk_completed ?? 0;

  const [mode, setMode] = useState<'overview' | 'reader'>('overview');
  const [selectedSurah, setSelectedSurah] = useState<typeof SURAHS[0] | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJuz, setFilterJuz] = useState<number | null>(null);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const filteredSurahs = SURAHS.filter(s => {
    const matchSearch = !searchQuery ||
      s.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ar.includes(searchQuery) ||
      String(s.id).includes(searchQuery);
    const matchJuz = !filterJuz || s.juz === filterJuz;
    return matchSearch && matchJuz;
  });

  const openSurah = async (surah: typeof SURAHS[0]) => {
    setSelectedSurah(surah);
    setMode('reader');
    setIsPlaying(false);
    setAyahs([]);
    setLoadingAyahs(true);

    try {
      const [arRes, msRes] = await Promise.allSettled([
        axios.get(`https://api.alquran.cloud/v1/surah/${surah.id}/quran-uthmani`),
        axios.get(`https://api.alquran.cloud/v1/surah/${surah.id}/ms.basmeih`),
      ]);

      const arAyahs = arRes.status === 'fulfilled' ? arRes.value.data.data.ayahs : [];
      const msAyahs = msRes.status === 'fulfilled' ? msRes.value.data.data.ayahs : [];

      setAyahs(arAyahs.map((a: any, i: number) => ({
        numberInSurah: a.numberInSurah,
        text: a.text,
        translation: msAyahs[i]?.text ?? '',
      })));
    } catch {
      setAyahs([]);
    } finally {
      setLoadingAyahs(false);
    }
  };

  const toggleAudio = () => {
    if (!selectedSurah) return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.oncanplay = () => setAudioLoading(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const url = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${selectedSurah.id}.mp3`;
      if (audioRef.current.src !== url) {
        audioRef.current.src = url;
        setAudioLoading(true);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Cleanup audio on unmount or surah change
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [selectedSurah]);

  const navigateSurah = (dir: 1 | -1) => {
    if (!selectedSurah) return;
    const idx = SURAHS.findIndex(s => s.id === selectedSurah.id);
    const next = SURAHS[idx + dir];
    if (next) openSurah(next);
  };

  // ─── Overview (Juzuk Grid) ─────────────────────────────────────────────────
  if (mode === 'overview') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-800 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 text-[120px] font-arabic leading-none select-none pr-4">ق</div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-emerald-300" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Powered by QUL · Tarteel AI</span>
            </div>
            <h2 className="text-2xl font-black mb-1">Penjelajah Al-Quran</h2>
            <p className="text-emerald-200 text-sm">Baca, dengar, dan fahami Al-Quran dengan teks & terjemahan Melayu</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                ✅ {juzukCompleted} / 30 Juzuk
              </span>
              <span className="bg-white/10 text-emerald-200 text-xs px-3 py-1 rounded-full">
                {Math.round((juzukCompleted / 30) * 100)}% Selesai
              </span>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari surah (nama / nombor)..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setFilterJuz(null); }}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <select
            value={filterJuz ?? ''}
            onChange={e => { setFilterJuz(e.target.value ? Number(e.target.value) : null); setSearchQuery(''); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Semua Juzuk</option>
            {Array.from({length: 30}, (_, i) => i + 1).map(j => (
              <option key={j} value={j}>Juzuk {j}</option>
            ))}
          </select>
        </div>

        {/* Juzuk Progress Grid — shown when no filter/search active */}
        {!searchQuery && !filterJuz && (
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">30 Juzuk Al-Quran</h3>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
              {Array.from({length: 30}, (_, i) => i + 1).map(juz => {
                const done = juz <= juzukCompleted;
                const current = juz === juzukCompleted + 1;
                return (
                  <button
                    key={juz}
                    onClick={() => setFilterJuz(juz)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-black transition-all shadow-sm hover:scale-105 ${
                      done    ? 'bg-emerald-500 text-white shadow-emerald-200' :
                      current ? 'bg-teal-500 text-white ring-2 ring-teal-300 shadow-teal-200' :
                                'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-[10px] opacity-70">Juz</span>
                    <span className="text-base leading-none">{juz}</span>
                    {done && <CheckCircle2 className="w-3 h-3 mt-0.5 opacity-80" />}
                    {current && <span className="text-[8px] mt-0.5 opacity-90">Semasa</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Surah List */}
        <div>
          {filterJuz && (
            <div className="mb-3 flex items-center gap-2">
              <button onClick={() => setFilterJuz(null)} className="text-xs text-emerald-600 hover:underline">← Semua Juzuk</button>
              <span className="text-xs text-gray-400">›</span>
              <span className="text-sm font-bold text-gray-700">Juzuk {filterJuz} — {JUZ_LABELS[filterJuz]}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSurahs.map(surah => {
              const surahJuzDone = surah.juz <= juzukCompleted;
              return (
                <button
                  key={surah.id}
                  onClick={() => openSurah(surah)}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all text-left group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    surahJuzDone ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {surah.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 text-sm truncate">{surah.en}</p>
                      <span className="text-xl font-arabic text-gray-700 ml-2 shrink-0">{surah.ar}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{surah.ayahs} ayah · Juzuk {surah.juz}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 shrink-0" />
                </button>
              );
            })}
            {filteredSurahs.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tiada surah dijumpai</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Reader Mode ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Reader Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => { setMode('overview'); audioRef.current?.pause(); setIsPlaying(false); }}
            className="text-xs text-emerald-600 hover:underline font-semibold"
          >
            ← Senarai Surah
          </button>
          <span className="text-gray-300">|</span>
          <div className="flex-1">
            <span className="font-black text-gray-900">{selectedSurah?.en}</span>
            <span className="ml-2 text-2xl font-arabic text-gray-700">{selectedSurah?.ar}</span>
          </div>
          <span className="text-xs text-gray-400">{selectedSurah?.ayahs} ayah · Juzuk {selectedSurah?.juz}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation */}
          <button
            onClick={() => navigateSurah(-1)}
            disabled={selectedSurah?.id === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600"
            title="Surah sebelum"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateSurah(1)}
            disabled={selectedSurah?.id === 114}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600"
            title="Surah seterusnya"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Audio */}
          <button
            onClick={toggleAudio}
            disabled={audioLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
             isPlaying    ? <Pause className="w-4 h-4" />              :
                            <Play className="w-4 h-4" />}
            {audioLoading ? 'Memuatkan...' : isPlaying ? 'Berhenti' : 'Dengar (Al-Afasy)'}
          </button>

          {/* Translation toggle */}
          <button
            onClick={() => setShowTranslation(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
              showTranslation
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            Terjemahan BM
          </button>

          {/* Practice button */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('penilaian-ai')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all ml-auto"
            >
              <Mic2 className="w-4 h-4" />
              Latih Hafazan
            </button>
          )}
        </div>
      </div>

      {/* Ayah Display */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {loadingAyahs ? (
          <div className="flex items-center justify-center py-20 gap-3 text-emerald-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Memuatkan ayat...</span>
          </div>
        ) : ayahs.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Gagal memuatkan ayat. Semak sambungan internet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {ayahs.map((ayah) => (
              <div key={ayah.numberInSurah} className="p-5 hover:bg-gray-50/50 transition-colors">
                {/* Verse number badge */}
                <div className="flex items-start justify-between mb-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black flex items-center justify-center shrink-0 mt-1">
                    {ayah.numberInSurah}
                  </span>
                </div>
                {/* Arabic text — RTL, large, clear */}
                <p
                  dir="rtl"
                  lang="ar"
                  className="text-2xl sm:text-3xl leading-loose text-gray-900 text-right font-arabic mb-3"
                  style={{ fontFamily: "'Scheherazade New', 'Amiri', 'Arabic', serif", lineHeight: '2.5' }}
                >
                  {ayah.text}
                </p>
                {/* Malay translation */}
                {showTranslation && ayah.translation && (
                  <p className="text-sm text-blue-800 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100 leading-relaxed mt-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Terjemahan</span>
                    {ayah.translation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer attribution */}
      <p className="text-center text-xs text-gray-400 pb-4">
        Teks Quran: <span className="font-semibold">api.alquran.cloud</span> ·
        Terjemahan: <span className="font-semibold">Basmeih (JAKIM)</span> ·
        Audio: <span className="font-semibold">Mishary Al-Afasy</span> ·
        Data: <span className="font-semibold">QUL · Tarteel AI</span>
      </p>
    </div>
  );
}
