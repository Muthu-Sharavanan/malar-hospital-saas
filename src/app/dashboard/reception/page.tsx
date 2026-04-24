'use client';
import { useState, useEffect, useCallback } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Users, UserPlus, CalendarCheck, UserRoundCheck, Stethoscope, Search, Phone, MapPin, Clock, Calendar, CheckCircle2, AlertCircle, Bell, Trash2, Printer, History, LayoutDashboard, TrendingUp, Activity, ChevronRight, X, CreditCard, FileText
} from 'lucide-react';

export default function ReceptionDashboard() {
  const [activeTab, setActiveTab] = useState('register');
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [futureQueue, setFutureQueue] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '', phone: '', age: '', gender: 'Male', address: '', doctorId: '', visitDate: '', visitTime: '', reason: '', abhaId: '', consentGranted: false
  });

  const fetchData = useCallback(async () => {
    try {
      // Fetch Today's Queue
      const qRes = await fetch('/api/register');
      const qData = await qRes.json();
      if (qData.success) setQueue(qData.visits || []);
      
      // Fetch Future Appointments
      const aRes = await fetch('/api/appointments');
      const aData = await aRes.json();
      if (aData.success) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const future = aData.visits.filter((v: any) => new Date(v.visitDate) > today);
        setFutureQueue(future);
      }

      // Fetch Doctors
      const dRes = await fetch('/api/users?role=DOCTOR');
      const dData = await dRes.json();
      if (dData.success) setDoctors(dData.users);
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert("Registration Successful! Token #" + data.visit.tokenNumber);
        setFormData({ name: '', phone: '', age: '', gender: 'Male', address: '', doctorId: '', visitDate: '', visitTime: '', reason: '', abhaId: '', consentGranted: false });
        fetchData();
        if (formData.visitDate) setActiveTab('future');
        else setActiveTab('queue');
      }
    } catch (err) { alert("Registration failed"); } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#F0F2F5]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A4D68] text-white flex flex-col fixed h-full shadow-2xl z-50">
        <div className="p-10 border-b border-white/5">
          <h2 className="text-xl font-black">Malar Hospital</h2>
          <span className="text-[10px] uppercase tracking-widest opacity-50">Reception Portal</span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <SidebarItem active={activeTab === 'register'} icon={<UserPlus size={20}/>} label="New Registration" onClick={() => setActiveTab('register')} />
          <SidebarItem active={activeTab === 'queue'} icon={<Users size={20}/>} label="Today's Queue" onClick={() => setActiveTab('queue')} />
          <SidebarItem active={activeTab === 'future'} icon={<CalendarCheck size={20}/>} label="Appointments" onClick={() => setActiveTab('future')} />
          <SidebarItem active={activeTab === 'doctors'} icon={<Stethoscope size={20}/>} label="Doctors List" onClick={() => setActiveTab('doctors')} />
        </nav>
        <div className="p-8 border-t border-white/5"><LogoutButton /></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12 lg:p-16">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-[#0A4D68]">Reception Dashboard</h1>
            <p className="text-slate-500 mt-1">Hospital Operations | Thoothukudi</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-sm font-black text-[#0A4D68]">
               {currentTime.toLocaleTimeString()} | {currentTime.getHours() < 12 ? 'MORNING' : 'EVENING'} SHIFT
            </div>
            <div className="w-12 h-12 bg-[#0A4D68] text-white rounded-2xl flex items-center justify-center font-black shadow-lg">R</div>
          </div>
        </header>

        {activeTab === 'register' && (
          <div className="bg-white rounded-[32px] p-12 shadow-xl border border-slate-100 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-3">
              <UserPlus className="text-[#0A4D68]" /> Patient Encounter Info
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Patient Name</label>
                <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-[#0A4D68]/20 transition-all" placeholder="FULL NAME" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                <input type="tel" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-[#0A4D68]/20" placeholder="+91" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Age</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Years" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                  <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold appearance-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Assign Specialist</label>
                <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" required value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Visit Date (Optional for Today)</label>
                <input type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" min={new Date().toISOString().split('T')[0]} value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} />
              </div>
              {formData.visitDate && (
                <div className="space-y-2 animate-in slide-in-from-right-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Time Slot</label>
                  <input type="time" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={formData.visitTime} onChange={e => setFormData({...formData, visitTime: e.target.value})} />
                </div>
              )}
              <div className="col-span-2 p-6 bg-[#0A4D68]/5 rounded-2xl border border-[#0A4D68]/10 flex items-center gap-4">
                <input type="checkbox" className="w-6 h-6 rounded border-none text-[#0A4D68]" checked={formData.consentGranted} onChange={e => setFormData({...formData, consentGranted: e.target.checked})} />
                <span className="text-xs font-black text-[#0A4D68] uppercase tracking-wider">Patient explicit consent granted for clinical data processing</span>
              </div>
              <div className="col-span-2 text-right pt-6">
                <button type="submit" disabled={loading} className="bg-[#0A4D68] text-white px-12 py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#0A4D68]/20 hover:scale-105 transition transform active:scale-95 disabled:opacity-50">
                  {loading ? 'Creating Token...' : 'Generate Clinical Token'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {activeTab === 'queue' && (
          <div className="bg-white rounded-[32px] p-10 shadow-xl border border-slate-100 animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Users className="text-emerald-500" /> Today's Token Queue</h2>
                <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">{queue.length} Active Patients</span>
             </div>
             <div className="grid gap-4">
                {queue.length > 0 ? queue.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-8">
                      <div className="text-3xl font-black text-[#0A4D68] bg-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm">#{v.tokenNumber}</div>
                      <div>
                        <div className="font-black text-slate-800 text-lg uppercase">{v.patient.name}</div>
                        <div className="text-xs text-slate-400 font-bold tracking-widest">{v.patient.uhid} | {v.patient.phone}</div>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-black text-slate-600 mb-1">Dr. {v.doctor?.name}</div>
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${v.status === 'CONSULTING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{v.status}</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center text-slate-300 font-bold">No patients in the queue for today.</div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'future' && (
          <div className="bg-white rounded-[32px] p-10 shadow-xl border border-slate-100 animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><CalendarCheck className="text-blue-500" /> Future Appointments</h2>
                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">{futureQueue.length} Bookings</span>
             </div>
             <div className="grid gap-4">
                {futureQueue.length > 0 ? futureQueue.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-8">
                      <div className="bg-white p-4 rounded-xl text-center shadow-sm min-w-[80px]">
                        <div className="text-[10px] font-black text-slate-400 uppercase">{new Date(v.visitDate).toLocaleDateString('en-GB', { month: 'short' })}</div>
                        <div className="text-2xl font-black text-blue-600">{new Date(v.visitDate).getDate()}</div>
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-lg uppercase">{v.patient.name}</div>
                        <div className="text-xs text-slate-400 font-bold tracking-widest">TOKEN #{v.tokenNumber} | {v.visitTime || 'No Time Set'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-black text-slate-600 mb-1">Dr. {v.doctor?.name}</div>
                       <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition">Reschedule</button>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center text-slate-300 font-bold">No future appointments found.</div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.map(doc => (
              <div key={doc.id} className="bg-white p-8 rounded-[32px] shadow-lg border border-slate-100 hover:scale-105 transition transform">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl font-black text-[#0A4D68] mb-6">{doc.name.charAt(0)}</div>
                <h3 className="text-xl font-black text-slate-800">Dr. {doc.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{doc.specialization || 'Consultant'}</p>
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${doc.isAvailable !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {doc.isAvailable !== false ? 'On Duty' : 'Off Duty'}
                  </span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 bg-slate-200 rounded-full"></div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all duration-300 ${active ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white/70'}`}>
      <div className={`${active ? 'scale-110 text-white' : 'opacity-50'} transition-transform`}>{icon}</div>
      <span className={`text-sm tracking-wide ${active ? 'font-black' : 'font-medium'}`}>{label}</span>
    </button>
  );
}
