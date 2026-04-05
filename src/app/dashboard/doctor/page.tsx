'use client';
import { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import LogoutButton from '@/components/LogoutButton';

export default function DoctorDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');

  const [showCalendar, setShowCalendar] = useState(false);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Format doctor name with Dr. prefix
  let drName = userName
    ? 'Dr. ' + userName.trim().replace(/^(dr\.?\s*)+/i, '')
    : 'Doctor';
    
  // FORCE NAME FIX FOR DEMO (If name comes back as malar)
  if (drName.toLowerCase() === 'dr. malar') {
    drName = 'Dr. Ramaswamy';
  }

  // Dynamic Page Title
  useEffect(() => {
    if (userName) {
      document.title = `${drName} | Malar Hospital`;
    } else {
      document.title = 'Doctor Dashboard | Malar Hospital';
    }
  }, [userName, drName]);

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
  const [currentDrug, setCurrentDrug] = useState({ name: '', dosage: '1-0-1', duration: '5 Days', instructions: 'After food' });

  const commonTests = [
    { name: 'CBC (Complete Blood Count)', category: 'Hematology' },
    { name: 'RBS (Random Blood Sugar)', category: 'Biochemistry' },
    { name: 'Liver Function Test (LFT)', category: 'Biochemistry' },
    { name: 'Kidney Function Test (KFT)', category: 'Biochemistry' },
    { name: 'Lipid Profile', category: 'Biochemistry' },
    { name: 'Urine Routine', category: 'Clinical Pathology' }
  ];

  const handleAddDrug = () => {
    if (!currentDrug.name) return;
    setDrugs([...drugs, currentDrug]);
    setCurrentDrug({ name: '', dosage: '1-0-1', duration: '5 Days', instructions: 'After food' });
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
        alert("Lab tests ordered successfully!");
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
      const res = await fetch(`/api/consultation?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setQueue(data.queue);
    } catch (err) {
      console.error("Failed to fetch doctor queue", err);
    }
  };

  const fetchAllAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setAllAppointments(data.visits);
    } catch (err) {
      console.error("Failed to fetch all appointments", err);
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
    fetchAllAppointments();
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
        fetchAllAppointments();
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
        <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '30px', fontWeight: 'bold', letterSpacing: '1px' }}>MALAR HOSPITAL</h2>
        <nav className="flex flex-col gap-4">
          <a href="#" className="flex items-center gap-2" style={{ color: 'white', fontWeight: 600 }}>
            <i className="fa-solid fa-stethoscope"></i> {drName}
          </a>
          <a href="#" className="flex items-center gap-2" style={{ color: 'white', opacity: !showCalendar ? 1 : 0.7 }} onClick={(e) => { e.preventDefault(); setShowCalendar(false); }}>
             OPD Patients
          </a>
          <a href="#" className="flex items-center gap-2" style={{ color: 'white', opacity: showCalendar ? 1 : 0.7 }} onClick={(e) => { e.preventDefault(); setShowCalendar(true); fetchAllAppointments(); }}>
             <i className="fa-regular fa-calendar" style={{ width: '16px' }}></i> Appointments Calendar
          </a>
          
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', background: 'var(--bg-light)' }}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--primary)' }}>Welcome, {drName}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Consult patients and manage clinical records for the <strong style={{color: 'var(--secondary)'}}>{shift}</strong> shift.</p>
          </div>
          <div className="flex items-center gap-4">
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Malar Hospital, Thoothukudi</div>
             </div>
          </div>
        </header>

        {showCalendar ? (
          <div className="glass-card fade-in" style={{ padding: '30px' }}>
             <div className="flex justify-between items-center mb-6">
                <h2 style={{ fontSize: '24px', color: 'var(--primary)', fontWeight: 'bold' }}>
                   {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                   <button className="btn btn-outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                     <i className="fa-solid fa-chevron-left"></i>
                   </button>
                   <button className="btn btn-outline" onClick={() => setCurrentMonth(new Date())}>
                     Today
                   </button>
                   <button className="btn btn-outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                     <i className="fa-solid fa-chevron-right"></i>
                   </button>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>{day}</div>
                ))}
                
                {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) }).map(day => {
                   const dayVisits = allAppointments.filter(v => isSameDay(new Date(v.visitDate), day));
                   const isPending = dayVisits.some(v => v.status !== 'COMPLETED');
                   const isCurrentMonth = isSameMonth(day, currentMonth);

                   return (
                     <div key={day.toString()} style={{ 
                       minHeight: '100px', 
                       background: 'white', 
                       border: `2px solid ${isSameDay(day, new Date()) ? 'var(--primary)' : 'var(--border)'}`, 
                       borderRadius: '8px', 
                       padding: '8px',
                       opacity: isCurrentMonth ? 1 : 0.4
                     }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '14px', 
                          marginBottom: '8px',
                          color: isPending ? '#dc2626' : 'inherit' // Red if pending appointments
                        }}>
                           {format(day, 'd')}
                        </div>
                        <div className="flex flex-col gap-1">
                           {dayVisits.map(v => (
                              <div key={v.id} style={{ 
                                fontSize: '11px', 
                                padding: '3px 6px', 
                                background: v.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2',
                                color: v.status === 'COMPLETED' ? '#166534' : '#991b1b',
                                border: `1px solid ${v.status === 'COMPLETED' ? '#bbf7d0' : '#fecaca'}`,
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }} title={`${v.patient.name} (${v.patient.age}Y) - ${v.chiefComplaints || v.status}`}>
                                 {v.patient.name} ({v.patient.age}Y) {v.chiefComplaints ? `- ${v.chiefComplaints}` : ''}
                              </div>
                           ))}
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        ) : (
          <div className="flex gap-6 fade-in">
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
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{v.patient.age}Y | {v.patient.gender} | Dr. {v.doctor.name.trim().replace(/^(dr\.?\s*)+/i, '')}</span>
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
                {/* ── Patient Information Panel ── */}
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#0A4D68', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', flexShrink: 0 }}>
                        {selectedVisit.patient.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '18px', color: '#0F172A' }}>{selectedVisit.patient.name}</div>
                        <div style={{ fontSize: '13px', color: '#0A4D68', fontWeight: '600', marginTop: '2px' }}>
                          {selectedVisit.patient.uhid} &nbsp;·&nbsp; Token #{selectedVisit.tokenNumber}
                        </div>
                      </div>
                    </div>
                    <button 
                      className="btn btn-outline" style={{ fontSize: '11px', padding: '5px 12px' }}
                      onClick={() => window.open(`/dashboard/doctor/prescription/${selectedVisit.id}`, '_blank')}
                    >
                      <i className="fa-solid fa-print mr-1"></i> Print Rx
                    </button>
                  </div>

                  {/* Vitals Summary */}
                  <div style={{ borderTop: '1px dashed #BAE6FD', paddingTop: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                      {[
                        { label: 'BP', value: selectedVisit.bloodPressure, unit: '' },
                        { label: 'Pulse', value: selectedVisit.pulse, unit: '' },
                        { label: 'SpO₂', value: selectedVisit.spo2, unit: '%' },
                        { label: 'Temp', value: selectedVisit.temperature, unit: '°F' },
                        { label: 'Weight', value: selectedVisit.weight, unit: 'kg' },
                        { label: 'Height', value: selectedVisit.height, unit: 'cm' },
                        { label: 'BMI', value: selectedVisit.bmi, unit: '' },
                      ].map(({ label, value, unit }) => (
                        <div key={label} style={{ textAlign: 'center', background: value ? '#0A4D68' : '#E2E8F0', borderRadius: '8px', padding: '8px 4px' }}>
                          <div style={{ fontSize: '9px', color: value ? '#93C5FD' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                          <div style={{ fontWeight: '700', color: value ? 'white' : '#94A3B8', fontSize: '13px', marginTop: '2px' }}>
                            {value ? `${value}${unit}` : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                        Place Lab Order ({selectedTests.length} tests)
                      </button>
                    )}
                  </div>

                  {/* Prescription Section (Natural Handwriting Style) */}
                  <div className="mb-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <label className="form-label">Prescription (Click-to-Select)</label>
                    
                    <div className="flex flex-col gap-6 mb-4 p-6" style={{ background: '#fff', borderRadius: '16px', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                      <div>
                        <input 
                           type="text" className="form-input !text-lg !font-bold !py-4" style={{ width: '100%', marginBottom: '0', border: 'none', borderBottom: '2px solid #e2e8f0', borderRadius: '0' }} placeholder="Medicine Name..." 
                           value={currentDrug.name} onChange={e => setCurrentDrug({...currentDrug, name: e.target.value})}
                        />
                      </div>
                      
                      {/* Dosage Selection */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dosage (Frequency)</div>
                        <div className="flex flex-wrap gap-2">
                          {['1-0-1', '1-1-1', '1-0-0', '0-0-1', '1-1-1-1', 'SOS'].map(d => (
                            <button 
                              key={d} type="button" 
                              onClick={() => setCurrentDrug({...currentDrug, dosage: d})}
                              className={`btn ${currentDrug.dosage === d ? 'btn-primary shadow-sm scale-105' : 'btn-outline border-slate-200'}`}
                              style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '10px', transition: 'all 0.2s' }}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration Selection */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Duration (Days)</div>
                        <div className="flex flex-wrap gap-2">
                          {['1 Day', '3 Days', '5 Days', '1 Week', '10 Days', '2 Weeks', '1 Month'].map(dur => (
                            <button 
                              key={dur} type="button" 
                              onClick={() => setCurrentDrug({...currentDrug, duration: dur})}
                              className={`btn ${currentDrug.duration === dur ? 'btn-secondary shadow-sm scale-105' : 'btn-outline border-slate-200'}`}
                              style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '10px', transition: 'all 0.2s' }}
                            >
                              {dur}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Food Instructions Selection */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>When to Take</div>
                        <div className="flex gap-4">
                          {[
                            { label: 'After Food', value: 'After food', icon: 'fa-utensils' },
                            { label: 'Before Food', value: 'Before food', icon: 'fa-apple-whole' }
                          ].map(opt => (
                            <button 
                              key={opt.value} type="button" 
                              onClick={() => setCurrentDrug({...currentDrug, instructions: opt.value})}
                              className={`btn flex-1 flex items-center justify-center gap-2 ${currentDrug.instructions === opt.value ? 'bg-[#0A4D68] text-white shadow-md scale-105' : 'bg-white text-slate-600 border-2 border-slate-200'}`}
                              style={{ padding: '12px', borderRadius: '12px', fontWeight: 'bold', transition: 'all 0.2s' }}
                            >
                               <i className={`fa-solid ${opt.icon}`}></i> {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button type="button" className="btn btn-primary !bg-[#0A4D68] border-none" style={{ width: '100%', fontWeight: '900', padding: '16px', borderRadius: '14px', fontSize: '15px' }} onClick={handleAddDrug}>
                        <i className="fa-solid fa-plus-circle mr-2"></i> ADD TO PRESCRIPTION
                      </button>
                    </div>

                    {/* Prescribed List (Cleaner Hand-style view) */}
                    {drugs.length > 0 && (
                      <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                         {drugs.map((d, i) => (
                            <div key={i} className="flex justify-between items-center p-4 mb-2" style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                               <div className="flex flex-col">
                                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B' }}>{d.name}</span>
                                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>{d.instructions}</span>
                               </div>
                               <div className="text-right">
                                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#0A4D68' }}>{d.dosage}</div>
                                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{d.duration}</div>
                               </div>
                            </div>
                         ))}
                         <button type="button" className="btn btn-secondary shadow-lg active:scale-95" style={{ width: '100%', marginTop: '10px', padding: '14px', borderRadius: '12px', fontWeight: 'bold' }} onClick={handlePrescribe} disabled={loading}>
                            <i className="fa-solid fa-check-circle mr-2"></i> Finalize ALL Medications
                         </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label !mb-2 !text-[11px] !font-black !uppercase !tracking-wider">Chief Complaints</label>
                    <textarea 
                      className="form-input !bg-white" style={{ height: '80px' }} placeholder="Why is the patient here?" required 
                      value={consultation.chiefComplaints} onChange={e => setConsultation({...consultation, chiefComplaints: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label !mb-2 !text-[11px] !font-black !uppercase !tracking-wider">Examination Findings</label>
                    <textarea 
                      className="form-input !bg-white" style={{ height: '100px' }} placeholder="Clinical exam results..."  
                      value={consultation.examination} onChange={e => setConsultation({...consultation, examination: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label !mb-2 !text-[11px] !font-black !uppercase !tracking-wider">Provisional Diagnosis</label>
                    <input 
                      type="text" className="form-input !bg-white" placeholder="Enter diagnosis..." required 
                      value={consultation.diagnosis} onChange={e => setConsultation({...consultation, diagnosis: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-4 mt-2">
                    <button type="submit" className="btn btn-primary shadow-xl hover:scale-[1.02] active:scale-[0.98]" style={{ flex: 1, padding: '16px', borderRadius: '14px', fontWeight: '900' }} disabled={loading}>
                      {loading ? "Processing..." : "FINALIZE & COMPLETE CONSULTATION"}
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
        )}
      </main>
    </div>
  );
}
