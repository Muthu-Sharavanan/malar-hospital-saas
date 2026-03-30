'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function ReceptionDashboard() {
  const [activeTab, setActiveTab] = useState('register');
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  
  // Billing Modal State
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [billingForm, setBillingForm] = useState({
    discount: 0,
    paymentMode: 'CASH',
    waiverReason: '',
    authorizingDoc: ''
  });

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<{patient: any, history: any[]}|null>(null);

  // Surgery Modal State
  const [showSurgeryModal, setShowSurgeryModal] = useState(false);
  const [surgeryForm, setSurgeryForm] = useState({
    visitId: '',
    patientName: '',
    items: [{ itemName: 'Surgeon Fee', amount: 0 }]
  });

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{title: string, message: string, token: string, uhid?: string}|null>(null);

  // Duplicate Alert State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{name: string, uhid: string}|null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    address: '',
    doctorId: '',
    patientId: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [doctors, setDoctors] = useState<any[]>([]);

  const fetchDoctors = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/users?role=DOCTOR&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setDoctors(data.users);
        if (data.users.length > 0 && !formData.doctorId) {
          setFormData(prev => ({ ...prev, doctorId: data.users[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/register');
      const data = await res.json();
      if (data.success) setQueue(data.visits || data.queue || []);
    } catch (err) {
      console.error("Failed to fetch queue", err);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/billing');
      const data = await res.json();
      if (data.success) setBills(data.bills);
    } catch (err) {
      console.error("Failed to fetch bills", err);
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

  const fetchPatients = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/patients?q=${query}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.patients);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error("Failed to fetch patients", err);
    }
  };

  const fetchHistory = async (patientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${patientId}/history`);
      const data = await res.json();
      if (data.success) {
        setHistoryData({ patient: data.patient, history: data.history });
        setShowHistoryModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = (patient: any) => {
    setFormData({
      ...formData,
      patientId: patient.id,
      name: patient.name,
      phone: patient.phone || '',
      age: patient.age.toString(),
      gender: patient.gender,
      address: patient.address || ''
    });
    setSearchQuery(patient.phone || patient.name);
    setShowSearchResults(false);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (activeTab === 'register') fetchDoctors();
    if (activeTab === 'queue') fetchQueue();
    if (activeTab === 'billing') {
      fetchBills();
      fetchDoctors();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessInfo({
          title: data.isNewPatient ? "New Patient Registered!" : "Registration Successful!",
          message: data.isNewPatient ? `A new permanent ID has been created for ${formData.name}.` : `Returning patient ${formData.name} has been added to the queue.`,
          token: data.visit.tokenNumber,
          uhid: data.uhid
        });
        setShowSuccessModal(true);
        setFormData({ name: '', phone: '', age: '', gender: 'Male', address: '', doctorId: doctors[0]?.id || '', patientId: '' });
        setSearchQuery('');
        setActiveTab('queue'); 
        fetchQueue();
      } else if (res.status === 409) {
        setDuplicateInfo({ name: formData.name, uhid: data.uhid });
        setShowDuplicateModal(true);
      } else {
        alert("Registration failed: " + data.error);
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isRefund = selectedBill?.paymentStatus === 'PAID';

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          billId: selectedBill.id, 
          paymentStatus: isRefund ? 'REFUNDED' : 'PAID',
          discount: isRefund ? 0 : billingForm.discount,
          paymentMode: billingForm.paymentMode,
          waiverReason: isRefund ? '' : billingForm.waiverReason,
          refundAmount: isRefund ? billingForm.discount : 0, 
          refundReason: isRefund ? billingForm.waiverReason : '', 
          authorizingDocId: billingForm.authorizingDoc
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowBillModal(false);
        fetchBills();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar-container">
      {/* Sidebar Overlay (Mobile) */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar-fixed ${isSidebarOpen ? 'open' : ''}`} style={{ width: '250px', background: 'var(--primary)', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-between items-center mb-10 px-2">
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Malar HMS</h2>
          <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(false)}>
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <nav className="flex flex-col gap-2" style={{ flex: 1 }}>
          <button 
             className={`sidebar-pill ${activeTab === 'register' ? 'active' : ''}`}
             onClick={() => { setActiveTab('register'); setIsSidebarOpen(false); }}
          >
            <i className="fa-solid fa-user-plus mr-3"></i> Register Patient
          </button>
          <button 
             className={`sidebar-pill ${activeTab === 'queue' ? 'active' : ''}`}
             onClick={() => { setActiveTab('queue'); setIsSidebarOpen(false); }}
          >
            <i className="fa-solid fa-list-ol mr-3"></i> Active Queue
          </button>
          <button 
             className={`sidebar-pill ${activeTab === 'doctors' ? 'active' : ''}`}
             onClick={() => { setActiveTab('doctors'); setIsSidebarOpen(false); }}
          >
             <i className="fa-solid fa-user-doctor mr-3"></i> Doctors List
          </button>
          <button 
             className={`sidebar-pill ${activeTab === 'billing' ? 'active' : ''}`}
             onClick={() => { setActiveTab('billing'); setIsSidebarOpen(false); }}
          >
            <i className="fa-solid fa-file-invoice-dollar mr-3"></i> Billing Center
          </button>
        </nav>
        <LogoutButton />
      </aside>

      {/* Main Content */}
      <main className="content-main" style={{ flex: 1, backgroundColor: 'var(--bg-light)', padding: '30px', transition: 'all 0.3s' }}>
        <header className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-4">
             <button className="hamburger-btn lg:hidden" onClick={() => setIsSidebarOpen(true)}>
               <i className="fa-solid fa-bars"></i>
             </button>
             <div>
               <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>Welcome, {userName || 'Malar Staff'}</h1>
               <p style={{ color: 'var(--text-muted)' }}>Reception Dashboard | {shift} Shift</p>
             </div>
           </div>
           
           <div className="hidden md:flex items-center gap-4">
             <div style={{ color: 'var(--text-muted)', fontSize: '14px', background: 'white', padding: '8px 15px', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
               <i className="fa-solid fa-calendar-alt mr-2"></i>
               {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
             </div>
           </div>
        </header>

        {showBillModal && selectedBill && (
          <div className="modal-overlay">
            <div className="glass-card modal-content" style={{ width: '500px' }}>
               <h3 style={{ marginBottom: '20px' }}>{selectedBill.paymentStatus === 'PAID' ? 'Issue Refund' : `Manage Bill: ${selectedBill.type}`}</h3>
               <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '20px' }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: 'var(--text-muted)' }}>Patient</span>
                    <span style={{ fontWeight: 'bold' }}>{selectedBill.visit.patient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{selectedBill.paymentStatus === 'PAID' ? 'Amount Paid' : 'Original Amount'}</span>
                    <span style={{ fontWeight: 'bold' }}>₹{selectedBill.paymentStatus === 'PAID' ? selectedBill.finalAmount : selectedBill.amount}</span>
                  </div>
               </div>

               <form onSubmit={handleUpdateBill}>
                  <div className="form-group">
                    <label className="form-label">{selectedBill.paymentStatus === 'PAID' ? 'Refund Amount (₹)' : 'Apply Discount (₹)'}</label>
                    <input 
                      type="number" className="form-input" placeholder="0"
                      max={selectedBill.paymentStatus === 'PAID' ? selectedBill.finalAmount : undefined}
                      value={billingForm.discount} onChange={e => setBillingForm({...billingForm, discount: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  {billingForm.discount > 0 && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Authorizing Doctor (Required)</label>
                        <select 
                          className="form-input" required
                          value={billingForm.authorizingDoc} onChange={e => setBillingForm({...billingForm, authorizingDoc: e.target.value})}
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map((doc: any) => (
                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{selectedBill.paymentStatus === 'PAID' ? 'Refund Reason' : 'Waiver Reason'}</label>
                        <select 
                          className="form-input" required
                          value={billingForm.waiverReason} onChange={e => setBillingForm({...billingForm, waiverReason: e.target.value})}
                        >
                          {selectedBill.paymentStatus === 'PAID' ? (
                            <>
                              <option>Service Cancelled</option>
                              <option>Patient Dissatisfied</option>
                              <option>Billing Error</option>
                              <option>Doctor Discretion</option>
                            </>
                          ) : (
                            <>
                              <option>Economically Poor</option>
                              <option>Family / Staff</option>
                              <option>Doctor Discretion</option>
                            </>
                          )}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label">{selectedBill.paymentStatus === 'PAID' ? 'Refund Mode' : 'Payment Mode'}</label>
                    <select 
                      className="form-input"
                      value={billingForm.paymentMode} onChange={e => setBillingForm({...billingForm, paymentMode: e.target.value})}
                    >
                      <option>CASH</option>
                      <option>UPI</option>
                      <option>CARD</option>
                    </select>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowBillModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                       {loading ? "Processing..." : selectedBill.paymentStatus === 'PAID' ? `Confirm Refund ₹${billingForm.discount || 0}` : `Collect ₹${selectedBill.amount - (billingForm.discount || 0)}`}
                    </button>
                  </div>
               </form>
            </div>
          </div>
        )}

        {showSurgeryModal && (
          <div className="modal-overlay">
            <div className="glass-card modal-content" style={{ width: '500px' }}>
              <div className="flex justify-between items-center mb-6">
                <h3>Add Surgery Bill: {surgeryForm.patientName}</h3>
                <button className="btn btn-outline" style={{ padding: '5px 10px' }} onClick={() => setShowSurgeryModal(false)}>Cancel</button>
              </div>
              
              <div className="flex flex-col gap-3 mb-6">
                {surgeryForm.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" className="form-input" placeholder="Item Name (e.g. OT Charge)" style={{ flex: 2 }}
                      value={item.itemName} onChange={e => {
                        const newItems = [...surgeryForm.items];
                        newItems[idx].itemName = e.target.value;
                        setSurgeryForm({...surgeryForm, items: newItems});
                      }}
                    />
                    <input 
                      type="number" className="form-input" placeholder="Amount" style={{ flex: 1 }}
                      value={item.amount} onChange={e => {
                        const newItems = [...surgeryForm.items];
                        newItems[idx].amount = parseFloat(e.target.value) || 0;
                        setSurgeryForm({...surgeryForm, items: newItems});
                      }}
                    />
                    <button type="button" className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => {
                       const newItems = surgeryForm.items.filter((_, i) => i !== idx);
                       setSurgeryForm({...surgeryForm, items: newItems});
                    }}><i className="fa-solid fa-trash"></i></button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline w-fit" onClick={() => setSurgeryForm({...surgeryForm, items: [...surgeryForm.items, {itemName: '', amount: 0}]})}>
                  + Add Item
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '20px' }}>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>₹{surgeryForm.items.reduce((sum: number, i: any) => sum + i.amount, 0)}</span>
                </div>
              </div>

              <button 
                className="btn btn-primary w-full"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const res = await fetch('/api/billing', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        visitId: surgeryForm.visitId,
                        type: 'SURGERY',
                        surgeryCharges: surgeryForm.items,
                        paymentStatus: 'UNPAID'
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setShowSurgeryModal(false);
                      alert("Surgery bill created successfully!");
                      fetchBills();
                    }
                  } catch (err) { alert("Failed to create surgery bill"); }
                  finally { setLoading(false); }
                }}
              >
                Create Surgery Bill
              </button>
            </div>
          </div>
        )}

        {showDuplicateModal && duplicateInfo && (
          <div className="modal-overlay">
            <div className="glass-card modal-content" style={{ width: '400px', textAlign: 'center', borderColor: 'var(--accent)' }}>
              <div style={{ fontSize: '50px', color: 'var(--accent)', marginBottom: '20px' }}>
                <i className="fa-solid fa-circle-exclamation underline-accent"></i>
              </div>
              <h3 style={{ marginBottom: '10px' }}>Patient Already Exists</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                <strong>{duplicateInfo.name}</strong> is already registered in our system.
              </p>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', display: 'block', color: 'var(--text-muted)' }}>Existing Patient ID</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>{duplicateInfo.uhid}</span>
              </div>

              <p style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--text-muted)' }}>
                Please use the search bar to find and select this patient if they are returning for a new visit.
              </p>

              <button className="btn btn-accent" style={{ width: '100%' }} onClick={() => setShowDuplicateModal(false)}>
                Got it, Thanks!
              </button>
            </div>
          </div>
        )}

        {showSuccessModal && successInfo && (
          <div className="modal-overlay">
            <div className="glass-card modal-content animate-fade-in" style={{ width: '400px', textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '50px', color: '#10b981', marginBottom: '20px' }}>
                 <i className="fa-solid fa-circle-check"></i>
              </div>
              <h2 style={{ marginBottom: '10px' }}>{successInfo.title}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>{successInfo.message}</p>
              
              <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
                 <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>Token assigned</div>
                 <div style={{ fontSize: '36px', fontWeight: 'bold' }}>#{successInfo.token}</div>
                 {successInfo.uhid && (
                   <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>Patient ID (Lifelong)</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{successInfo.uhid}</div>
                   </div>
                 )}
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowSuccessModal(false)}>
                Awesome, Got it!
              </button>
            </div>
          </div>
        )}

        {showHistoryModal && historyData && (
          <div className="modal-overlay">
            <div className="glass-card modal-content" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
               <div className="flex justify-between items-center mb-4">
                  <h3>Patient History: {historyData.patient.name}</h3>
                  <button className="btn btn-outline" style={{ padding: '5px 10px' }} onClick={() => setShowHistoryModal(false)}>Close</button>
               </div>
               <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>
                  <strong>UHID:</strong> {historyData.patient.uhid} | <strong>Phone:</strong> {historyData.patient.phone} | <strong>Age/Gender:</strong> {historyData.patient.age}Y, {historyData.patient.gender}
               </div>

               {historyData.history.length === 0 ? (
                 <p className="text-center" style={{ color: 'var(--text-muted)' }}>No previous visits found.</p>
               ) : (
                 <div className="flex flex-col gap-4">
                   {historyData.history.map((v: any) => (
                      <div key={v.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '15px', background: 'white' }}>
                         <div className="flex justify-between items-center mb-2" style={{ borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                           <span style={{ fontWeight: 'bold' }}>{new Date(v.visitDate).toLocaleDateString()}</span>
                           <span className="badge badge-primary">Dr. {v.doctor.name}</span>
                         </div>
                         <div style={{ fontSize: '13px', marginTop: '10px' }}>
                           {v.diagnosis && <p><strong>Diagnosis:</strong> {v.diagnosis}</p>}
                           {v.chiefComplaints && <p><strong>Complaints:</strong> {v.chiefComplaints}</p>}
                           
                           {v.prescriptions?.length > 0 && (
                             <div className="mt-2 text-xs">
                               <strong>Prescriptions:</strong> {v.prescriptions.map((p: any) => p.drugName).join(', ')}
                             </div>
                           )}
                           {v.labOrders?.length > 0 && (
                             <div className="mt-1 text-xs">
                               <strong>Lab Tests:</strong> {v.labOrders.map((l: any) => l.testName).join(', ')}
                             </div>
                           )}
                         </div>
                      </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="glass-card animate-fade-in delay-100" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>New Patient Registration</h2>
              <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search Phone / Name..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchPatients(e.target.value);
                  }}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  style={{ paddingLeft: '35px', width: '100%' }}
                />
                <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                
                {showSearchResults && searchResults.length > 0 && (
                  <div className="glass-card" style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 100, padding: '10px', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'var(--bg-card)' }}>
                    {searchResults.map((p: any) => (
                      <div 
                        key={p.id} 
                        className="search-result-item" 
                        style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border)', borderRadius: '4px', transition: 'background 0.2s' }}
                        onClick={() => selectPatient(p)}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 'bold' }}>{p.name} <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{p.uhid}</span></div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.phone} | {p.age}Y | {p.gender}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-8">
              <div className="responsive-grid responsive-grid-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ fontSize: '11px' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Patient Name"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ fontSize: '11px' }}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="responsive-grid responsive-grid-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ fontSize: '11px' }}>Age</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 35"
                    className="form-input"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ fontSize: '11px' }}>Gender</label>
                  <select
                    className="form-input"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ fontSize: '11px' }}>Address</label>
                <textarea
                  placeholder="Complete Address"
                  className="form-input min-h-[80px]"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>

              <div className="responsive-grid responsive-grid-2 items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ fontSize: '11px' }}>Consulting Doctor</label>
                  <div className="flex gap-2">
                    <select
                      className="form-input flex-1"
                      value={formData.doctorId}
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doc: any) => (
                        <option key={doc.id} value={doc.id}>Dr. {doc.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className={`btn btn-outline btn-icon-circle ${isRefreshing ? 'animate-spin-once' : ''}`}
                      title="Refresh Doctors List"
                      onClick={fetchDoctors}
                    >
                      <i className="fa-solid fa-rotate"></i>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="p-3 px-4 bg-orange-50 text-orange-700 rounded-lg text-sm font-bold border border-orange-100 uppercase tracking-wider text-center">
                    OPD FEE: ₹500
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary mt-4 w-full md:w-auto md:self-end text-lg py-3 px-8"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Generate Token & Register'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="glass-card animate-fade-in" style={{ width: '100%' }}>
            <div className="flex justify-between items-center mb-6">
              <h3>Today's Active Queue</h3>
              <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={fetchQueue}>Refresh</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px' }}>Token</th>
                  <th style={{ padding: '12px' }}>Patient</th>
                  <th style={{ padding: '12px' }}>Doctor</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.length > 0 ? queue.map((v: any) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>#{v.tokenNumber}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{v.patient.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--primary)' }}>{v.patient.uhid}</div>
                    </td>
                    <td style={{ padding: '12px' }}>{v.doctor.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${
                        v.status === 'REGISTERED' ? 'badge-warning' : 
                        v.status === 'VITALS_DONE' ? 'badge-primary' :
                        v.status === 'CONSULTING' ? 'badge-accent' : 'badge-success'
                      }`}>
                        {v.status === 'REGISTERED' && 'Wait: Nursing'}
                        {v.status === 'VITALS_DONE' && 'Wait: Doctor'}
                        {v.status === 'CONSULTING' && 'In Consultation'}
                        {v.status === 'COMPLETED' && 'OPD Done'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => fetchHistory(v.patientId)}
                        disabled={loading}
                      >
                        <i className="fa-solid fa-clock-rotate-left mr-1"></i> View History
                      </button>
                      
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '5px 10px', fontSize: '12px', marginLeft: '5px' }}
                        onClick={() => {
                          setSurgeryForm({
                            visitId: v.id,
                            patientName: v.patient.name,
                            items: [
                              { itemName: 'Surgeon Fee', amount: 0 },
                              { itemName: 'OT Charges', amount: 0 },
                              { itemName: 'Anesthesia', amount: 0 }
                            ]
                          });
                          setShowSurgeryModal(true);
                        }}
                      >
                        + Surgery Bill
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No patients in queue yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="glass-card animate-fade-in" style={{ width: '100%' }}>
            <div className="flex justify-between items-center mb-6">
              <h3>Billing Center</h3>
              <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={fetchBills}>Refresh</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px' }}>Patient</th>
                  <th style={{ padding: '12px' }}>Type</th>
                  <th style={{ padding: '12px' }}>Items</th>
                  <th style={{ padding: '12px' }}>Amount</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.length > 0 ? bills.map((b: any) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                       <strong>{b.visit.patient.name}</strong>
                       <div style={{ fontSize: '11px', color: 'var(--primary)' }}>{b.visit.patient.uhid}</div>
                       <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Token #{b.visit.tokenNumber}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                       <span className="badge" style={{ background: b.type === 'LAB' ? '#e0f2fe' : '#fef3c7', color: b.type === 'LAB' ? '#0369a1' : '#92400e' }}>
                          {b.type}
                       </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                       {b.type === 'LAB' && b.labOrders?.map((o: any) => o.testName).join(', ')}
                       {b.type === 'SURGERY' && b.surgeryItemization && (
                         <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                           {JSON.parse(b.surgeryItemization).map((i: any) => `${i.itemName} (₹${i.amount})`).join(', ')}
                         </div>
                       )}
                       {b.type === 'PHARMACY' && 'Pharmacy Items'}
                       {b.type === 'CONSULTATION' && 'Consultation Fee'}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{b.finalAmount}</td>
                    <td style={{ padding: '12px' }}>
                      <div className="flex gap-2">
                        {b.paymentStatus === 'UNPAID' ? (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '5px 15px', fontSize: '11px' }} 
                            onClick={() => { setSelectedBill(b); setBillingForm({...billingForm, discount: 0, waiverReason: ''}); setShowBillModal(true); }}
                          >
                            Collect Payment
                          </button>
                        ) : (
                          <>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '5px 15px', fontSize: '11px' }} 
                              onClick={() => window.open(b.type === 'LAB' ? `/dashboard/reception/lab-slip/${b.id}` : `/dashboard/reception/receipt/${b.id}`, '_blank')}
                            >
                              Print {b.type === 'LAB' ? 'Lab Slip' : 'Receipt'}
                            </button>
                            {b.paymentStatus === 'PAID' && (
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '5px 15px', fontSize: '11px', borderColor: 'var(--danger)', color: 'var(--danger)' }} 
                                onClick={() => { setSelectedBill(b); setBillingForm({...billingForm, discount: 0, waiverReason: ''}); setShowBillModal(true); }}
                              >
                                Refund
                              </button>
                            )}
                          </>
                        )}
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '5px 15px', fontSize: '11px' }} 
                          onClick={() => window.open(`/dashboard/reception/final-bill/${b.visit.id}`, '_blank')}
                        >
                          <i className="fa-solid fa-file-invoice mr-1"></i> Full Visit Bill
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No bills found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="glass-card animate-fade-in" style={{ width: '100%' }}>
            <div className="flex justify-between items-center mb-6">
              <h3>Available Doctors</h3>
              <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={fetchDoctors}>Refresh</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px' }}>Doctor Name</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length > 0 ? doctors.map((doc: any) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{doc.name}</td>
                    <td style={{ padding: '12px' }}>{doc.role}</td>
                    <td style={{ padding: '12px' }}>{doc.email}</td>
                    <td style={{ padding: '12px' }}>
                       <span className="badge badge-success">Available</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No doctors registered in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
