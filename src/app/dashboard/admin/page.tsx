'use client';
import { useState, useEffect, useCallback } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Users, Activity, Calendar, LayoutDashboard, Search, Trash2, Bell, User
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'performance' | 'doctors' | 'patients'>('patients');
  const [patientList, setPatientList] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientLoading, setPatientLoading] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean, type: 'SINGLE' | 'ALL' | null, patientId?: string, patientName?: string }>({ isOpen: false, type: null });
  const [passwordInput, setPasswordInput] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {} finally { setLoading(false); }
  };

  const fetchPatientRecords = useCallback(async (search = '') => {
    setPatientLoading(true);
    try {
      const res = await fetch(`/api/patients?all=true&q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setPatientList(data.patients);
    } catch (err) {} finally { setPatientLoading(false); }
  }, []);

  const confirmDelete = async () => {
    if (passwordInput !== 'aravind55') {
      alert("Invalid Password!");
      return;
    }
    const isAll = passwordModal.type === 'ALL';
    const endpoint = isAll ? '/api/patients/delete-all' : `/api/patients/${passwordModal.patientId}`;
    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (data.success) {
        alert(isAll ? "All patients deleted." : "Patient record deleted.");
        fetchPatientRecords(patientSearch);
      }
    } catch (err) { alert("Error deleting."); } finally {
      setPasswordModal({ isOpen: false, type: null });
      setPasswordInput('');
    }
  };

  useEffect(() => { fetchStats(); fetchPatientRecords(); }, [fetchPatientRecords]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Admin Dashboard...</div>;

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A4D68] text-white flex flex-col fixed h-full">
        <div className="p-8"><h2 className="text-2xl font-bold tracking-tight">Malar Hospital</h2></div>
        <nav className="flex-1 px-4">
          <button onClick={() => setActiveView('performance')} className={`flex items-center gap-4 w-full p-4 rounded-xl mb-2 transition ${activeView === 'performance' ? 'bg-white/10' : 'hover:bg-white/5'}`}><LayoutDashboard size={20}/> Performance</button>
          <button onClick={() => setActiveView('doctors')} className={`flex items-center gap-4 w-full p-4 rounded-xl mb-2 transition ${activeView === 'doctors' ? 'bg-white/10' : 'hover:bg-white/5'}`}><Users size={20}/> Doctors List</button>
          <button onClick={() => setActiveView('patients')} className={`flex items-center gap-4 w-full p-4 rounded-xl mb-2 transition ${activeView === 'patients' ? 'bg-white/10' : 'hover:bg-white/5'}`}><Users size={20}/> Patient Records</button>
        </nav>
        <div className="p-8 border-t border-white/10"><LogoutButton /></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-[#0A4D68] mb-2">Patient Records</h1>
            <p className="text-slate-500 flex items-center gap-2"><Calendar size={16}/> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} | Thoothukudi</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-[#E2E8F0] px-6 py-2 rounded-full text-sm font-bold text-[#0A4D68]">03:23:48 PM | EVENING SHIFT</div>
            <Bell className="text-slate-400 cursor-pointer" />
            <div className="flex items-center gap-3">
              <div className="text-right text-xs"><p className="font-bold">ADMIN</p><p className="text-slate-400">MALAR HOSPITAL</p></div>
              <div className="w-10 h-10 bg-[#0A4D68] text-white rounded-full flex items-center justify-center font-bold">A</div>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[32px] p-10 shadow-xl border border-slate-100">
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-[#0A4D68] mb-1">All Registered Patients</h3>
            <p className="text-slate-400 text-sm">{patientList.length} patients in the system</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Search name, phone, UHID..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-[#0A4D68]/20"
                value={patientSearch} onChange={e => { setPatientSearch(e.target.value); fetchPatientRecords(e.target.value); }}
              />
            </div>
            <button onClick={() => setPasswordModal({ isOpen: true, type: 'ALL' })} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition shadow-sm"><Trash2 size={24} /></button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="pb-4 px-2 text-center">UHID</th>
                <th className="pb-4 px-2">PATIENT NAME</th>
                <th className="pb-4 px-2">AGE / GENDER</th>
                <th className="pb-4 px-2">PHONE</th>
                <th className="pb-4 px-2">ADDRESS</th>
                <th className="pb-4 px-2">VISITS</th>
                <th className="pb-4 px-2">REGISTERED ON</th>
                <th className="pb-4 px-2 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patientList.map(p => (
                <tr key={p.id} className="group hover:bg-slate-50/50 transition">
                  <td className="py-4 px-2 font-mono text-[10px] text-blue-600 font-bold text-center bg-blue-50/30 rounded-lg">{p.uhid}</td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0A4D68] text-white flex items-center justify-center font-bold text-xs">{p.name.charAt(0)}</div>
                      <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-slate-500 text-sm font-medium">{p.age}Y / {p.gender}</td>
                  <td className="py-4 px-2 text-slate-500 text-sm font-medium">{p.phone}</td>
                  <td className="py-4 px-2 text-slate-400 text-xs max-w-[150px] truncate">{p.address}</td>
                  <td className="py-4 px-2"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">1 visit</span></td>
                  <td className="py-4 px-2 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <span>View →</span>
                      <button onClick={() => setPasswordModal({ isOpen: true, type: 'SINGLE', patientId: p.id, patientName: p.name })} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[32px] w-96 text-center shadow-2xl">
            <Trash2 size={48} className="mx-auto text-rose-500 mb-6" />
            <h3 className="text-2xl font-black text-slate-800 mb-2">Master Password</h3>
            <p className="text-slate-400 text-sm mb-8">{passwordModal.type === 'ALL' ? 'Delete all records?' : `Delete record for ${passwordModal.patientName}?`}</p>
            <input 
              type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6 text-center text-xl tracking-[10px] outline-none focus:ring-2 focus:ring-[#0A4D68]" 
              placeholder="••••" autoFocus onKeyDown={e => e.key === 'Enter' && confirmDelete()}
            />
            <div className="flex gap-4">
              <button onClick={() => setPasswordModal({ isOpen: false, type: null })} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
