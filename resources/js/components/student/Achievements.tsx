import { useState, useEffect } from 'react';
import { Trophy, Award, Star, Shield, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAppStore, getStudentRank, getClassLeaderboard } from '../../store/AppContext';
import { CertificateModal } from '../shared/CertificateModal';

export function Achievements() {
  const { state } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [earnedAchievements, setEarnedAchievements] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const studentUser = state.users.find(u => u.name === authUser.name && u.role === 'student') ?? state.users.find(u => u.role === 'student')!;
  const student = state.students.find(s => s.id === studentUser?.linkedId) ?? state.students[0];
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (student?.id) {
      axios.get(`/api/achievements/student/${student.id}`)
        .then(res => setEarnedAchievements(res.data))
        .catch(err => console.error('Error fetching achievements', err));

      axios.get(`/api/students/leaderboard/${student.classId || 'c1'}`)
        .then(res => setLeaderboard(res.data))
        .catch(err => console.error('Error fetching leaderboard', err));

      axios.get(`/api/students/dashboard/${student.id}`)
        .then(res => setDashboardData(res.data))
        .catch(err => {
             console.error('Error fetching dashboard data', err);
             setLoading(false);
        })
        .finally(() => setLoading(false));
    }
  }, [student?.id, student?.classId]);

  const streak = dashboardData?.streak ?? 0;
  const rank = getStudentRank(dashboardData?.juzukCompleted ?? 0);
  // leaderboard is now state-based

  // Badge definitions synced with backend
  const badges = [
    { name: 'Juzuk Opener', icon: '📖', description: 'Tamat juzuk pertama', earnedName: 'Juzuk Opener' },
    { name: 'Warrior', icon: '🛡️', description: 'Tamat 5 Juzuk', earnedName: 'Warrior' },
    { name: 'Hafiz Junior', icon: '✨', description: 'Tamat 15 Juzuk', earnedName: 'Hafiz Junior' },
    { name: 'Al-Hafiz', icon: '🏆', description: 'Tamat 30 Juzuk', earnedName: 'Al-Hafiz' },
  ];

  const specialtyAchievements = [
    { title: 'Raja Sabaq', description: 'Hafal 15+ ayat dalam sehari', icon: Award, color: 'green', earnedName: 'Raja Sabaq' },
    { title: 'Istiqamah Hafiz', description: 'Hantar rekod 7 hari berturut-turut', icon: Trophy, color: 'purple', earnedName: 'Istiqamah Hafiz' },
    { title: 'Mumtaz Award', description: '5 gred Mumtaz berturutan', icon: Star, color: 'blue', earnedName: 'Mumtaz Award' },
  ];

  const isEarned = (name: string) => earnedAchievements.some(a => a.name === name);
  const getEarnedDate = (name: string) => {
    const a = earnedAchievements.find(acc => acc.name === name);
    if (!a) return '';
    return new Date(a.earned_at).toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' });
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Memuatkan pencapaian anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-semibold text-gray-900">Achievements & Ranking</h2><p className="text-gray-600 mt-1">Your badges, awards, and class ranking</p></div>

      <div className="bg-gradient-to-br from-[#1A4D50]/5 to-teal-50 rounded-[40px] p-10 border border-teal-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img 
              src={rank.image} 
              alt={rank.name} 
              className="w-40 h-40 object-cover rounded-[32px] shadow-2xl relative z-10 border-4 border-white" 
            />
            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-xl z-20">
              <span className="text-3xl">{rank.icon}</span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-teal-600 font-black text-xs uppercase tracking-[0.3em] mb-2">PANGKAT SEMASA ANDA</p>
            <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tight">{rank.name}</h3>
            <p className="text-gray-700 mt-1">{student?.juzukCompleted ?? 0} Juzuk Diselesaikan · 🔥 {streak} hari berturutan</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                <span>Kemajuan ke {rank.nextRank}</span><span>{rank.progressToNext}%</span>
              </div>
              <div className="bg-white rounded-full h-3">
                <div className="bg-purple-600 h-3 rounded-full transition-all" style={{ width: `${rank.progressToNext}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AKMAL Badges */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem Lencana AKMAL</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map(badge => {
            const earned = isEarned(badge.earnedName);
            const date = getEarnedDate(badge.earnedName);
            const rawAchievement = earnedAchievements.find(a => a.name === badge.earnedName);

            return (
              <div 
                key={badge.name} 
                onClick={() => earned && setSelectedCert({ name: student.name, achievement: badge.name, date: rawAchievement?.earned_at || new Date().toISOString() })}
                className={`p-6 rounded-xl border-2 text-center transition-all cursor-pointer ${earned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 hover:scale-105 hover:shadow-lg' : 'bg-gray-50 border-gray-200 opacity-60 grayscale'}`}
              >
                <div className="text-5xl mb-3">{badge.icon}</div>
                <h4 className="font-semibold text-gray-900 text-lg">{badge.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                <div className="mt-3">
                  {earned
                    ? <div className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium inline-block">✓ LIHAT SIJIL</div>
                    : <div className="px-3 py-1 bg-gray-300 text-gray-600 rounded-full text-xs font-medium inline-block">🔒 Terkunci</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Achievements */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pencapaian Khas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specialtyAchievements.map((a, i) => {
            const Icon = a.icon;
            const earned = isEarned(a.earnedName);
            return (
              <div key={i} className={`p-4 rounded-lg border-2 ${earned ? colorClasses[a.color] : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-8 h-8 ${earned ? '' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{a.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                    {earned && <div className="mt-2 text-xs font-medium text-green-600">✓ Dibuka</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Class Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Papan Leder Kelas — {state.classes.find(c => c.id === student?.classId)?.name}</h3>
        <div className="space-y-2">
          {leaderboard.map(entry => (
            <div key={entry.rank} className={`flex items-center justify-between p-4 rounded-lg ${entry.id === student?.id ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' : entry.rank === 2 ? 'bg-gray-300 text-gray-700' : entry.rank === 3 ? 'bg-orange-400 text-orange-900' : 'bg-gray-200 text-gray-600'}`}>{entry.rank}</div>
                <div>
                  <p className="font-medium text-gray-900">{entry.name}{entry.id === student?.id ? ' (Anda)' : ''}</p>
                  <p className="text-sm text-gray-600">{entry.progress}</p>
                </div>
              </div>
              {entry.badge && <div className="text-2xl">{entry.badge}</div>}
            </div>
          ))}
          {leaderboard.length === 0 && <p className="text-gray-400 text-sm">Tiada rakan sekelas dijumpai.</p>}
        </div>
      </div>

      {/* Motivation */}
      <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-6 border-2 border-green-200">
        <h4 className="font-semibold text-green-900 mb-2">🌟 Anda Sangat Hebat!</h4>
        <p className="text-green-800">
          {leaderboard.findIndex(e => e.id === student?.id) === 0
            ? "Anda #1 dalam kelas! Teruskan kepimpinan! 👑"
            : `Anda #${leaderboard.findIndex(e => e.id === student?.id) + 1} dalam kelas! ${rank.progressToNext < 100 ? `Selesaikan ${Math.ceil((29 - (student?.juzukCompleted ?? 0)) * 0.3)} juzuk lagi untuk mencapai pangkat seterusnya!` : ''}`}
        </p>
      </div>

      <CertificateModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        studentName={selectedCert?.name || ''}
        achievementName={selectedCert?.achievement || ''}
        date={selectedCert?.date || ''}
      />
    </div>
  );
}
