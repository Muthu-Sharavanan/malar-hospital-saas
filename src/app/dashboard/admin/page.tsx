'use client';
import { useState, useEffect, useCallback } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Users, Activity, Calendar, LayoutDashboard, FileText, Settings, Bell, Search, ChevronLeft, ChevronRight, UserSquare2, X, Clock, Stethoscope, Trash2, CheckCircle, FlaskConical, ArrowUpRight, ArrowDownRight, TrendingDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeView, setActiveView] = useState<'performance' | 'doctors' | 'patients'>('performance');
  const [doctorList, setDoctorList] = useState<any[]>([]);
  const [patientList, setPatientList] = useState<any[]>([]);
  const [patientTotal, setPatientTotal] = useState(0);
  const [patientPage, setPatientPage] = useState(1);
  const [patientTotalPages, setPatientTotalPages] = useState(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientLoading, setPatientLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPatient, setHistoryPatient] = useState<any>(null);
  const [historyVisits, setHistoryVisits] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean, type: 'SINGLE' | 'ALL' | null, patientId?: string, patientName?: string }>({ isOpen: false, type: null });
  const [passwordInput, setPasswordInput] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {} finally { setLoading(false); }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/users?role=DOCTOR');
      const data = await res.json();
      if (data.success) setDoctorList(data.users);
    } catch (err) {}
  };

  const fetchPatientRecords = useCallback(async (page = 1, search = '') => {
    setPatientLoading(true);
    try {
      const res = await fetch(`/api/patients?all=true&page=${page}&q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setPatientList(data.patients);
        setPatientTotal(data.total);
        setPatientPage(data.page);
        setPatientTotalPages(data.totalPages);
      }
    } catch (err) {} finally { setPatientLoading(false); }
  }, []);

  const handleDeletePatient = (patientId: string, patientName: string) => {
    setPasswordModal({ isOpen: true, type: 'SINGLE', patientId, patientName });
  };

  const handleDeleteAllPatients = () => {
    setPasswordModal({ isOpen: true, type: 'ALL' });
  };

  const confirmDelete = async () => {
    if (!passwordInput) return;
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
        alert(isAll ? "All patients deleted." : "Patient deleted.");
        fetchPatientRecords(1, '');
      } else { alert("Error: " + data.error); }
    } catch (err) { alert("Delete failed"); } finally {
      setPasswordModal({ isOpen: false, type: null });
      setPasswordInput('');
    }
  };

  const fetchPatientHistory = async (patient: any) => {
    setHistoryPatient(patient);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/history`);
      const data = await res.json();
      if (data.success) setHistoryVisits(data.history);
    } catch (err) {} finally { setHistoryLoading(false); }
  };

  useEffect(() => {
    fetchStats(); fetchDoctors();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (activeView === 'patients') fetchPatientRecords(1, patientSearch); }, [activeView, fetchPatientRecords]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">Loading Malar Systems...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed' }}>
        <div style={{ padding: '40px 30px' }}><h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Malar Hospital</h2></div>
        <nav style={{ flexGrow: 1 }}>
          <SidebarItem active={activeView === 'performance'} icon={<LayoutDashboard size={20} />} label="Performance" onClick={() => setActiveView('performance')} />
          <SidebarItem active={activeView === 'doctors'} icon={<Users size={20} />} label="Doctors List" onClick={() => setActiveView('doctors')} />
          <SidebarItem active={activeView === 'patients'} icon={<UserSquare2 size={20} />} label="Patient Records" onClick={() => setActiveView('patients')} />
        </nav>
        <div style={{ padding: '30px' }}><LogoutButton /></div>
      </aside>

      <main style={{ flex: 1, marginLeft: '240px', padding: '60px 80px' }}>
        <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between' }}>
          <div><h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0A4D68' }}>{activeView === 'patients' ? 'Patient Records' : 'System Overview'}</h1></div>
          <div style={{ background: '#E2E8F0', padding: '10px 25px', borderRadius: '50px' }}>{currentTime.toLocaleTimeString()}</div>
        </header>

        {activeView === 'patients' ? (
          <div className="glass-card">
            <div className="flex justify-between mb-8">
              <h3 className="text-xl font-bold">All Patients</h3>
              <div className="flex gap-4">
                <input type="text" placeholder="Search..." className="p-2 border rounded" value={patientSearch} onChange={e => { setPatientSearch(e.target.value); fetchPatientRecords(1, e.target.value); }} />
                <button onClick={handleDeleteAllPatients} className="p-2 bg-rose-100 text-rose-600 rounded"><Trash2 size={20} /></button>
              </div>
            </div>
            <table className="w-full">
              <thead><tr className="text-left text-xs font-bold text-slate-400"><th>UHID</th><th>Name</th><th>Age/Gender</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {patientList.map(p => (
                  <tr key={p.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => fetchPatientHistory(p)}>
                    <td className="py-3 px-3">{p.uhid}</td>
                    <td className="py-3 px-3 font-bold">{p.name}</td>
                    <td className="py-3 px-3">{p.age}Y / {p.gender}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePatient(p.id, p.name); }} className="p-2 bg-rose-50 text-rose-500 rounded"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
             <div className="glass-card"><h4>Patients Today</h4><h2>{stats?.totalPatients || 0}</h2></div>
             <div className="glass-card"><h4>Active Now</h4><h2>{stats?.activeToday || 0}</h2></div>
          </div>
        )}
      </main>

      {/* History Modal */}
      {showHistoryModal && historyPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHistoryModal(false)}>
           <div className="bg-white p-8 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">{historyPatient.name} - History</h2>
              {historyVisits.map(v => (
                <div key={v.id} className="mb-4 p-4 border rounded">
                  <div className="font-bold">{new Date(v.visitDate).toLocaleDateString()}</div>
                  <div className="text-sm text-slate-500">Dr. {v.doctor?.name}</div>
                  <div className="mt-2">{v.diagnosis || "No diagnosis"}</div>
                </div>
              ))}
              <button className="mt-6 w-full p-3 bg-slate-100 rounded-xl" onClick={() => setShowHistoryModal(false)}>Close</button>
           </div>
        </div>
      )}

      {/* Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white p-8 rounded-2xl w-80 text-center">
              <h3 className="text-lg font-bold mb-4">Master Password</h3>
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-2 border rounded mb-4" placeholder="••••" />
              <div className="flex gap-2">
                <button onClick={() => setPasswordModal({ isOpen: false, type: null })} className="flex-1 p-2 bg-slate-100 rounded">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 p-2 bg-rose-500 text-white rounded">Delete</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: active ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
      {icon} <span>{label}</span>
    </button>
  );
}
