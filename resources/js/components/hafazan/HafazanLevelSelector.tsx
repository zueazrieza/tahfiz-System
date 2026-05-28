import { useState, useEffect } from 'react';
import { Check, Info, Star, Trophy, Award, Zap, Lock, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Level {
  id: string;
  name: string;
  img: string;
  description: string;
  category: 'Basic' | 'Advanced' | 'Rank' | 'Special';
  color: string;
  requirement: string;
}

const levels: Level[] = [
  { id: 'level1', name: 'Level 1', img: '/images/logo/level_1.jpeg', description: 'Permulaan perjalanan hafazan dengan fokus kepada surah-surah lazim.', category: 'Basic', color: 'from-emerald-400 to-teal-500', requirement: 'Tamat hafazan Surah-surah Lazim.' },
  { id: 'level2', name: 'Level 2', img: '/images/logo/level2.jpeg', description: 'Meningkatkan ketepatan bacaan dan kelancaran hafazan.', category: 'Basic', color: 'from-blue-400 to-indigo-500', requirement: 'Ulang balik tafsiran hafalan (Tadabbur) untuk mendapatkan badge ini.' },
  { id: 'level3', name: 'Level 3', img: '/images/logo/level3.jpeg', description: 'Memperkukuh hafazan sedia ada dengan teknik pengulangan efektif.', category: 'Basic', color: 'from-purple-400 to-fuchsia-500', requirement: 'Lancar Tasmik 3 muka surat tanpa salah.' },
  { id: 'level4', name: 'Level 4', img: '/images/logo/level4.jpeg', description: 'Penguasaan tajwid dan makhraj yang lebih mendalam.', category: 'Basic', color: 'from-rose-400 to-pink-500', requirement: 'Lulus ujian Tajwid Aras 1.' },
  { id: 'warrior', name: 'Warrior', img: '/images/logo/warrior.jpeg', description: 'Tahap pejuang yang telah membuktikan istiqamah dalam hafazan.', category: 'Rank', color: 'from-orange-400 to-red-500', requirement: 'Hafal 5 Juzuk pertama.' },
  { id: 'elite', name: 'Elite', img: '/images/logo/elite.jpeg', description: 'Golongan elit dengan kualiti hafazan yang sangat baik.', category: 'Rank', color: 'from-amber-400 to-yellow-600', requirement: 'Hafal 15 Juzuk dengan Itqan.' },
  { id: 'master', name: 'Master', img: '/images/logo/master.jpeg', description: 'Pakar hafazan yang mampu membimbing rakan-rakan lain.', category: 'Rank', color: 'from-slate-700 to-slate-900', requirement: 'Hafal 25 Juzuk & Ujian Lisan.' },
  { id: 'silver', name: 'Silver S', img: '/images/logo/level_S.jpeg', description: 'Anugerah perak atas pencapaian juzuk yang konsisten.', category: 'Special', color: 'from-slate-300 to-slate-500', requirement: 'Anugerah Khas Prestasi Bulanan.' },
  { id: 'gold', name: 'Gold G', img: '/images/logo/Level_G.jpeg', description: 'Anugerah emas bagi kecemerlangan hafazan tanpa kesilapan.', category: 'Special', color: 'from-yellow-300 to-amber-500', requirement: 'Khatam 30 Juzuk (Syahadah).' },
  { id: 'titanium', name: 'Titanium T', img: '/images/logo/level_T.jpeg', description: 'Ketahanan hafazan yang luar biasa dan sangat kukuh (Itqan).', category: 'Special', color: 'from-cyan-400 to-blue-600', requirement: 'Lulus Ujian Syahadah (10 Juzuk sekali duduk).' },
  { id: 'special', name: 'Special Edition', img: '/images/logo/level_SE.jpeg', description: 'Pencapaian luar biasa dalam tempoh yang sangat singkat.', category: 'Special', color: 'from-violet-500 to-purple-800', requirement: 'Anugerah Tokoh Huffaz AKMAL.' },
  { id: 'hafiz', name: 'Hafiz Level 1', img: '/images/logo/level_1_hafiz.jpeg', description: 'Langkah rasmi pertama dalam perjalanan menjadi Al-Hafiz 30 Juzuk.', category: 'Advanced', color: 'from-emerald-600 to-green-900', requirement: 'Memulakan perjalanan Hafiz Setahun.' },
];

interface HafazanLevelSelectorProps {
  currentRank?: string;
}

export function HafazanLevelSelector({ currentRank = 'Beginner' }: HafazanLevelSelectorProps) {
  const [hoveredLevel, setHoveredLevel] = useState<Level | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const studentId = authUser.linked_id;
    if (studentId) {
      axios.get(`/api/achievements/student/${studentId}`)
        .then(res => setEarnedAchievements(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error('Error fetching achievements', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [authUser.linked_id]);

  const categories = ['Basic', 'Advanced', 'Rank', 'Special'];

  // Helper to determine if a level is "unlocked" based on real achievements
  const isUnlocked = (levelName: string) => {
    return earnedAchievements.some(a => a.name === levelName);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
        <p className="text-gray-500">Memuatkan aras hafazan anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[50px] bg-[#1A4D50] p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-teal-100">Aras & Pencapaian Hafazan</span>
          </div>
          <h2 className="text-5xl font-black tracking-tight leading-tight">
            PERJALANAN <br /> <span className="text-teal-300">HAFIZ</span> ANDA
          </h2>
          <p className="mt-6 text-teal-100/70 text-lg font-medium leading-relaxed">
            Aras pengajian diberikan oleh Ustazah berdasarkan kualiti hafalan dan pemahaman anda. 
            Terus beristiqamah untuk membuka badge-badge kecemerlangan.
          </p>
        </div>
        <div className="absolute bottom-0 right-0 p-8 hidden lg:block">
           <Trophy className="w-48 h-48 text-white/5 -rotate-12" />
        </div>
      </div>

      {/* Level Journey Grid */}
      {categories.map((cat) => (
        <div key={cat} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200"></div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 px-4">
              {cat === 'Basic' ? 'Aras Permulaan' : cat === 'Advanced' ? 'Aras Lanjutan' : cat === 'Rank' ? 'Pangkat Kehormatan' : 'Edisi Khas'}
            </h3>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {levels.filter(l => l.category === cat).map((level) => {
              const unlocked = isUnlocked(level.name);
              return (
                <div
                  key={level.id}
                  onMouseEnter={() => setHoveredLevel(level)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  className={`group relative transition-all duration-500 rounded-[40px] overflow-hidden bg-white border border-slate-100 ${
                    unlocked ? 'hover:scale-105 hover:shadow-2xl' : 'grayscale opacity-80'
                  }`}
                >
                  {/* Background Gradient for unlocked */}
                  {unlocked && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  )}
                  
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img 
                      src={level.img} 
                      alt={level.name} 
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        unlocked && hoveredLevel?.id === level.id ? 'scale-110 rotate-2' : 'scale-100'
                      }`}
                    />
                    
                    {/* Locked Overlay */}
                    {!unlocked && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="bg-white/10 backdrop-blur-md rounded-full p-4 border border-white/20">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Unlocked Badge */}
                    {unlocked && (
                      <div className="absolute top-4 right-4 animate-in zoom-in duration-500">
                        <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                          <Check className="w-4 h-4 stroke-[4]" />
                        </div>
                      </div>
                    )}

                    {/* Category Label */}
                    <div className="absolute top-4 left-4">
                      <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">{level.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-6">
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      {level.name}
                      {!unlocked && <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">LOCKED</span>}
                    </h4>
                    <p className="mt-2 text-sm text-slate-500 font-medium line-clamp-2">{level.description}</p>
                    
                    {/* Requirement Box */}
                    <div className={`mt-4 p-4 rounded-2xl text-[10px] font-bold leading-relaxed border ${
                      unlocked ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}>
                      <p className="uppercase tracking-widest opacity-60 mb-1">Syarat Kelayakan:</p>
                      <p className="uppercase">{level.requirement}</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <button className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest hover:text-teal-700 transition-colors">
                        <Info className="w-4 h-4" /> INFO DETAIL
                      </button>
                      <div className="flex gap-2">
                        {level.category === 'Rank' && <Award className="w-5 h-5 text-amber-500" />}
                        {level.category === 'Special' && <Star className="w-5 h-5 text-purple-500" />}
                        {level.category === 'Advanced' && <Zap className="w-5 h-5 text-emerald-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Motivational Footer */}
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-12 text-center">
        <div className="max-w-xl mx-auto">
          <div className="size-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 uppercase">Terus Berusaha, Hafiz!</h3>
          <p className="mt-4 text-slate-500 font-medium leading-relaxed">
            Setiap juzuk yang dihafal membawa anda lebih dekat kepada gelaran Al-Hafiz. 
            Ustazah akan mengemaskini aras anda selepas sesi tasmik dan penilaian kualiti.
          </p>
        </div>
      </div>
    </div>
  );
}
