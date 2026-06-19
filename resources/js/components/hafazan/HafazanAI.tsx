import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Mic, BookOpen, Eye, EyeOff, Search, Trophy, X
} from 'lucide-react';
import { VoiceRecorder } from '../shared/VoiceRecorder';

const LOCAL_CHAPTERS = [
  { id: 1, name_simple: "Al-Fatihah", name_arabic: "الفاتحة", revelation_place: "meccan", verses_count: 7 },
  { id: 2, name_simple: "Al-Baqarah", name_arabic: "البقرة", revelation_place: "medinan", verses_count: 286 },
  { id: 3, name_simple: "Ali 'Imran", name_arabic: "آل عمران", revelation_place: "medinan", verses_count: 200 },
  { id: 4, name_simple: "An-Nisa'", name_arabic: "النساء", revelation_place: "medinan", verses_count: 176 },
  { id: 5, name_simple: "Al-Ma'idah", name_arabic: "المائدة", revelation_place: "medinan", verses_count: 120 },
  { id: 6, name_simple: "Al-An'am", name_arabic: "الأنعام", revelation_place: "meccan", verses_count: 165 },
  { id: 7, name_simple: "Al-A'raf", name_arabic: "الأعراف", revelation_place: "meccan", verses_count: 206 },
  { id: 8, name_simple: "Al-Anfal", name_arabic: "الأنفال", revelation_place: "medinan", verses_count: 75 },
  { id: 9, name_simple: "At-Tawbah", name_arabic: "التوبة", revelation_place: "medinan", verses_count: 129 },
  { id: 10, name_simple: "Yunus", name_arabic: "يونس", revelation_place: "meccan", verses_count: 109 },
  { id: 11, name_simple: "Hud", name_arabic: "هود", revelation_place: "meccan", verses_count: 123 },
  { id: 12, name_simple: "Yusuf", name_arabic: "يوسف", revelation_place: "meccan", verses_count: 111 },
  { id: 13, name_simple: "Ar-Ra'd", name_arabic: "الرعد", revelation_place: "medinan", verses_count: 43 },
  { id: 14, name_simple: "Ibrahim", name_arabic: "إبراهيم", revelation_place: "meccan", verses_count: 52 },
  { id: 15, name_simple: "Al-Hijr", name_arabic: "الحجر", revelation_place: "meccan", verses_count: 99 },
  { id: 16, name_simple: "An-Nahl", name_arabic: "النحل", revelation_place: "meccan", verses_count: 128 },
  { id: 17, name_simple: "Al-Isra'", name_arabic: "الإسراء", revelation_place: "meccan", verses_count: 111 },
  { id: 18, name_simple: "Al-Kahf", name_arabic: "الكهف", revelation_place: "meccan", verses_count: 110 },
  { id: 19, name_simple: "Maryam", name_arabic: "مريم", revelation_place: "meccan", verses_count: 98 },
  { id: 20, name_simple: "Ta-Ha", name_arabic: "طه", revelation_place: "meccan", verses_count: 135 },
  { id: 21, name_simple: "Al-Anbiya'", name_arabic: "الأنبياء", revelation_place: "meccan", verses_count: 112 },
  { id: 22, name_simple: "Al-Hajj", name_arabic: "الحج", revelation_place: "medinan", verses_count: 78 },
  { id: 23, name_simple: "Al-Mu'minun", name_arabic: "المؤمنون", revelation_place: "meccan", verses_count: 118 },
  { id: 24, name_simple: "An-Nur", name_arabic: "النور", revelation_place: "medinan", verses_count: 64 },
  { id: 25, name_simple: "Al-Furqan", name_arabic: "الفرقان", revelation_place: "meccan", verses_count: 77 },
  { id: 26, name_simple: "Ash-Shu'ara'", name_arabic: "الشعراء", revelation_place: "meccan", verses_count: 227 },
  { id: 27, name_simple: "An-Naml", name_arabic: "النمل", revelation_place: "meccan", verses_count: 93 },
  { id: 28, name_simple: "Al-Qasas", name_arabic: "القصص", revelation_place: "meccan", verses_count: 88 },
  { id: 29, name_simple: "Al-'Ankabut", name_arabic: "العنكبوت", revelation_place: "meccan", verses_count: 69 },
  { id: 30, name_simple: "Ar-Rum", name_arabic: "الروم", revelation_place: "meccan", verses_count: 60 },
  { id: 31, name_simple: "Luqman", name_arabic: "لقمان", revelation_place: "meccan", verses_count: 34 },
  { id: 32, name_simple: "As-Sajdah", name_arabic: "السجدة", revelation_place: "meccan", verses_count: 30 },
  { id: 33, name_simple: "Al-Ahzab", name_arabic: "الأحزاب", revelation_place: "medinan", verses_count: 73 },
  { id: 34, name_simple: "Saba'", name_arabic: "سبأ", revelation_place: "meccan", verses_count: 54 },
  { id: 35, name_simple: "Fatir", name_arabic: "فاطر", revelation_place: "meccan", verses_count: 45 },
  { id: 36, name_simple: "Ya-Sin", name_arabic: "يس", revelation_place: "meccan", verses_count: 83 },
  { id: 37, name_simple: "As-Saffat", name_arabic: "الصافات", revelation_place: "meccan", verses_count: 182 },
  { id: 38, name_simple: "Sad", name_arabic: "ص", revelation_place: "meccan", verses_count: 88 },
  { id: 39, name_simple: "Az-Zumar", name_arabic: "الزمر", revelation_place: "meccan", verses_count: 75 },
  { id: 40, name_simple: "Ghafir", name_arabic: "غافر", revelation_place: "meccan", verses_count: 85 },
  { id: 41, name_simple: "Fussilat", name_arabic: "فصلت", revelation_place: "meccan", verses_count: 54 },
  { id: 42, name_simple: "Ash-Shura", name_arabic: "الشورى", revelation_place: "meccan", verses_count: 53 },
  { id: 43, name_simple: "Az-Zukhruf", name_arabic: "الزخرف", revelation_place: "meccan", verses_count: 89 },
  { id: 44, name_simple: "Ad-Dukhan", name_arabic: "الدخان", revelation_place: "meccan", verses_count: 59 },
  { id: 45, name_simple: "Al-Jathiyah", name_arabic: "الجاثية", revelation_place: "meccan", verses_count: 37 },
  { id: 46, name_simple: "Al-Ahqaf", name_arabic: "الأحقاف", revelation_place: "meccan", verses_count: 35 },
  { id: 47, name_simple: "Muhammad", name_arabic: "محمد", revelation_place: "medinan", verses_count: 38 },
  { id: 48, name_simple: "Al-Fath", name_arabic: "الفتح", revelation_place: "medinan", verses_count: 29 },
  { id: 49, name_simple: "Al-Hujurat", name_arabic: "الحجرات", revelation_place: "medinan", verses_count: 18 },
  { id: 50, name_simple: "Qaf", name_arabic: "ق", revelation_place: "meccan", verses_count: 45 },
  { id: 51, name_simple: "Ad-Dhariyat", name_arabic: "الذاريات", revelation_place: "meccan", verses_count: 60 },
  { id: 52, name_simple: "At-Tur", name_arabic: "الطور", revelation_place: "meccan", verses_count: 49 },
  { id: 53, name_simple: "An-Najm", name_arabic: "النجم", revelation_place: "meccan", verses_count: 62 },
  { id: 54, name_simple: "Al-Qamar", name_arabic: "القمر", revelation_place: "meccan", verses_count: 55 },
  { id: 55, name_simple: "Ar-Rahman", name_arabic: "الرحمن", revelation_place: "medinan", verses_count: 78 },
  { id: 56, name_simple: "Al-Waqi'ah", name_arabic: "الواقعة", revelation_place: "meccan", verses_count: 96 },
  { id: 57, name_simple: "Al-Hadid", name_arabic: "الحديد", revelation_place: "medinan", verses_count: 29 },
  { id: 58, name_simple: "Al-Mujadilah", name_arabic: "المجادلة", revelation_place: "medinan", verses_count: 22 },
  { id: 59, name_simple: "Al-Hashr", name_arabic: "الحشر", revelation_place: "medinan", verses_count: 24 },
  { id: 60, name_simple: "Al-Mumtahanah", name_arabic: "الممتحنة", revelation_place: "medinan", verses_count: 13 },
  { id: 61, name_simple: "As-Saff", name_arabic: "الصف", revelation_place: "medinan", verses_count: 14 },
  { id: 62, name_simple: "Al-Jumu'ah", name_arabic: "الجمعة", revelation_place: "medinan", verses_count: 11 },
  { id: 63, name_simple: "Al-Munafiqun", name_arabic: "المنافقون", revelation_place: "medinan", verses_count: 11 },
  { id: 64, name_simple: "At-Taghabun", name_arabic: "التغabun", revelation_place: "medinan", verses_count: 18 },
  { id: 65, name_simple: "At-Talaq", name_arabic: "الطلاق", revelation_place: "medinan", verses_count: 12 },
  { id: 66, name_simple: "At-Tahrim", name_arabic: "التحريم", revelation_place: "medinan", verses_count: 12 },
  { id: 67, name_simple: "Al-Mulk", name_arabic: "الملك", revelation_place: "meccan", verses_count: 30 },
  { id: 68, name_simple: "Al-Qalam", name_arabic: "القلم", revelation_place: "meccan", verses_count: 52 },
  { id: 69, name_simple: "Al-Haqqah", name_arabic: "الحاقة", revelation_place: "meccan", verses_count: 52 },
  { id: 70, name_simple: "Al-Ma'arij", name_arabic: "المعارج", revelation_place: "meccan", verses_count: 44 },
  { id: 71, name_simple: "Nuh", name_arabic: "نوح", revelation_place: "meccan", verses_count: 28 },
  { id: 72, name_simple: "Al-Jinn", name_arabic: "الجن", revelation_place: "meccan", verses_count: 28 },
  { id: 73, name_simple: "Al-Muzzammil", name_arabic: "المزمل", revelation_place: "meccan", verses_count: 20 },
  { id: 74, name_simple: "Al-Muddaththir", name_arabic: "المدثر", revelation_place: "meccan", verses_count: 56 },
  { id: 75, name_simple: "Al-Qiyamah", name_arabic: "القيامة", revelation_place: "meccan", verses_count: 40 },
  { id: 76, name_simple: "Al-Insan", name_arabic: "الإنسان", revelation_place: "medinan", verses_count: 31 },
  { id: 77, name_simple: "Al-Mursalat", name_arabic: "المرسلات", revelation_place: "meccan", verses_count: 50 },
  { id: 78, name_simple: "An-Naba'", name_arabic: "النبأ", revelation_place: "meccan", verses_count: 40 },
  { id: 79, name_simple: "An-Nazi'at", name_arabic: "النازعات", revelation_place: "meccan", verses_count: 46 },
  { id: 80, name_simple: "Abasa", name_arabic: "عبس", revelation_place: "meccan", verses_count: 42 },
  { id: 81, name_simple: "At-Takwir", name_arabic: "التكوير", revelation_place: "meccan", verses_count: 29 },
  { id: 82, name_simple: "Al-Infitar", name_arabic: "الانفطار", revelation_place: "meccan", verses_count: 19 },
  { id: 83, name_simple: "Al-Mutaffifin", name_arabic: "المطففين", revelation_place: "meccan", verses_count: 36 },
  { id: 84, name_simple: "Al-Inshiqaq", name_arabic: "الانشقاق", revelation_place: "meccan", verses_count: 25 },
  { id: 85, name_simple: "Al-Buruj", name_arabic: "البروج", revelation_place: "meccan", verses_count: 22 },
  { id: 86, name_simple: "At-Tariq", name_arabic: "الطارق", revelation_place: "meccan", verses_count: 17 },
  { id: 87, name_simple: "Al-A'la", name_arabic: "الأعلى", revelation_place: "meccan", verses_count: 19 },
  { id: 88, name_simple: "Al-Ghashiyah", name_arabic: "الغاشية", revelation_place: "meccan", verses_count: 26 },
  { id: 89, name_simple: "Al-Fajr", name_arabic: "الفجر", revelation_place: "meccan", verses_count: 30 },
  { id: 90, name_simple: "Al-Balad", name_arabic: "البلد", revelation_place: "meccan", verses_count: 20 },
  { id: 91, name_simple: "Ash-Shams", name_arabic: "الشمس", revelation_place: "meccan", verses_count: 15 },
  { id: 92, name_simple: "Al-Lail", name_arabic: "الليل", revelation_place: "meccan", verses_count: 21 },
  { id: 93, name_simple: "Ad-Duha", name_arabic: "الضحى", revelation_place: "meccan", verses_count: 11 },
  { id: 94, name_simple: "Ash-Sharh", name_arabic: "الشرح", revelation_place: "meccan", verses_count: 8 },
  { id: 95, name_simple: "At-Tin", name_arabic: "التين", revelation_place: "meccan", verses_count: 8 },
  { id: 96, name_simple: "Al-'Alaq", name_arabic: "العلق", revelation_place: "meccan", verses_count: 19 },
  { id: 97, name_simple: "Al-Qadr", name_arabic: "القدر", revelation_place: "meccan", verses_count: 5 },
  { id: 98, name_simple: "Al-Bayyinah", name_arabic: "البينة", revelation_place: "medinan", verses_count: 8 },
  { id: 99, name_simple: "Az-Zalzalah", name_arabic: "الزلزلة", revelation_place: "medinan", verses_count: 8 },
  { id: 100, name_simple: "Al-'Adiyat", name_arabic: "العاديات", revelation_place: "meccan", verses_count: 11 },
  { id: 101, name_simple: "Al-Qari'ah", name_arabic: "القارعة", revelation_place: "meccan", verses_count: 11 },
  { id: 102, name_simple: "At-Takathur", name_arabic: "التكاثر", revelation_place: "meccan", verses_count: 8 },
  { id: 103, name_simple: "Al-'Asr", name_arabic: "العصر", revelation_place: "meccan", verses_count: 3 },
  { id: 104, name_simple: "Al-Humazah", name_arabic: "الهمزة", revelation_place: "meccan", verses_count: 9 },
  { id: 105, name_simple: "Al-Fil", name_arabic: "الفيل", revelation_place: "meccan", verses_count: 5 },
  { id: 106, name_simple: "Quraish", name_arabic: "قريش", revelation_place: "meccan", verses_count: 4 },
  { id: 107, name_simple: "Al-Ma'un", name_arabic: "الماعون", revelation_place: "meccan", verses_count: 7 },
  { id: 108, name_simple: "Al-Kawthar", name_arabic: "الكوثر", revelation_place: "meccan", verses_count: 3 },
  { id: 109, name_simple: "Al-Kafirun", name_arabic: "الكافرون", revelation_place: "meccan", verses_count: 6 },
  { id: 110, name_simple: "An-Nasr", name_arabic: "النصر", revelation_place: "medinan", verses_count: 3 },
  { id: 111, name_simple: "Al-Masad", name_arabic: "المسد", revelation_place: "meccan", verses_count: 5 },
  { id: 112, name_simple: "Al-Ikhlas", name_arabic: "الإخلاص", revelation_place: "meccan", verses_count: 4 },
  { id: 113, name_simple: "Al-Falaq", name_arabic: "الفلق", revelation_place: "meccan", verses_count: 5 },
  { id: 114, name_simple: "An-Nas", name_arabic: "الناس", revelation_place: "meccan", verses_count: 6 }
];

const OFFLINE_VERSES: Record<number, string[]> = {
  1: [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "ٱلْحَمْدُ Lِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
    "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "مَٰلِكِ يَوْمِ ٱلدِّينِ",
    "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ"
  ],
  2: [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "الٓمٓ",
    "ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ",
    "ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَٰهُمْ يُنفِقُونَ"
  ],
  36: [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "يس",
    "وَالْقُرْآنِ الْحَكِيمِ",
    "إِنَّكَ لَمِنَ الْمُرْسَلِينَ",
    "عَلَىٰ صِرَاطٍ مُسْتَقِيمٍ"
  ],
  67: [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "تَبَٰرَكَ ٱلَّذِي بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    "ٱلَّذِي خَلَقَ ٱلْمَوْتَ وَٱلْحَيَٰوةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ"
  ],
  103: [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "وَالْعَصْرِ",
    "إِنَّ الْإِنسَانَ لَفِي خُسْرٍ",
    "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ"
  ],
  108: [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
    "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
    "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ"
  ],
  112: [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "قُلْ هُوَ اللَّهُ أَحَدٌ",
    "اللَّهُ الصَّمَدُ",
    "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ"
  ],
  113: [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
    "مِن شَرِّ مَا خَلَقَ",
    "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
    "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
    "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ"
  ],
  114: [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    "مَلِكِ النَّاسِ",
    "إِلَٰهِ النَّاسِ",
    "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
    "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
    "مِنَ الْجِنَّةِ وَالنَّاسِ"
  ]
};

interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
}

export function HafazanAI() {
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [hideVerses, setHideVerses] = useState(true);
  const [chapters] = useState<any[]>(LOCAL_CHAPTERS);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const studentId = String(authUser.linked_id || '');

  useEffect(() => { fetchVerses(selectedSurah); }, [selectedSurah]);

  const fetchVerses = async (surahNumber: number) => {
    try {
      const res = await axios.get(`/api/quran/verses/${surahNumber}`);
      const data = res.data.verses.map((v: any) => ({
        id: v.id,
        verse_key: v.verse_key,
        text_uthmani: v.text_uthmani,
      }));
      setVerses(data);
      setIsDropdownOpen(false);
    } catch (err) {
      console.error('Failed to fetch verses, using offline fallback.', err);
      const activeChapter = LOCAL_CHAPTERS.find(c => c.id === surahNumber)!;
      const offlineTexts = OFFLINE_VERSES[surahNumber];
      const mockArabicText = offlineTexts || [
        "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        `قِرَاءَةُ سُورَةِ ${activeChapter.name_arabic} - الآيَةُ الثَّانِيَةُ`,
        `تِلَاوَةٌ طَيِّبَةٌ مِنْ سُورَةِ ${activeChapter.name_arabic}`,
        `حِفْظُ سُورَةِ ${activeChapter.name_arabic}`
      ];
      const count = offlineTexts ? offlineTexts.length : Math.min(activeChapter.verses_count, 4);
      const mockVerses: Verse[] = Array.from({ length: count }, (_, i) => ({
        id: surahNumber * 1000 + i + 1,
        verse_key: `${surahNumber}:${i + 1}`,
        text_uthmani: mockArabicText[i] || `آيَةٌ كَرِيمَةٌ مِنْ سُورَةِ ${activeChapter.name_arabic} عَدَدُهَا ${i + 1}`
      }));
      setVerses(mockVerses);
      setIsDropdownOpen(false);
    }
  };

  const filteredChapters = chapters.filter(c =>
    c.name_simple.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toString() === searchTerm
  );
  const currentChapter = chapters.find(c => c.id === selectedSurah);
  const firstAyat = verses[0]?.verse_key.split(':')[1];
  const lastAyat = verses[verses.length - 1]?.verse_key.split(':')[1];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-[#1A4D50] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-3xl backdrop-blur-xl flex items-center justify-center border border-white/20">
            <Mic className="w-8 h-8 text-teal-200" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight uppercase">LATIHAN HAFAZAN</h2>
            <p className="text-teal-100/60 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">RAKAM BACAAN & HAFAL DENGAN AYAT AL-QURAN • AKMAL</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 mt-6 md:mt-0">
          <button
            onClick={() => setIsDropdownOpen(true)}
            className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 font-bold text-white flex items-center gap-3 hover:bg-white/20 transition-all min-w-[220px]"
          >
            <BookOpen className="w-4 h-4 text-teal-300" />
            {currentChapter ? `${currentChapter.id}. ${currentChapter.name_simple}` : 'Pilih Surah...'}
            <Search className="w-4 h-4 opacity-50 ml-auto" />
          </button>
          <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
          <button
            onClick={() => setHideVerses(!hideVerses)}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-bold text-sm shrink-0"
          >
            {hideVerses ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {hideVerses ? 'PAPARKAN AYAT' : 'SOROK AYAT'}
          </button>
        </div>
      </div>

      {/* ── Surah Selection Modal ── */}
      {isDropdownOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl" onClick={() => setIsDropdownOpen(false)} />
          <div className="relative w-full max-w-4xl bg-white/80 backdrop-blur-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300 border border-white/20">
            <div className="p-8 bg-black/5 border-b border-black/5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Pilih Surah Hafazan</h3>
                <p className="text-slate-600 font-bold text-xs uppercase tracking-widest opacity-60">Eksplorasi 114 Surah Al-Quran</p>
              </div>
              <button onClick={() => setIsDropdownOpen(false)} className="p-3 hover:bg-black/10 rounded-2xl transition-all">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <div className="p-8 bg-transparent border-b border-black/5">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-[#1A4D50] transition-colors" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Cari nama surah atau nombor..."
                  className="w-full bg-white/40 backdrop-blur-md border border-white/20 rounded-[24px] pl-16 pr-8 py-5 text-lg font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-[#1A4D50]/10 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-transparent">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChapters.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedSurah(c.id)}
                    className={`group p-5 rounded-3xl cursor-pointer border transition-all flex items-center justify-between ${
                      selectedSurah === c.id
                        ? 'bg-[#1A4D50] border-[#1A4D50] text-white shadow-xl'
                        : 'bg-white/40 border-white/20 hover:bg-white/60 hover:border-[#1A4D50]/30 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-400">{c.id}</div>
                      <div>
                        <h4 className="font-black text-sm uppercase">{c.name_simple}</h4>
                        <p className="text-[10px] opacity-60 uppercase">
                          {c.revelation_place === 'meccan' ? 'MAKKIYAH' : 'MADANIYAH'} · {c.verses_count} AYAT
                        </p>
                      </div>
                    </div>
                    <span className="font-serif text-xl opacity-60">{c.name_arabic}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Verse display ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl min-h-[500px]">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
              <h3 className="font-serif text-2xl text-slate-400">{currentChapter?.name_arabic}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Surah {selectedSurah}</span>
                <Search className="w-4 h-4 text-slate-300" />
              </div>
            </div>

            <div className="space-y-12 text-center">
              {verses.map((v) => (
                <div key={v.id} className="relative">
                  <span className={`text-4xl md:text-5xl font-serif leading-[1.8] block transition-all duration-700 select-none text-slate-800 ${
                    hideVerses ? 'blur-xl opacity-20 pointer-events-none' : 'opacity-100'
                  }`}>
                    {v.text_uthmani}
                    <span className="text-xl md:text-2xl text-[#1A4D50]/30 mr-4 font-mono">
                      ﴿{v.verse_key.split(':')[1]}﴾
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {hideVerses && verses.length > 0 && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setHideVerses(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A4D50]/10 hover:bg-[#1A4D50]/20 text-[#1A4D50] rounded-2xl font-bold text-sm transition-all"
                >
                  <Eye className="w-4 h-4" /> Intai Ayat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-6">

          {/* KAWALAN BACAAN */}
          <div className="bg-[#1A4D50] rounded-[40px] p-8 text-white shadow-2xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-teal-100">
              <Mic className="w-5 h-5" /> KAWALAN BACAAN
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setHideVerses(!hideVerses)}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                {hideVerses
                  ? <><Eye className="w-4 h-4" /> INTAI AYAT</>
                  : <><EyeOff className="w-4 h-4" /> SOROK AYAT</>}
              </button>
              {currentChapter && (
                <div className="text-center p-4 bg-white/5 rounded-2xl">
                  <p className="text-white font-bold text-sm">{currentChapter.name_simple}</p>
                  <p className="text-white/40 text-xs mt-0.5 font-serif">{currentChapter.name_arabic}</p>
                  <p className="text-teal-300/60 text-[10px] mt-1 uppercase tracking-widest">{currentChapter.verses_count} Ayat</p>
                </div>
              )}
              {savedCount > 0 && (
                <p className="text-center text-green-300 text-xs font-bold pt-1">
                  ✓ {savedCount} rakaman tersimpan sesi ini
                </p>
              )}
            </div>
          </div>

          {/* Voice Recorder */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Rakam Bacaan Anda</p>
            <VoiceRecorder
              studentId={studentId}
              surah={currentChapter?.name_simple}
              ayatFrom={firstAyat}
              ayatTo={lastAyat}
              recordedBy="student"
              onSaved={() => setSavedCount(c => c + 1)}
            />
          </div>

          {/* CABARAN HARIAN */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[40px] p-8 border border-amber-100 shadow-sm">
            <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-600" /> CABARAN HARIAN
            </h4>
            <p className="text-sm text-amber-700 leading-relaxed font-medium">Hafal Surah Al-Mulk tanpa sebarang kesilapan hari ini untuk mendapatkan lencana!</p>
            <button className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-full text-xs font-black">SERTAI SEKARANG</button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
}
