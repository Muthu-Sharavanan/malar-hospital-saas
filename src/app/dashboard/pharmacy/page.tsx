'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function PharmacyPortal() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [loading, setLoading] = useState(false);

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
        alert("Medications dispensed successfully!");
        setSelectedVisitId(null);
        fetchPrescriptions();
      }
    } catch (err) {
      alert("Dispensing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'var(--primary)', color: 'white', padding: '20px' }}>
        <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '30px', fontWeight: 'bold', letterSpacing: '1px' }}>MALAR HOSPITAL</h2>
        <nav className="flex flex-col gap-4">
          <a href="#" className="flex items-center gap-2" style={{ color: 'white', fontWeight: 600 }}>
             Pharmacy Portal
          </a>
          
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', background: 'var(--bg-light)' }}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--primary)' }}>Welcome, {userName || 'Pharmacist'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Dispense medications and manage clinical records for the <strong style={{color: 'var(--secondary)'}}>{shift}</strong> shift.</p>
          </div>
          <div className="flex items-center gap-4">
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Malar Hospital, Thoothukudi</div>
             </div>
          </div>
        </header>

        <div className="flex gap-6">
          {/* Prescriptions List */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '20px' }}>Pending Prescriptions</h3>
            <div className="flex flex-col gap-3">
              {Object.keys(grouped).length > 0 ? Object.values(grouped).map((g: any) => (
                <div 
                  key={g.visit.id} 
                  className="p-4" 
                  style={{ 
                    border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
                    background: selectedVisitId === g.visit.id ? 'var(--bg-light)' : 'white',
                    borderColor: selectedVisitId === g.visit.id ? 'var(--secondary)' : 'var(--border)'
                  }}
                  onClick={() => setSelectedVisitId(g.visit.id)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontWeight: 'bold' }}>{g.visit?.patient?.name}</span>
                    <span className="badge badge-warning">{g.items?.length} Meds</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Token: #{g.visit?.tokenNumber} | Dr. {g.visit?.doctor?.name}
                  </div>
                </div>
              )) : (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No prescriptions waiting.</p>
              )}
            </div>
          </div>

          {/* Medication Dispensing */}
          <div className="glass-card" style={{ width: '500px' }}>
            {selectedVisitId ? (
              <>
                <h3 style={{ marginBottom: '10px' }}>Medication Dispensing</h3>
                <p className="mb-6" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                  Patient: {grouped[selectedVisitId].visit?.patient?.name}
                </p>
                
                <div className="flex flex-col gap-4">
                  {grouped[selectedVisitId].items.map((item: any) => (
                    <div key={item.id} className="p-3" style={{ background: '#f8fafc', borderRadius: '8px' }}>
                       <div className="flex justify-between items-center mb-2">
                          <span style={{ fontWeight: 'bold' }}>{item.drugName}</span>
                          <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{item.dosage}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>Duration: {item.duration}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{item.instructions}</span>
                       </div>
                       <div style={{ marginTop: '10px', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* Verify medication batch before dispensing.</p>
                       </div>
                    </div>
                  ))}

                  <div className="mt-4 pt-4" style={{ borderTop: '2px solid var(--border)', textAlign: 'right' }}>
                     <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleDispense(selectedVisitId)} disabled={loading}>
                        {loading ? "Processing..." : "Confirm Dispensing"}
                     </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select a patient to start dispensing.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
