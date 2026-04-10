'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Pill, 
  ClipboardList, 
  PackageCheck, 
  Search, 
  Menu, 
  X, 
  Clock, 
  ChevronRight, 
  Printer,
  Calendar,
  Bell,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function PharmacyPortal() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/pharmacy');
      const data = await res.json();
      if (data.success) setPrescriptions(data.orders);
    } catch (err) {
      console.error("Failed to fetch prescriptions", err);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.success) {
        setUserName(data.user.name);
        setShift(data.shift);
      }
    } catch (err) {
      console.error("Failed to fetch session", err);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchPrescriptions();

    // Refresh prescriptions every 30 seconds
    const interval = setInterval(fetchPrescriptions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Grouped prescriptions by Visit ID
  const grouped = prescriptions.reduce((acc: any, p: any) => {
    if (!acc[p.visitId]) acc[p.visitId] = { visit: p.visit, items: [] };
    acc[p.visitId].items.push(p);
    return acc;
  }, {});

  const handleDispense = async (visitId: string) => {
    const items = grouped[visitId].items;
    setLoading(true);
    try {
      const res = await fetch('/api/pharmacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          visitId, 
          prescriptionIds: items.map((i: any) => i.id) 
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedVisitId(null);
        fetchPrescriptions();
      }
    } catch (err) {
      alert("Dispensing failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredGrouped = Object.values(grouped).filter((g: any) => 
    g.visit?.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.visit?.patient?.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.visit?.doctor?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F7F9FB]">
      {/* Mobile Menu Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar-fixed bg-[#0A4D68] w-280 z-50 flex flex-col ${isSidebarOpen ? 'open' : ''}`}>
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Pill className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold tracking-tight m-0 uppercase letter-spacing-1">Malar HMS</h2>
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Pharmacy Portal</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <button className="sidebar-pill active">
              <PackageCheck size={18} className="mr-3" /> Dispensing
            </button>
            <button className="sidebar-pill opacity-60 cursor-not-allowed">
              <ClipboardList size={18} className="mr-3" /> Inventory Management
            </button>
            <button className="sidebar-pill opacity-60 cursor-not-allowed">
              <Printer size={18} className="mr-3" /> Labels & Reports
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-280 content-main p-8 lg:p-12 animate-fade-in">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button 
              className="hamburger-btn lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-primary tracking-tight mb-1">
                Pharmacy Services
              </h1>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <Clock size={16} /> {shift} Shift &nbsp;·&nbsp; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search by Patient / UHID..." 
                 className="form-input !pl-12 !rounded-full !bg-white shadow-soft"
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
            </div>
            <div className="relative hidden sm:block">
               <Bell className="text-primary cursor-pointer hover:scale-110 transition-transform" size={22} />
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-[#F7F9FB]"></span>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full shadow-soft">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-xl">
                 {userName ? userName.charAt(0) : 'P'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-primary uppercase">Chief Pharmacist</div>
                <div className="text-sm font-semibold text-slate-700">{userName || 'Loading...'}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending List Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="text-secondary" size={20} /> Awaiting Fulfillment
              </h3>
              <span className="badge badge-warning">{filteredGrouped.length} Pending</span>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: '70vh' }}>
              {filteredGrouped.length > 0 ? filteredGrouped.map((g: any) => (
                <div 
                  key={g.visit.id} 
                  className={`glass-card !p-5 cursor-pointer group hover-scale-102 ${selectedVisitId === g.visit.id ? '!border-secondary !shadow-lg bg-secondary/5' : 'bg-white'}`}
                  onClick={() => setSelectedVisitId(g.visit.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Token #{g.visit?.tokenNumber}</span>
                      <h4 className="text-base font-bold text-slate-800 lg:text-lg">{g.visit?.patient?.name}</h4>
                    </div>
                    <div className={`p-2 rounded-lg ${selectedVisitId === g.visit.id ? 'bg-secondary text-white' : 'bg-slate-50 text-slate-400'} transition-all`}>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <span className="badge badge-primary">{g.items?.length} Medications</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{g.visit?.patient?.uhid}</span>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                     <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                        Dr. {g.visit?.doctor?.name.replace(/^(dr\.?\s*)+/i, '')}
                     </span>
                     <span className="text-[10px] text-slate-400 font-medium italic">Pending Checkout</span>
                  </div>
                </div>
              )) : (
                <div className="glass-card flex flex-col items-center justify-center p-12 text-center bg-white/50 border-dashed border-2 border-slate-200 shadow-none">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="text-slate-300" size={32} />
                  </div>
                  <h4 className="text-slate-500 font-bold">No Active Orders</h4>
                  <p className="text-xs text-slate-400">Prescriptions from doctors will appear here automatically.</p>
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Column */}
          <div className="lg:col-span-2">
            {selectedVisitId ? (
              <div className="glass-card !p-8 animate-fade-in bg-white h-full border-2 border-white shadow-lg">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                         <PackageCheck className="text-secondary" size={20} />
                      </div>
                      <span className="badge badge-success">Digital Prescription</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">Dispensing Workflow</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 mb-1 tracking-widest uppercase">Patient Record</div>
                    <div className="text-xl font-bold text-slate-700">{grouped[selectedVisitId].visit?.patient?.name}</div>
                    <div className="flex items-center justify-end gap-2 text-xs font-bold text-secondary mt-1">
                       <Calendar size={12} /> {grouped[selectedVisitId].visit?.patient?.uhid}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Prescribed Medications</h4>
                      <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-full">Total: {grouped[selectedVisitId].items.length} Items</span>
                   </div>
                   
                   <div className="grid gap-4">
                      {grouped[selectedVisitId].items.map((item: any) => (
                        <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm group hover-scale-102 transition-all">
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                                    <Pill className="text-primary" size={20} />
                                 </div>
                                 <div>
                                    <h5 className="font-extrabold text-[#1E293B] text-lg leading-none">{item.drugName}</h5>
                                    <span className="text-xs font-bold text-secondary">{item.instructions}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="badge badge-primary !bg-slate-100 !text-slate-600 !font-black !px-4 !py-1 text-sm">{item.dosage}</div>
                                 <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-1">Duration: {item.duration}</div>
                              </div>
                           </div>
                           <div className="pt-3 border-t border-dashed border-slate-100 flex items-center gap-2">
                              <PackageCheck size={14} className="text-success" />
                              <span className="text-[11px] font-bold text-slate-400">Verify drug strength and expiry before hand-over.</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/10 rounded-xl">
                      <AlertCircle className="text-accent" size={20} />
                      <p className="text-xs font-semibold text-slate-600 italic">
                        By clicking "Confirm Dispensing", you verify that all medications listed above have been physically handed over to the patient or their guardian.
                      </p>
                   </div>
                   
                   <div className="flex gap-4">
                      <button 
                        className="btn btn-outline flex-1 h-16 !rounded-2xl"
                        onClick={() => setSelectedVisitId(null)}
                      >
                         Discard Selection
                      </button>
                      <button 
                         className="btn btn-primary flex-[2] bg-primary hover:bg-primary-light h-16 shadow-lg !rounded-2xl" 
                         onClick={() => handleDispense(selectedVisitId)} 
                         disabled={loading}
                      >
                         {loading ? (
                           <span className="flex items-center gap-2">
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             Finalizing Transaction...
                           </span>
                         ) : (
                           <span className="flex items-center gap-2">
                             <CheckCircle size={22} /> Confirm & Mark as Dispensed
                           </span>
                         )}
                      </button>
                   </div>
                </div>
              </div>
            ) : (
              <div className="glass-card flex flex-col items-center justify-center p-24 text-center bg-white h-full shadow-soft border-2 border-dashed border-slate-200">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8">
                  <Pill className="text-primary opacity-20" size={60} />
                </div>
                <h2 className="text-slate-400 font-bold mb-2 uppercase tracking-wide">Fulfillment Center</h2>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">
                  Select a registered patient prescription to process medication dispensing and update the pharmacy inventory.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

