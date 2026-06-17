import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Plus, Trash2, Send, Filter, Clock, Edit } from 'lucide-react';

export function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'General', target_audience: 'All' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const role = authUser.role || 'student';
  const canPost = role === 'admin' || role === 'teacher';

  // Determine which announcements to fetch
  const fetchTarget = role === 'admin' ? 'admin' : role === 'parent' ? 'Parents' : role === 'student' ? 'Students' : role === 'teacher' ? 'Teachers' : 'All';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/announcements', { params: { target_audience: fetchTarget } });
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Error fetching announcements', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Adakah anda pasti ingin menghantar pengumuman ini?")) {
      return;
    }
    try {
      if (editingId) {
        await axios.put(`/api/announcements/${editingId}`, {
          ...formData
        });
      } else {
        await axios.post('/api/announcements', {
          ...formData,
          author_id: authUser.id
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', content: '', type: 'General', target_audience: 'All' });
      fetchAnnouncements();
    } catch (err) {
      console.error('Error posting/updating announcement', err);
      alert('Gagal memproses pengumuman.');
    }
  };

  const handleEditClick = (ann: any) => {
    setEditingId(ann.id);
    setFormData({
      title: ann.title,
      content: ann.content,
      type: ann.type,
      target_audience: ann.target_audience
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Adakah anda pasti mahu memadam pengumuman ini?')) {
      try {
        await axios.delete(`/api/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        console.error('Error deleting announcement', err);
      }
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Academic': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Event': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-teal-100 text-teal-700 border-teal-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-teal-600" />
            Papan Pengumuman
          </h2>
          <p className="text-slate-500 font-medium mt-1">Maklumat dan kemas kini terkini dari pusat tahfiz.</p>
        </div>
        
        {canPost && (
          <button 
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
                setFormData({ title: '', content: '', type: 'General', target_audience: 'All' });
              } else {
                setShowForm(true);
              }
            }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm"
          >
            {showForm ? 'Batal' : <><Plus className="w-4 h-4" /> Hebahan Baru</>}
          </button>
        )}
      </div>

      {showForm && canPost && (
        <form onSubmit={handlePost} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 animate-in slide-in-from-top-4">
          <h3 className="font-bold text-slate-800">{editingId ? 'Kemaskini Hebahan' : 'Cipta Hebahan Baru'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tajuk</label>
              <input 
                required
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                placeholder="Contoh: Cuti Pertengahan Penggal..."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"
              >
                <option value="General">Umum</option>
                <option value="Academic">Akademik & Hafazan</option>
                <option value="Event">Aktiviti & Program</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kandungan</label>
            <textarea 
              required
              rows={4}
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500 resize-none"
              placeholder="Tulis butiran pengumuman di sini..."
            ></textarea>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sasaran Pembaca</label>
               <select 
                 value={formData.target_audience}
                 onChange={e => setFormData({...formData, target_audience: e.target.value})}
                 className="block w-48 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
               >
                 <option value="All">Semua Warga Tahfiz</option>
                 <option value="Parents">Ibu Bapa Sahaja</option>
                 <option value="Students">Pelajar Sahaja</option>
                 <option value="Teachers">Murabbi/Murabbiah Sahaja</option>
               </select>
            </div>
            
            <button type="submit" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md">
              <Send className="w-4 h-4" /> {editingId ? 'Simpan' : 'Hantar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-10 text-center text-slate-400">
           <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
           Memuatkan pengumuman...
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-50 p-12 text-center rounded-3xl border border-slate-100">
           <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
           <p className="text-slate-500 font-medium">Tiada pengumuman buat masa ini.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
               <div className="flex-1 space-y-3">
                 <div className="flex items-center gap-3">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getTypeColor(ann.type)}`}>
                     {ann.type}
                   </span>
                   <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                     <Clock className="w-3 h-3" />
                     {new Date(ann.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                   </span>
                   {canPost && (
                     <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">
                       Untuk: {
                          ann.target_audience === 'All' ? 'Semua' : 
                          ann.target_audience === 'Teachers' ? 'Murabbi/Murabbiah' : 
                          ann.target_audience === 'Students' ? 'Pelajar' : 
                          ann.target_audience === 'Parents' ? 'Ibu Bapa' : 
                          ann.target_audience
                        }
                     </span>
                   )}
                 </div>
                 
                 <h3 className="text-xl font-black text-slate-800">{ann.title}</h3>
                 <p className="text-slate-600 whitespace-pre-wrap">{ann.content}</p>
                 
                 <div className="pt-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {ann.author?.name?.charAt(0) || 'A'}
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      Oleh: {ann.author?.name || 'Admin'}
                    </span>
                 </div>
               </div>
               
               {canPost && role === 'admin' && (
                 <div className="flex-shrink-0 flex gap-2">
                   <button 
                     onClick={() => handleEditClick(ann)}
                     className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                     title="Edit Pengumuman"
                   >
                     <Edit className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => handleDelete(ann.id)}
                     className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     title="Padam Pengumuman"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                 </div>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
