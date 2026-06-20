import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/AppContext';
import { User, Teacher, Student } from '../../store/mockData';
import axios from 'axios';

interface ProfileViewProps {
  userId: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId }) => {
  const { state, dispatch } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);

  // Local state for editing fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    wage: 0,
    icNo: '',
    qualification: '',
    experience: '',
    educationBackground: '',
    intakeDate: '',
    dob: '',
    pob: '',
    race: '',
    religion: '',
    gender: 'M' as 'M' | 'F',
    bloodType: '',
    maritalStatus: '',
    citizenship: '',
    familyIncome: '',
    medicalHistory: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    // Detailed Parent Profile
    relation: '',
    postcode: '',
    city: '',
    district: '',
    stateName: '',
    country: '',
    parliament: '',
    job: '',
    sector: '',
    officePhone: '',
    childCount: 0,
    reference: '',
    // Murabbi Fields
    serviceStartDate: '',
    residence: '',
    dependentsCount: 0,
    // Account Security
    username: '',
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const MALAYSIA_STATES = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 
    'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya'
  ];

  const MALAYSIA_PARLIAMENTS = [
    'P.001 Padang Besar', 'P.002 Kangar', 'P.003 Arau', 'P.092 Sabak Bernam', 'P.093 Sungai Besar',
    'P.094 Hulu Selangor', 'P.095 Tanjong Karang', 'P.096 Kuala Selangor', 'P.097 Selayang',
    'P.098 Gombak', 'P.101 Hulu Langat', 'P.102 Bangi', 'P.103 Puchong', 'P.104 Subang',
    'P.105 Petaling Jaya', 'P.106 Damansara', 'P.107 Sungai Buloh', 'P.108 Shah Alam',
    'P.109 Kapar', 'P.110 Klang', 'P.111 Kota Raja', 'P.112 Kuala Langat', 'P.113 Sepang'
  ].sort();

  const CITIZENSHIP_OPTIONS = [
    { value: 'MAL', label: 'WARGANEGARA (MALAYSIA)' },
    { value: 'NON-MAL', label: 'BUKAN WARGANEGARA' },
    { value: 'PR', label: 'PEMASTAUTIN TETAP (PR)' },
  ];

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const resp = await axios.get('/api/profile');
      const u = resp.data;
      setUser(u);
      
      const tData = u.teacher_data || null;
      const sData = u.student_data || null;
      setTeacher(tData);
      setStudent(sData);

      // ParentProfile sub-record
      const pData = u.parent_data || null;

      setFormData({
        name: u.full_name || u.name || '',
        email: u.email || '',
        phone: u.phone || tData?.phone || sData?.phone || pData?.phone || '',
        address: sData?.address || pData?.address || '',
        wage: u.wage || pData?.income || 0,
        icNo: tData?.ic_no || sData?.ic_no || pData?.ic_no || '',
        qualification: tData?.qualification || '',
        experience: tData?.experience || '',
        educationBackground: sData?.education_background || '',
        intakeDate: sData?.intake || '',
        dob: sData?.dob || '',
        pob: sData?.pob || '',
        race: sData?.race || '',
        religion: sData?.religion || '',
        gender: ((sData?.gender || tData?.gender) as any) || 'M',
        bloodType: sData?.blood_type || '',
        maritalStatus: sData?.marital_status || '',
        citizenship: sData?.citizenship || 'MAL',
        familyIncome: sData?.family_income || '',
        medicalHistory: tData?.medical_history || sData?.medical_history || '',
        emergencyContactName: tData?.emergency_contact_name || sData?.emergency_contact_name || '',
        emergencyContactPhone: tData?.emergency_contact_phone || sData?.emergency_contact_phone || '',
        // Parent detailed profile
        relation: pData?.relationship_type || '',
        postcode: pData?.postcode || '',
        city: pData?.city || '',
        district: pData?.district || '',
        stateName: pData?.state_name || '',
        country: pData?.country || 'MAL',
        parliament: pData?.parliament || '',
        job: pData?.occupation || u.job || '',
        sector: pData?.sector || '',
        officePhone: pData?.office_phone || '',
        childCount: pData?.child_count || 0,
        reference: pData?.reference || '',
        // Murabbi
        serviceStartDate: tData?.service_start_date || '',
        residence: tData?.residence || '',
        dependentsCount: tData?.dependents_count || 0,
        // Account Security
        username: u.name || '',
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!confirm('Adakah anda pasti ingin menyimpan perubahan profil anda?')) {
      return;
    }
    try {

      const payload = {
        ...formData,
        name: formData.username,    // login username → users.name
        full_name: formData.name,   // display name  → users.full_name
      };
      await axios.post('/api/profile', payload);
      
      // Update local state and global context
      dispatch({
        type: 'EDIT_USER',
        payload: { id: user.id, ...payload }
      });
      
      if (teacher) {
        dispatch({
          type: 'EDIT_TEACHER',
          payload: { id: teacher.id, ...payload }
        });
      }

      alert('Profil berjaya disimpan ke pangkalan data.');
      setIsEditing(false);
      fetchProfile(); // Refresh
    } catch (err: any) {
      console.error('Failed to save profile', err);
      alert('Gagal menyimpan profil: ' + (err.response?.data?.message || 'Ralat sambungan.'));
    }
  };

  if (loading) return <div className="p-8 text-slate-500 flex items-center gap-2"><div className="w-5 h-5 border-2 border-[#6FC7CB] border-t-transparent rounded-full animate-spin"></div> Memuatkan profil...</div>;
  if (!user) return <div className="p-8 text-slate-500">Log masuk untuk melihat profil.</div>;

  const renderField = (label: string, value: string | number, name: string, type: string = 'text', readOnly: boolean = false) => (
    <div className="border-b border-slate-100 py-3.5 flex flex-col md:flex-row md:items-center">
      <span className="w-full md:w-1/3 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">{label}</span>
      <div className="w-full md:w-2/3">
        {isEditing && !readOnly ? (
          type === 'select' ? (
            <select
              value={value}
              onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[15px] focus:ring-2 focus:ring-[#6FC7CB] outline-none"
            >
              {name === 'gender' ? (
                <>
                  <option value="M">LELAKI (M)</option>
                  <option value="F">PEREMPUAN (F)</option>
                </>
              ) : name === 'maritalStatus' ? (
                <>
                  <option value="">-- Sila Pilih --</option>
                  <option value="BUJANG">BUJANG</option>
                  <option value="BERKAHWIN">BERKAHWIN</option>
                  <option value="DUDA/BALU">DUDA/BALU</option>
                </>
              ) : name === 'stateName' ? (
                <>
                  <option value="">-- Pilih Negeri --</option>
                  {MALAYSIA_STATES.map(s => <option key={s} value={s.toUpperCase()}>{s.toUpperCase()}</option>)}
                </>
              ) : name === 'parliament' ? (
                <>
                  <option value="">-- Pilih Parlimen --</option>
                  {MALAYSIA_PARLIAMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                </>
              ) : name === 'citizenship' ? (
                <>
                  {CITIZENSHIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </>
              ) : null}
            </select>
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[15px] focus:ring-2 focus:ring-[#6FC7CB] outline-none transition-all"
            />
          )
        ) : (
          <span className="text-slate-700 font-medium text-[15px]">{value || <span className="text-slate-300 italic">Tiada Maklumat</span>}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-width-1200 mx-auto">
        
        {/* Page Title & Subtitle like AI page */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            Profil Saya — <span className="text-slate-500 font-medium">{user.name.toLowerCase()}</span>
          </h2>
          <p className="text-slate-500 mt-2 text-[15px] leading-relaxed">
            Urus maklumat peribadi, latar belakang pendidikan, dan tetapan kecemasan dalam satu portal berpusat.
          </p>
        </div>

        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6FC7CB] to-[#5FB3B7] p-1 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{user.name}</h1>
              <p className="text-slate-400 font-semibold text-[13px] uppercase tracking-wider">
                {user.role === 'teacher' ? 'Murabbi' : user.role} • ID: {user.linked_id || user.id}
              </p>
            </div>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              isEditing 
              ? 'bg-[#6FC7CB] text-white hover:bg-[#5FB3B7] shadow-lg shadow-cyan-100' 
              : 'border-2 border-[#6FC7CB] text-[#6FC7CB] hover:bg-[#E8F6F7]'
            }`}
          >
            {isEditing ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                SIMPAN PROFIL
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                EDIT PROFIL
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-[#6FC7CB]"></div>
               <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <span className="text-[#6FC7CB]">●</span> PERSONAL INFORMATION
               </h2>
               
               <div className="space-y-1">
                 {student && renderField('Student ID', user.linked_id || user.id, 'linkedId', 'text', true)}
                 {user.role === 'parent' && user.children ? (
                    <div className="border-b border-slate-100 py-3.5 flex flex-col md:flex-row md:items-center">
                      <span className="w-full md:w-1/3 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Nama Anak-anak</span>
                      <div className="w-full md:w-2/3 flex flex-wrap gap-2">
                        {user.children.map((c: any) => (
                          <span key={c.id} className="bg-cyan-50 text-[#6FC7CB] px-3 py-1 rounded-full text-xs font-bold border border-cyan-100 uppercase">{c.name}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    renderField(user.role === 'teacher' ? 'Nama Penuh' : 'Nama Pelajar', formData.name, 'name', 'text', true)
                  )}
                 {(teacher || student) && renderField('IC/Passport No.', formData.icNo, 'icNo', 'text', true)}
                 {student && (
                   <>
                     {renderField('Gender', formData.gender, 'gender', 'select')}
                     {renderField('Marital Status', formData.maritalStatus, 'maritalStatus', 'select')}
                     {renderField('Blood Type', formData.bloodType, 'bloodType')}
                     {renderField('Date of Birth', formData.dob, 'dob', 'date')}
                     {renderField('Place of Birth', formData.pob, 'pob')}
                     {renderField('Citizenship', formData.citizenship, 'citizenship', 'select')}
                     {renderField('Race', formData.race, 'race')}
                     {renderField('Religion', formData.religion, 'religion')}
                     {renderField('Family Income', formData.familyIncome, 'familyIncome')}
                     {renderField('Intake Date', formData.intakeDate || student.enrolledDate, 'intakeDate', 'text', true)}
                   </>
                 )}
                 {teacher && (
                   <>
                     {renderField('Jantina', formData.gender, 'gender', 'select')}
                     {renderField('Berkhidmat Sejak', formData.serviceStartDate, 'serviceStartDate', 'date')}
                     {renderField('Tempat Tinggal', formData.residence, 'residence')}
                     {renderField('Bilangan Tanggungan', formData.dependentsCount, 'dependentsCount', 'number')}
                     {renderField('Kelayakan', formData.qualification, 'qualification')}
                     {renderField('Pengalaman Mengajar (Tahun)', formData.experience, 'experience')}
                   </>
                 )}
               </div>
            </div>

            {/* Medical & Emergency Section */}
            {user.role !== 'parent' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400"></div>
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="text-red-400">●</span> MEDICAL & EMERGENCY
                </h2>
                
                <div className="space-y-1">
                    {renderField('Maklumat Kesihatan (Alergi dll)', formData.medicalHistory, 'medicalHistory')}
                    <div className="pt-4 mt-4 border-t border-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Hubungi Semasa Kecemasan</p>
                      {renderField('Nama Waris', formData.emergencyContactName, 'emergencyContactName')}
                      {renderField('No. Telefon Waris', formData.emergencyContactPhone, 'emergencyContactPhone')}
                    </div>
                </div>
              </div>
            )}

            {/* Financial / Professional Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-[#5FB3B7]"></div>
               <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <span className="text-[#5FB3B7]">●</span> {user.role === 'teacher' ? 'PROFESSIONAL' : user.role === 'parent' ? 'FINANCIAL' : 'ACADEMIC'} DETAILS
               </h2>
               
               <div className="space-y-1">
                 {user.role === 'teacher' && (
                   <>
                      {renderField('Berkhidmat Sejak', formData.serviceStartDate, 'serviceStartDate', 'date', true)}
                      {renderField('Kelayakan', formData.qualification, 'qualification')}
                      {renderField('Pengalaman (Tahun)', formData.experience, 'experience')}
                   </>
                 )}
                 {user.role === 'parent' && (
                   <>
                     {renderField('Pendapatan Bulanan (RM)', formData.wage, 'wage', 'number')}
                   </>
                 )}
                 {student && (
                   <>
                     {renderField('Tarikh Kemasukan', formData.intakeDate || student.enrolledDate, 'intakeDate', 'text', true)}
                     {renderField('Kumpulan Darah', formData.bloodType, 'bloodType')}
                   </>
                 )}
               </div>
            </div>

            {/* Parent Registry - Detailed (Only for parents) */}
            {user.role === 'parent' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#3b82f6]"></div>
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="text-[#3b82f6]">●</span> HOUSEHOLD & EMPLOYMENT
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {renderField('Hubungan', formData.relation, 'relation')}
                  {renderField('Pekerjaan', formData.job, 'job')}
                  {renderField('Sektor', formData.sector, 'sector')}
                  {renderField('Gaji/Pendapatan Bulanan', formData.wage, 'wage', 'number')}
                  {renderField('No. Tel Pejabat', formData.officePhone, 'officePhone')}
                  {renderField('Jumlah Anak', formData.childCount, 'childCount', 'number')}
                  {renderField('Rujukan', formData.reference, 'reference')}
                </div>
                
                <div className="pt-6 mt-6 border-t border-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Butiran Alamat & Parlimen</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {renderField('Poskod', formData.postcode, 'postcode')}
                    {renderField('Bandar', formData.city, 'city')}
                    {renderField('Daerah (Kod)', formData.district, 'district')}
                    {renderField('Negeri (Kod)', formData.stateName, 'stateName', 'select')}
                    {renderField('Negara', formData.country, 'country')}
                    {renderField('Parlimen', formData.parliament, 'parliament', 'select')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Details Sidebar */}
          <div className="space-y-8">
             <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
               <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <span className="text-amber-400">●</span> ACCOUNT SECURITY
               </h2>
               
               <div className="space-y-1">
                 {renderField('Username (Login ID)', formData.username, 'username')}
                 {isEditing && (
                   <div className="mt-6 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                     <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4">Tukar Kata Laluan</p>
                     {renderField('Kata Laluan Semasa', formData.current_password, 'current_password', 'password')}
                     {renderField('Kata Laluan Baharu', formData.password, 'password', 'password')}
                     {renderField('Sahkan Kata Laluan', formData.password_confirmation, 'password_confirmation', 'password')}
                     <p className="mt-4 text-[11px] text-amber-500 italic leading-relaxed">
                       * Biarkan kosong jika tidak mahu menukar kata laluan. Kata laluan baharu mestilah sekurang-kurangnya 8 aksara.
                     </p>
                   </div>
                 )}
                 {!isEditing && (
                   <div className="border-b border-slate-100 py-3.5 flex flex-col md:flex-row md:items-center">
                     <span className="w-full md:w-1/3 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Password</span>
                     <span className="text-slate-400 font-medium text-[15px]">********</span>
                   </div>
                 )}
               </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-300"></div>
               <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <span className="text-slate-300">●</span> CONTACT DETAILS
               </h2>
               
               <div className="space-y-1">
                 {renderField('Email', formData.email, 'email', 'email')}
                 {renderField('No. Telefon', formData.phone, 'phone')}
                 {renderField('Alamat', formData.address, 'address')}
               </div>
            </div>

            {/* Quick Status */}
            <div className="bg-gradient-to-br from-[#6FC7CB] to-[#5FB3B7] rounded-3xl p-8 text-white shadow-lg shadow-cyan-50">
               <h3 className="font-bold text-lg mb-4 opacity-100">Status Akaun</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center opacity-90">
                   <span className="text-sm">Taraf</span>
                   <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                     {user.role === 'teacher' ? 'Murabbi' : user.role}
                   </span>
                 </div>
                 <div className="flex justify-between items-center opacity-90">
                   <span className="text-sm">Status</span>
                   <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">AKTIF</span>
                 </div>
               </div>
               
               <div className="mt-8 pt-6 border-t border-white/20 text-center">
                 <p className="text-xs opacity-80 mb-2">Terakhir dikemas kini</p>
                 <p className="text-sm font-bold">{new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
