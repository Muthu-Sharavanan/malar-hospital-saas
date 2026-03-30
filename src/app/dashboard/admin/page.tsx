'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Users, 
  IndianRupee, 
  TrendingUp, 
  Activity, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  LayoutDashboard,
  FileText,
  Settings,
  Bell
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [activeView, setActiveView] = useState<'performance' | 'doctors'>('performance');
  const [doctorList, setDoctorList] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/users?role=DOCTOR');
      const data = await res.json();
      if (data.success) setDoctorList(data.users);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.success) setUserName(data.user.name);
    } catch (err) {
      console.error("Failed to fetch session", err);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchStats();
    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200"></div>
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#0A4D68', '#088395', '#16698b', '#05bfdb'];

  // Calculate Growth Percentage
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const revenueGrowth = calculateGrowth(stats?.totalCollection || 0, stats?.yesterdayCollection || 0);

  return (
    <div className="sidebar-container bg-[#f8fafc] font-outfit">
      {/* Sidebar Overlay (Mobile) */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar - Enhanced Glassmorphism */}
      <aside className={`sidebar-fixed ${isSidebarOpen ? 'open' : ''}`} style={{ width: '260px', background: 'var(--primary)', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-between items-center mb-12 px-2">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary font-bold text-xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">
               M
             </div>
             <div>
               <h2 className="text-xl font-bold tracking-tight">Admin</h2>
               <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">Hospital SaaS</span>
             </div>
           </div>
           <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(false)}>
             <i className="fa-solid fa-xmark text-xl"></i>
           </button>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <button 
             onClick={() => { setActiveView('performance'); setIsSidebarOpen(false); }}
             className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${activeView === 'performance' ? 'bg-white/20 text-white shadow-soft font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
             <LayoutDashboard size={20} /> Performance
          </button>
          <button 
             onClick={() => { setActiveView('doctors'); setIsSidebarOpen(false); }}
             className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${activeView === 'doctors' ? 'bg-white/20 text-white shadow-soft font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
             <Users size={20} /> Doctors List
          </button>
          <NavItem icon={<Activity size={20} />} label="Live Stats" />
          <NavItem icon={<FileText size={20} />} label="Reports" />
          <NavItem icon={<Settings size={20} />} label="Configuration" />
        </nav>

        <div className="pt-8 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="content-main flex-1 p-6 lg:p-10 overflow-y-auto" style={{ marginLeft: '0', transition: 'all 0.3s' }}>
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4 animate-fade-in">
            <button className="hamburger-btn lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
                {activeView === 'performance' ? 'System Overview' : 'Doctors Directory'}
              </h1>
              <p className="text-slate-500 flex items-center gap-2 mt-1">
                <Calendar size={14} /> {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto gap-6 bg-white/50 p-3 md:p-0 rounded-2xl">
             <div className="relative cursor-pointer hover:scale-110 transition-transform">
               <Bell size={24} className="text-slate-400" />
               <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white"></span>
             </div>
             <div className="hidden md:block h-10 w-px bg-slate-200"></div>
             <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-sm text-slate-800 uppercase tracking-wide">{userName || 'Administrator'}</div>
                  <div className="text-[11px] text-primary font-bold">Malar Hospital Thanjavur</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-primary">
                  {userName ? userName.charAt(0) : 'A'}
                </div>
             </div>
          </div>
        </header>

        {activeView === 'performance' ? (
          <>
            {/* KPI Cards Row */}
            <div className="responsive-grid responsive-grid-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard 
                  label="Today's Revenue" 
                  value={`₹${stats?.totalCollection?.toLocaleString() || 0}`} 
                  icon={<IndianRupee className="text-primary" />} 
                  trend={revenueGrowth} 
                  isPositive={parseFloat(revenueGrowth as string) >= 0}
              />
              <StatCard 
                  label="Patient Registrations" 
                  value={stats?.totalPatients || 0} 
                  icon={<Users className="text-secondary" />} 
                  trend={stats?.totalPatientsMonth || 0}
                  trendLabel="this month"
              />
              <StatCard 
                  label="Monthly Collection" 
                  value={`₹${stats?.monthlyCollection?.toLocaleString() || 0}`} 
                  icon={<TrendingUp className="text-success" />} 
              />
              <StatCard 
                  label="Avg. Bill Value" 
                  value={`₹${stats?.totalPatients > 0 ? (stats.totalCollection / stats.totalPatients).toFixed(0) : 0}`} 
                  icon={<Activity className="text-accent" />} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Revenue Trend Chart */}
              <div className="lg:col-span-2 glass-card overflow-hidden !p-0">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white-50">
                  <div>
                      <h3 className="text-lg font-bold text-slate-800">Revenue Trend</h3>
                      <p className="text-xs text-slate-500 lowercase tracking-wide">Daily collection for the last 7 days</p>
                  </div>
                  <div className="text-xs font-semibold px-3 py-1 bg-primary/5 text-primary rounded-full uppercase tracking-widest cursor-pointer hover:bg-primary/10 transition-colors">7 Days View</div>
                </div>
                <div className="p-6 chart-container bg-white">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.sevenDayTrend || []}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0A4D68" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0A4D68" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fill: '#64748b'}} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fill: '#64748b'}} 
                          tickFormatter={(value) => `₹${value >= 1000 ? (value/1000)+'k' : value}`}
                        />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                          formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#0A4D68" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="glass-card flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-white to-slate-50">
                <h3 className="text-lg font-bold text-slate-800 mb-6 w-full text-left">Department Load</h3>
                <div className="w-full chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.breakdown ? Object.entries(stats.breakdown).map(([name, value]) => ({ name, value })) : []}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {Object.entries(stats?.breakdown || {}).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6 w-full text-left">
                    {Object.entries(stats?.breakdown || {}).map(([type, amount]: any, index: number) => (
                      <div key={type} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></div>
                          <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">{type}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800 pl-4">₹{amount.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2 glass-card">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold text-slate-800">Transaction Stream</h3>
                    <button className="text-xs font-bold text-primary hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-100 border-collapse">
                      <thead>
                        <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100 pb-4">
                          <th className="pb-4">Patient & Description</th>
                          <th className="pb-4">Type</th>
                          <th className="pb-4">Amount</th>
                          <th className="pb-4">Mode</th>
                          <th className="pb-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((activity: any) => (
                          <tr key={activity.id} className="group hover:bg-slate-50-50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                    {activity.patientName.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-slate-700">{activity.patientName}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                activity.type === 'CONSULTATION' ? 'bg-blue-50 text-blue-600' : 
                                activity.type === 'LAB' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {activity.type}
                              </span>
                            </td>
                            <td className="py-4 font-bold text-slate-800">₹{activity.amount}</td>
                            <td className="py-4 text-xs font-medium text-slate-500">{activity.paymentMode || 'CASH'}</td>
                            <td className="py-4 text-xs font-medium text-slate-400">
                              {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-400 italic">No transactions detected today.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
              </div>

              {/* Quick Actions / Summary */}
              <div className="flex flex-col gap-6">
                  <div className="glass-card bg-primary text-white overflow-hidden relative">
                    <div className="relative z-10">
                        <h4 className="text-lg font-bold mb-2">Weekly Goal</h4>
                        <p className="text-white-70 text-sm mb-6">You've reached 84% of your monthly revenue target.</p>
                        <div className="w-full h-2 bg-white-20 rounded-full mb-2">
                          <div className="w-[84%] h-full bg-accent rounded-full shadow-lg shadow-accent-20"></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                          <span>Progress</span>
                          <span>84%</span>
                        </div>
                    </div>
                    {/* Decorative Circle */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  </div>

                  <div className="glass-card flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Efficiency Metrics</h4>
                    <MetricRow label="Consultation Rate" value="92%" isUp={true} />
                    <MetricRow label="Lab Conversion" value="65%" isUp={false} />
                    <MetricRow label="Wait Time avg." value="14m" isUp={true} />
                  </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card animate-fade-in">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold text-slate-800">Registered Medical Practitioners</h3>
                <div className="flex gap-2">
                   <button className="btn btn-primary !rounded-lg !py-2">
                      <Users size={16} /> Add New Doctor
                   </button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <th className="pb-4 px-4">Doctor Name</th>
                         <th className="pb-4 px-4">Role</th>
                         <th className="pb-4 px-4">Contact Email</th>
                         <th className="pb-4 px-4">Status</th>
                         <th className="pb-4 px-4">Action</th>
                      </tr>
                   </thead>
                   <tbody>
                      {doctorList.map((doc) => (
                         <tr key={doc.id} className="border-b border-slate-50 group hover:bg-slate-50-50 transition-colors">
                            <td className="py-4 px-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {doc.name.charAt(3) === '.' ? doc.name.charAt(4) : doc.name.charAt(0)}
                                  </div>
                                  <span className="font-bold text-slate-700">{doc.name}</span>
                               </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-500 font-medium">{doc.role}</td>
                            <td className="py-4 px-4 text-sm text-slate-500">{doc.email}</td>
                            <td className="py-4 px-4">
                               <span className="badge badge-success">Active</span>
                            </td>
                            <td className="py-4 px-4">
                               <button className="text-slate-400 hover:text-primary transition-colors">
                                 <Settings size={18} />
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-components
function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <a 
      href="#" 
      className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
        active 
        ? 'bg-white-20 text-white shadow-soft' 
        : 'text-white-60 hover:text-white hover:bg-white-5'
      }`}
    >
      <span className={active ? 'text-white' : 'text-white/60 group-hover:text-white transition-colors'}>{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full shadow-glow"></div>}
    </a>
  );
}

function StatCard({ label, value, icon, trend, isPositive, trendLabel = "vs yesterday" }: any) {
  return (
    <div className="glass-card hover-scale-102 transition-transform duration-300">
       <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shadow-sm">
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {isPositive ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}% {trendLabel && <span className="text-[8px] opacity-60 ml-0.5">{trendLabel}</span>}
            </div>
          )}
       </div>
       <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
          <span className="text-2xl font-bold text-slate-800 leading-none">{value}</span>
       </div>
    </div>
  );
}

function MetricRow({ label, value, isUp }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
       <span className="text-xs font-medium text-slate-500">{label}</span>
       <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{value}</span>
          {isUp ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />}
       </div>
    </div>
  );
}

