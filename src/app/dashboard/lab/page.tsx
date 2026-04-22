'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function LaboratoryPortal() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/lab-report');
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error("Failed to fetch lab orders", err);
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
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    // In a real app, this would be a separate API or patched
    // For simplicity, we'll just implement the report submission here
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const res = await fetch('/api/lab-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id, reportData: reportText })
      });
      const data = await res.json();
      if (data.success) {
        alert("Report submitted successfully!");
        setSelectedOrder(null);
        setReportText('');
        fetchOrders();
      }
    } catch (err) {
      alert("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'var(--primary)', color: 'white', padding: '20px' }}>
        <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '30px' }}>Malar HMS</h2>
        <nav className="flex flex-col gap-4">
          <a href="#" className="flex items-center gap-2" style={{ color: 'white', fontWeight: 600 }}>
             Lab Portal
          </a>
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', background: 'var(--bg-light)' }}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--primary)' }}>Welcome, {userName || 'Lab Technician'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Process diagnostics and publish reports for the <strong style={{color: 'var(--secondary)'}}>{shift}</strong> shift.</p>
          </div>
          <div className="flex items-center gap-4">
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Malar Hospital, Thoothukudi</div>
             </div>
          </div>
        </header>

        <div className="flex gap-6">
          {/* Orders List */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '20px' }}>Pending Lab Tests</h3>
            <div className="flex flex-col gap-3">
              {orders.length > 0 ? orders.map((o: any) => (
                <div 
                  key={o.id} 
                  className="p-4" 
                  style={{ 
                    border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
                    background: selectedOrder?.id === o.id ? 'var(--bg-light)' : 'white',
                    borderColor: selectedOrder?.id === o.id ? 'var(--secondary)' : 'var(--border)'
                  }}
                  onClick={() => setSelectedOrder(o)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontWeight: 'bold' }}>{o.testName}</span>
                    <span className="badge badge-info">{o.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Patient: {o.visit?.patient?.name} | Token: #{o.visit?.tokenNumber}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--secondary)', marginTop: '4px' }}>
                    Ref: Dr. {o.visit?.doctor?.name}
                  </div>
                </div>
              )) : (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No orders awaiting processing.</p>
              )}
            </div>
          </div>

          {/* Report Entry */}
          <div className="glass-card" style={{ width: '500px' }}>
            {selectedOrder ? (
              <>
                <h3 style={{ marginBottom: '10px' }}>Fill Report</h3>
                <p className="mb-2" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                  {selectedOrder.testName} - {selectedOrder.visit?.patient?.name}
                </p>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
                  <div className="mb-1"><strong>Doctor:</strong> Dr. {selectedOrder.visit?.doctor?.name}</div>
                  {selectedOrder.visit?.chiefComplaints && (
                    <div><strong>Complaints:</strong> {selectedOrder.visit.chiefComplaints}</div>
                  )}
                </div>
                
                <form className="flex flex-col gap-4" onSubmit={handleSubmitReport}>
                  <div className="form-group">
                    <label className="form-label">Report Result / Findings</label>
                    <textarea 
                      className="form-input" style={{ height: '250px' }} 
                      placeholder="Enter the lab results here..." required 
                      value={reportText} onChange={e => setReportText(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Uploading..." : "Publish Report to Doctor"}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select an order to enter sample results.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
