import { useState, useEffect } from 'react';
import { Check, Info, Star, Trophy, Award, Zap, Lock, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Level {
  id: string;
  name: string;
  img: string;
  description: string;
  category: 'Pangkat' | 'Legend';
  color: string;
  requirement: string;
  rankNo: number;
}

const levels: Level[] = [
  // ── Pangkat Utama (0–6) ──────────────────────────────────────────────
  { id: 'tahsin',      rankNo: 0,  name: 'Tahsin',                   img: '/images/logo/warrior.jpeg',          category: 'Pangkat', color: 'from-teal-400 to-emerald-600',   description: 'Peringkat permulaan — mempelajari bacaan Al-Quran yang betul dan lancar.', requirement: 'Fasa asas tajwid & makhraj sebelum mula menghafaz.' },
  { id: 'warrior',     rankNo: 1,  name: 'Warrior',                  img: '/images/logo/warrior.jpeg',          category: 'Pangkat', color: 'from-orange-400 to-red-600',     description: 'Pejuang hafazan yang telah membuktikan istiqamah sejak awal.', requirement: 'Hafal ≥ 1 Juzuk dengan lancar.' },
  { id: 'elite',       rankNo: 2,  name: 'Elite',                    img: '/images/logo/elite.jpeg',            category: 'Pangkat', color: 'from-amber-400 to-yellow-600',   description: 'Golongan elit dengan kualiti hafazan yang konsisten dan mantap.', requirement: 'Hafal ≥ 5 Juzuk dengan Itqan.' },
  { id: 'master',      rankNo: 3,  name: 'Master',                   img: '/images/logo/master.jpeg',           category: 'Pangkat', color: 'from-slate-600 to-slate-900',    description: 'Pakar hafazan separuh Al-Quran, mampu membimbing rakan-rakan lain.', requirement: 'Hafal ≥ 10 Juzuk & lulus Ujian Lisan.' },
  { id: 'grandmaster', rankNo: 4,  name: 'Grandmaster',              img: '/images/logo/grandmaster.jpeg',      category: 'Pangkat', color: 'from-yellow-300 to-amber-600',   description: 'Grandmaster hafazan — kekuatan dan ketepatan hafazan pada tahap tertinggi.', requirement: 'Hafal ≥ 15 Juzuk dengan kualiti tinggi.' },
  { id: 'titan',       rankNo: 5,  name: 'Titan',                    img: '/images/logo/titan.jpeg',            category: 'Pangkat', color: 'from-cyan-400 to-blue-700',      description: 'Titan hafazan — ketahanan dan kedalaman hafazan yang luar biasa.', requirement: 'Hafal ≥ 20 Juzuk dengan Itqan penuh.' },
  { id: 'gladiator',   rankNo: 6,  name: 'Gladiator',                img: '/images/logo/gladiator.jpeg',        category: 'Pangkat', color: 'from-red-500 to-rose-900',       description: 'Gladiator — hampir khatam, hafazan kokoh tanpa kesilapan bererti.', requirement: 'Hafal ≥ 25 Juzuk & lulus Tasmik Mudir.' },
  // ── Peringkat Legend Al-Hafiz (7–12) ────────────────────────────────
  { id: 'legend',      rankNo: 7,  name: 'Legend Al-Hafiz',          img: '/images/logo/legend-al-hafiz.jpeg',  category: 'Legend',  color: 'from-teal-500 to-emerald-900',   description: 'Khatam 30 Juzuk. Pengiktirafan rasmi AKMAL sebagai Al-Hafiz.', requirement: 'Khatam 30 Juzuk & lulus Ujian Syahadah.' },
  { id: 'amethyst',    rankNo: 8,  name: 'Legend Al-Hafiz Amethyst', img: '/images/logo/amthyst.jpeg',          category: 'Legend',  color: 'from-violet-500 to-purple-900',  description: 'Anugerah Amethyst — kecemerlangan pasca-khatam dengan ulangan lancar.', requirement: 'Lulus Tasmik 5 Juzuk sehari tanpa salah (kali pertama).' },
  { id: 'ruby',        rankNo: 9,  name: 'Legend Al-Hafiz Ruby',     img: '/images/logo/ruby.jpeg',             category: 'Legend',  color: 'from-rose-500 to-red-900',       description: 'Anugerah Ruby — menguasai tebuk hafazan dengan cemerlang.', requirement: 'Lulus peperiksaan tebuk hafazan 60 soalan (2 juzuk/soalan).' },
  { id: 'sapphire',    rankNo: 10, name: 'Legend Al-Hafiz Sapphire', img: '/images/logo/sapphire.jpeg',         category: 'Legend',  color: 'from-blue-400 to-indigo-900',    description: 'Anugerah Sapphire — kualiti hafazan setanding pemeriksa jemputan.', requirement: 'Lulus peperiksaan tebuk 120 soalan (4 soalan/juzuk).' },
  { id: 'emerald',     rankNo: 11, name: 'Emerald Syahadah',         img: '/images/logo/emerald-syahadah.jpeg', category: 'Legend',  color: 'from-emerald-400 to-green-900',  description: 'Syahadah Emerald — pencapaian tertinggi selepas khatam.', requirement: 'Lulus semua peringkat Syahadah.' },
  { id: 'diamond',     rankNo: 12, name: 'Diamond Syahadah',         img: '/images/logo/diamond-syahadah.jpeg', category: 'Legend',  color: 'from-yellow-400 to-amber-900',   description: 'Ranking tertinggi AKMAL — Diamond Syahadah Emperor.', requirement: 'Tasmik min 5 Juzuk/hari + lulus Peperiksaan Diamond.' },
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

  const categories: Array<'Pangkat' | 'Legend'> = ['Pangkat', 'Legend'];

  // A rank is unlocked if the student has earned that achievement badge
  const isUnlocked = (level: Level) => {
    return earnedAchievements.some(a => a.name === level.name);
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
            Aras pengajian diberikan oleh Murabbiah berdasarkan kualiti hafalan dan pemahaman anda. 
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
              {cat === 'Pangkat' ? '🏅 Pangkat Utama (Tahsin → Gladiator)' : '🏆 Peringkat Legend Al-Hafiz'}
            </h3>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {levels.filter(l => l.category === cat).map((level) => {
              const unlocked = isUnlocked(level);
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
                        {level.category === 'Pangkat' && <Award className="w-5 h-5 text-amber-500" />}
                        {level.category === 'Legend' && <Star className="w-5 h-5 text-purple-500" />}
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
            Murabbiah akan mengemaskini aras anda selepas sesi tasmik dan penilaian kualiti.
          </p>
        </div>
      </div>
    </div>
  );
}
