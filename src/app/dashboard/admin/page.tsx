'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

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
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: 'var(--primary)', color: 'white', padding: '30px 20px' }}>
        <div className="flex items-center gap-3 mb-10">
           <div style={{ width: '35px', height: '35px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>M</div>
           <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700 }}>Admin Panel</h2>
        </div>
        <nav className="flex flex-col gap-4">
          <a href="#" className="nav-item active" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>
             Report Center
          </a>
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', background: 'var(--bg-light)', overflowY: 'auto' }}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--primary)', fontWeight: 700 }}>Hello, {userName || 'Administrator'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Here is your hospital's performance for today.</p>
          </div>
          <div className="flex items-center gap-4">
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Malar Hospital Management</div>
             </div>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-6 mb-10">
           <div className="glass-card" style={{ padding: '25px', borderLeft: '6px solid var(--primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>Patients Registered Today</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>{stats?.totalPatients || 0}</div>
           </div>
           <div className="glass-card" style={{ padding: '25px', borderLeft: '6px solid #10b981' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>Total Collections (Paid)</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981' }}>₹{stats?.totalCollection?.toLocaleString() || 0}</div>
           </div>
           <div className="glass-card" style={{ padding: '25px', borderLeft: '6px solid #f59e0b' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>Top Department</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>
                {stats?.breakdown && Object.keys(stats.breakdown).length > 0 
                  ? Object.entries(stats.breakdown).sort((a: any, b: any) => b[1] - a[1])[0][0]
                  : 'N/A'}
              </div>
           </div>
        </div>

        <div className="flex gap-6">
          {/* Detailed Collection Table */}
          <div className="glass-card" style={{ flex: 2, padding: '25px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>Today's Collection Summary</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: 'var(--bg-light)', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>
                     <th style={{ padding: '12px' }}>Patient Name</th>
                     <th style={{ padding: '12px' }}>Type</th>
                     <th style={{ padding: '12px' }}>Amount</th>
                     <th style={{ padding: '12px' }}>Method</th>
                     <th style={{ padding: '12px' }}>Time</th>
                  </tr>
               </thead>
               <tbody>
                  {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((activity: any) => (
                    <tr key={activity.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                       <td style={{ padding: '15px 12px', fontWeight: 500 }}>{activity.patientName}</td>
                       <td style={{ padding: '15px 12px' }}>
                          <span className={`badge ${activity.type === 'CONSULTATION' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                            {activity.type}
                          </span>
                       </td>
                       <td style={{ padding: '15px 12px', fontWeight: 700 }}>₹{activity.amount}</td>
                       <td style={{ padding: '15px 12px' }}>{activity.paymentMode || 'CASH'}</td>
                       <td style={{ padding: '15px 12px', color: 'var(--text-muted)' }}>
                          {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No collections recorded today.</td>
                    </tr>
                  )}
               </tbody>
            </table>
          </div>

          {/* Department Breakdown */}
          <div className="glass-card" style={{ flex: 1, padding: '25px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>Fee Breakdown</h3>
            <div className="flex flex-col gap-4">
               {stats?.breakdown && Object.entries(stats.breakdown).map(([type, amount]: any) => (
                 <div key={type}>
                    <div className="flex justify-between items-center mb-1">
                       <span style={{ fontSize: '14px', fontWeight: 500 }}>{type}</span>
                       <span style={{ fontSize: '14px', fontWeight: 700 }}>₹{amount}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ width: `${(amount / stats.totalCollection) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                    </div>
                 </div>
               ))}
               {(!stats?.breakdown || Object.keys(stats.breakdown).length === 0) && (
                 <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '20px' }}>No financial data yet.</p>
               )}
            </div>
            
            <div className="mt-10 p-4" style={{ background: 'var(--primary)', borderRadius: '15px', color: 'white', textAlign: 'center' }}>
               <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '5px' }}>Estimated Daily Projection</div>
               <div style={{ fontSize: '20px', fontWeight: 800 }}>₹{((stats?.totalCollection || 0) * 1.5).toFixed(0)}</div>
               <p style={{ fontSize: '10px', marginTop: '10px', opacity: 0.7 }}>Based on current registration trend.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
