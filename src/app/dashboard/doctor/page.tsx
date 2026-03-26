'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function DoctorDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [loading, setLoading] = useState(false);
  
  // Consultation State
  const [consultation, setConsultation] = useState({
    chiefComplaints: '',
    history: '',
    examination: '',
    diagnosis: ''
  });

  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [currentDrug, setCurrentDrug] = useState({ name: '', dosage: '1-0-1', duration: '5 days', instructions: 'After food' });

  const commonTests = [
    { name: 'CBC (Complete Blood Count)', price: 350, category: 'Hematology' },
    { name: 'RBS (Random Blood Sugar)', price: 100, category: 'Biochemistry' },
    { name: 'Liver Function Test (LFT)', price: 750, category: 'Biochemistry' },
    { name: 'Kidney Function Test (KFT)', price: 750, category: 'Biochemistry' },
    { name: 'Lipid Profile', price: 900, category: 'Biochemistry' },
    { name: 'Urine Routine', price: 150, category: 'Clinical Pathology' }
  ];

  const handleAddDrug = () => {
    if (!currentDrug.name) return;
    setDrugs([...drugs, currentDrug]);
    setCurrentDrug({ name: '', dosage: '1-0-1', duration: '5 days', instructions: 'After food' });
  };

  const handlePrescribe = async () => {
    if (!selectedVisit || drugs.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: selectedVisit.id, drugs })
      });
      const data = await res.json();
      if (data.success) {
        alert("Prescription saved! Patient can collect from Pharmacy.");
        setDrugs([]);
      }
    } catch (err) {
      alert("Failed to save prescription");
    } finally {
      setLoading(false);
    }
  };

  const toggleTest = (test: any) => {
    if (selectedTests.find(t => t.name === test.name)) {
      setSelectedTests(selectedTests.filter(t => t.name !== test.name));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleOrderLabs = async () => {
    if (!selectedVisit || selectedTests.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: selectedVisit.id, tests: selectedTests })
      });
      const data = await res.json();
      if (data.success) {
        alert("Lab tests ordered! Patient must pay at reception.");
        setSelectedTests([]);
      }
    } catch (err) {
      alert("Failed to order labs");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorQueue = async () => {
    try {
      const res = await fetch('/api/consultation');
      const data = await res.json();
      if (data.success) setQueue(data.queue);
    } catch (err) {
      console.error("Failed to fetch doctor queue", err);
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
    fetchDoctorQueue();
  }, []);

  const handleSubmitConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...consultation, visitId: selectedVisit.id })
      });
      const data = await res.json();
      if (data.success) {
        alert("Consultation completed successfully!");
        setSelectedVisit(null);
        setConsultation({ chiefComplaints: '', history: '', examination: '', diagnosis: '' });
        fetchDoctorQueue();
      }
    } catch (err) {
      alert("Failed to save consultation");
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
            <i className="fa-solid fa-stethoscope"></i> Doctor Dashboard
          </a>
          <a href="#" className="flex items-center gap-2" style={{ color: 'white', opacity: 0.7 }}>
             OPD Patients
          </a>
          
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', background: 'var(--bg-light)' }}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--primary)' }}>Welcome, {userName || 'Doctor'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Consult patients and manage clinical records for the <strong style={{color: 'var(--secondary)'}}>{shift}</strong> shift.</p>
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
            <h3 style={{ marginBottom: '20px' }}>Today's Patients</h3>
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
                  onClick={async () => { 
                    setSelectedVisit(v); 
                    setSelectedTests([]); 
                    setDrugs([]);
                    // Update status to CONSULTING
                    try {
                      await fetch('/api/consultation', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ visitId: v.id, status: 'CONSULTING' })
                      });
                    } catch (err) {
                      console.error("Failed to update status", err);
                    }
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>#{v.tokenNumber} - {v.patient.name}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{v.patient.age}Y | {v.patient.gender} | {v.doctor.name}</span>
                  </div>
                  <span className={`badge ${v.status === 'CONSULTING' ? 'badge-primary' : 'badge-success'}`}>
                    {v.status === 'CONSULTING' ? 'IN PROGRESS' : 'READY'}
                  </span>
                </div>
              )) : (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No patients ready for consultation yet.</p>
              )}
            </div>
          </div>

          {/* Consultation Form */}
          <div className="glass-card" style={{ width: '650px' }}>
            {selectedVisit ? (
              <>
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 style={{ marginBottom: '5px' }}>Clinical Note</h3>
                      <p style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                        {selectedVisit.patient.name} (Token #{selectedVisit.tokenNumber})
                      </p>
                      <button 
                        className="btn btn-outline" style={{ fontSize: '11px', padding: '2px 8px', marginTop: '5px' }}
                        onClick={() => window.open(`/dashboard/doctor/prescription/${selectedVisit.id}`, '_blank')}
                      >
                        <i className="fa-solid fa-print mr-1"></i> Print Prescription
                      </button>
                   </div>
                   <div className="badge badge-primary" style={{ padding: '10px' }}>
                      BMI: {selectedVisit.bmi}
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center' }}><small>BP</small><div style={{ fontWeight: 600 }}>{selectedVisit.bloodPressure || 'N/A'}</div></div>
                    <div style={{ textAlign: 'center' }}><small>Pulse</small><div style={{ fontWeight: 600 }}>{selectedVisit.pulse || 'N/A'}</div></div>
                    <div style={{ textAlign: 'center' }}><small>SpO₂</small><div style={{ fontWeight: 600 }}>{selectedVisit.spo2 || 'N/A'}%</div></div>
                    <div style={{ textAlign: 'center' }}><small>Temp</small><div style={{ fontWeight: 600 }}>{selectedVisit.temperature || 'N/A'}°F</div></div>
                </div>

                {/* Lab Results Display */}
                {selectedVisit.labOrders?.some((l: any) => l.status === 'REPORTED') && (
                  <div className="mb-6 p-4" style={{ background: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981' }}>
                    <h4 style={{ color: '#064e3b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-flask"></i> Lab Reports Ready
                    </h4>
                    {selectedVisit.labOrders.filter((l: any) => l.status === 'REPORTED').map((l: any) => (
                      <div key={l.id} className="mb-3">
                         <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{l.testName}:</div>
                         <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{l.reportData}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                <form className="flex flex-col gap-4" onSubmit={handleSubmitConsult}>
                  {/* Lab Ordering Section */}
                  <div className="mb-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <label className="form-label">Order Lab Tests</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      {commonTests.map(test => (
                        <button 
                          key={test.name} type="button" 
                          onClick={() => toggleTest(test)}
                          className={selectedTests.find(t => t.name === test.name) ? 'btn btn-primary' : 'btn btn-outline'}
                          style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '5px' }}
                        >
                          {test.name}
                        </button>
                      ))}
                    </div>
                    {selectedTests.length > 0 && (
                      <button type="button" className="btn btn-accent" style={{ fontSize: '13px', width: '100%', marginBottom: '20px' }} onClick={handleOrderLabs} disabled={loading}>
                        Place Lab Order (₹{selectedTests.reduce((s,t)=>s+t.price,0)})
                      </button>
                    )}
                  </div>

                  {/* Prescription Section */}
                  <div className="mb-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <label className="form-label">Prescription (E-Prescribe)</label>
                    
                    <div className="flex gap-2 mb-4">
                      <input 
                         type="text" className="form-input" style={{ flex: 2 }} placeholder="Medicine Name" 
                         value={currentDrug.name} onChange={e => setCurrentDrug({...currentDrug, name: e.target.value})}
                      />
                      <input 
                         type="text" className="form-input" style={{ flex: 1 }} placeholder="1-0-1" 
                         value={currentDrug.dosage} onChange={e => setCurrentDrug({...currentDrug, dosage: e.target.value})}
                      />
                      <button type="button" className="btn btn-outline" onClick={handleAddDrug}>Add</button>
                    </div>

                    {/* Existing Prescriptions */}
                    {selectedVisit.prescriptions?.length > 0 && (
                      <div className="mb-4">
                        <small style={{ color: 'var(--text-muted)' }}>Already Prescribed:</small>
                        {selectedVisit.prescriptions.map((p: any) => (
                          <div key={p.id} className="flex justify-between p-2 mb-1" style={{ background: '#f8fafc', borderRadius: '5px', fontSize: '12px', border: '1px solid var(--border)' }}>
                            <span><strong>{p.drugName}</strong> ({p.dosage})</span>
                            <span className={`badge ${p.status === 'DISPENSED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px' }}>{p.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {drugs.length > 0 && (
                      <div className="mb-4">
                         {drugs.map((d, i) => (
                           <div key={i} className="flex justify-between p-2 mb-1" style={{ background: '#f1f5f9', borderRadius: '5px', fontSize: '13px' }}>
                              <span><strong>{d.name}</strong> ({d.dosage})</span>
                              <span>{d.duration}</span>
                           </div>
                         ))}
                         <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={handlePrescribe} disabled={loading}>
                            Finalize Prescription
                         </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Chief Complaints</label>
                    <textarea 
                      className="form-input" style={{ height: '80px' }} placeholder="Why is the patient here?" required 
                      value={consultation.chiefComplaints} onChange={e => setConsultation({...consultation, chiefComplaints: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">History</label>
                    <textarea 
                      className="form-input" style={{ height: '80px' }} placeholder="Prev medical history..."  
                      value={consultation.history} onChange={e => setConsultation({...consultation, history: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Examination Findings</label>
                    <textarea 
                      className="form-input" style={{ height: '100px' }} placeholder="Clinical exam results..."  
                      value={consultation.examination} onChange={e => setConsultation({...consultation, examination: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Provisional Diagnosis</label>
                    <input 
                      type="text" className="form-input" placeholder="Enter diagnosis..." required 
                      value={consultation.diagnosis} onChange={e => setConsultation({...consultation, diagnosis: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-4 mt-2">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                      {loading ? "Saving Note..." : "Finalize & Complete Consultation"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select a patient from the list to start the consultation.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
