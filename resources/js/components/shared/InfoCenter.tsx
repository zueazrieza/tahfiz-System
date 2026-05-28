import { useState } from 'react';
import { Megaphone, Bell } from 'lucide-react';
import { Announcements } from './Announcements';
import { Notifications } from '../parent/Notifications';

export function InfoCenter() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'notifications'>('announcements');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header and Tabs */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
              activeTab === 'announcements' 
                ? 'bg-teal-50 text-teal-700 border-2 border-teal-200' 
                : 'text-slate-500 hover:bg-slate-50 border-2 border-transparent'
            }`}
          >
            <Megaphone className="w-5 h-5" />
            Pengumuman Umum
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
              activeTab === 'notifications' 
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                : 'text-slate-500 hover:bg-slate-50 border-2 border-transparent'
            }`}
          >
            <Bell className="w-5 h-5" />
            Notifikasi Peribadi
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-transparent">
        {activeTab === 'announcements' ? <Announcements /> : <Notifications />}
      </div>
    </div>
  );
}
