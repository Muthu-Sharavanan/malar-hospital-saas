'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function NursingDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Vitals State
  const [vitals, setVitals] = useState({
    pulse: '',
    bloodPressure: '',
    spo2: '',
    temperature: '',
    weight: '',
    height: '',
    bmi: ''
  });

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/vitals');
      const data = await res.json();
      if (data.success) setQueue(data.queue);
    } catch (err) {
      console.error("Failed to fetch nursing queue", err);
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
    fetchQueue();
    fetchSession();
  }, []);

  useEffect(() => {
    if (activeTab === 'queue') fetchQueue();
  }, [activeTab]);

  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    const w = parseFloat(vitals.weight);
    const h = parseFloat(vitals.height) / 100; // cm to m
    if (w > 0 && h > 0) {
      const b = (w / (h * h)).toFixed(2);
      setVitals(prev => ({ ...prev, bmi: b }));
    }
  }, [vitals.weight, vitals.height]);

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vitals, visitId: selectedVisit.id })
      });
      const data = await res.json();
      if (data.success) {
        alert("Vitals documented successfully!");
        setSelectedVisit(null);
        setVitals({ pulse: '', bloodPressure: '', spo2: '', temperature: '', weight: '', height: '', bmi: '' });
        fetchQueue();
      }
    } catch (err) {
      alert("Failed to save vitals");
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
            Nursing Station
          </a>
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', background: 'var(--bg-light)' }}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--primary)' }}>Welcome, {userName || 'Nurse'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Document patient vitals and manage nursing records for the <strong style={{color: 'var(--secondary)'}}>{shift}</strong> shift.</p>
          </div>
          <div className="flex items-center gap-4">
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Malar Hospital, Thanjavur</div>
             </div>
          </div>
        </header>

        <div className="flex gap-6">
          {/* Waiting List */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '20px' }}>Awaiting Vitals</h3>
            <div className="flex flex-col gap-3">
              {queue.length > 0 ? queue.map((v: any) => (
                <div 
                  key={v.id} 
                  className="flex justify-between items-center p-4" 
                  style={{ 
                    border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
                    background: selectedVisit?.id === v.id ? 'var(--bg-light)' : 'white',
                    borderColor: selectedVisit?.id === v.id ? 'var(--secondary)' : 'var(--border)'
                  }}
                  onClick={() => setSelectedVisit(v)}
                >
                  <div>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>#{v.tokenNumber} - {v.patient.name}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{v.patient.age}Y | {v.patient.gender} | {v.doctor.name}</span>
                  </div>
                  <span className="badge badge-warning">Pending</span>
                </div>
              )) : (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No patients waiting.</p>
              )}
            </div>
          </div>

          {/* Vitals Form */}
          <div className="glass-card" style={{ width: '500px' }}>
            {selectedVisit ? (
              <>
                <h3 style={{ marginBottom: '10px' }}>Document Vitals</h3>
                <p className="mb-6" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                  Patient: {selectedVisit.patient.name} (Token #{selectedVisit.tokenNumber})
                </p>
                
                <form className="flex flex-col gap-4" onSubmit={handleSubmitVitals}>
                  <div className="flex gap-4">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Pulse (bpm)</label>
                      <input 
                        type="number" className="form-input" placeholder="72" required 
                        value={vitals.pulse} onChange={e => setVitals({...vitals, pulse: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">BP (mmHg)</label>
                      <input 
                        type="text" className="form-input" placeholder="120/80" required 
                        value={vitals.bloodPressure} onChange={e => setVitals({...vitals, bloodPressure: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">SpO₂ (%)</label>
                      <input 
                        type="number" className="form-input" placeholder="98" required 
                        value={vitals.spo2} onChange={e => setVitals({...vitals, spo2: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Temp (°F)</label>
                      <input 
                        type="number" step="0.1" className="form-input" placeholder="98.6" required 
                        value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Weight (kg)</label>
                      <input 
                        type="number" step="0.1" className="form-input" placeholder="70" required 
                        value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Height (cm)</label>
                      <input 
                        type="number" className="form-input" placeholder="170" required 
                        value={vitals.height} onChange={e => setVitals({...vitals, height: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">BMI (Auto-calculated)</label>
                    <input type="text" className="form-input" readOnly value={vitals.bmi} style={{ background: '#f1f5f9' }} />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                    {loading ? "Saving..." : "Submit to Doctor"}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select a patient from the list to enter vitals.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
