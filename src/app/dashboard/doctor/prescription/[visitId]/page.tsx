'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PrescriptionPrint() {
  const { visitId } = useParams();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/visit-summary/${visitId}`);
        const data = await res.json();
        if (data.success) setVisit(data.visit);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [visitId]);

  if (loading) return <div className="p-10">Loading Prescription...</div>;
  if (!visit) return <div className="p-10">Prescription Not Found</div>;

  return (
    <div className="print-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', background: 'white', minHeight: '100vh', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      {/* Hospital Header */}
      <div className="flex justify-between items-center mb-8 pb-4" style={{ borderBottom: '3px solid var(--primary)' }}>
        <div className="flex items-center gap-4">
           {/* Placeholder for Logo */}
           <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>M</div>
           <div>
              <h1 style={{ color: 'var(--primary)', margin: 0, fontSize: '28px' }}>MALAR HOSPITAL</h1>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Caring for you, always.</p>
           </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '13px' }}>
           <p style={{ margin: 0 }}>Opp. Railway Station, Thanjavur</p>
           <p style={{ margin: 0 }}>Tel: 04362-231234, 230987</p>
           <p style={{ margin: 0, fontWeight: 600 }}>Emergency: 9876543210</p>
        </div>
      </div>

      {/* Patient Info Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>Patient Name</small>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>{visit.patient.name}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>Age / Gender</small>
            <span style={{ fontWeight: 600 }}>{visit.patient.age}Y / {visit.patient.gender}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>Date</small>
            <span style={{ fontWeight: 600 }}>{new Date(visit.createdAt).toLocaleDateString()}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>Token Number</small>
            <span style={{ fontWeight: 600 }}>#{visit.tokenNumber}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>OP ID</small>
            <span style={{ fontWeight: 600 }}>{visit.patientId.slice(-6).toUpperCase()}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>Consulting Doctor</small>
            <span style={{ fontWeight: 600 }}>{visit.doctor.name}</span>
         </div>
      </div>

      {/* Vitals Section */}
      <div className="mb-8">
        <h4 style={{ color: 'var(--secondary)', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>Clinical Vitals</h4>
        <div className="flex gap-10">
           <div><small style={{ color: 'var(--text-muted)' }}>BP: </small><span style={{ fontWeight: 600 }}>{visit.bloodPressure}</span></div>
           <div><small style={{ color: 'var(--text-muted)' }}>Pulse: </small><span style={{ fontWeight: 600 }}>{visit.pulse}</span></div>
           <div><small style={{ color: 'var(--text-muted)' }}>SpO₂: </small><span style={{ fontWeight: 600 }}>{visit.spo2}%</span></div>
           <div><small style={{ color: 'var(--text-muted)' }}>Temp: </small><span style={{ fontWeight: 600 }}>{visit.temperature}°F</span></div>
           <div><small style={{ color: 'var(--text-muted)' }}>BMI: </small><span style={{ fontWeight: 600 }}>{visit.bmi}</span></div>
        </div>
      </div>

      {/* Consultation Findings */}
      <div className="mb-8">
        <h4 style={{ color: 'var(--secondary)', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>Clinical Findings</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
           <div>
              <small style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Chief Complaints:</small>
              <p style={{ marginTop: '5px' }}>{visit.chiefComplaints || 'N/A'}</p>
           </div>
           <div>
              <small style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Diagnosis:</small>
              <p style={{ marginTop: '5px', fontWeight: 600 }}>{visit.diagnosis || 'Clinical evaluation pending'}</p>
           </div>
        </div>
      </div>

      {/* Prescription (Rx) */}
      <div className="mb-8" style={{ minHeight: '300px' }}>
        <h3 style={{ borderBottom: '2px solid var(--primary)', display: 'inline-block', marginBottom: '20px' }}>Rx</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '10px', borderBottom: '1px solid #eee' }}>S.No</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Medicine Name</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Dosage</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Duration</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Instructions</th>
            </tr>
          </thead>
          <tbody>
            {visit.prescriptions?.map((p: any, i: number) => (
              <tr key={p.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>{i + 1}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{p.drugName}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>{p.dosage}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>{p.duration}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>{p.instructions || '-'}</td>
              </tr>
            ))}
            {(!visit.prescriptions || visit.prescriptions.length === 0) && (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No medications prescribed.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Suggested Investigations */}
      {visit.labOrders?.length > 0 && (
        <div className="mb-12">
            <h4 style={{ color: 'var(--secondary)', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Investigations Ordered</h4>
            <ul style={{ paddingLeft: '20px' }}>
              {visit.labOrders.map((l: any) => (
                <li key={l.id} style={{ marginBottom: '5px' }}>{l.testName}</li>
              ))}
            </ul>
        </div>
      )}

      {/* Signature Area */}
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '50px' }}>
         <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '5px' }}>
            <p style={{ fontWeight: 600, margin: 0 }}>{visit.doctor.name}</p>
            <small style={{ color: 'var(--text-muted)' }}>Reg No: MC-12345</small>
         </div>
      </div>

      {/* Print Button - Hidden on Print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
        }
      `}</style>
      <div className="no-print" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
         <button 
           className="btn btn-primary" 
           onClick={() => window.print()}
           style={{ padding: '15px 30px', borderRadius: '50px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
         >
           <i className="fa-solid fa-print mr-2"></i> Print Prescription
         </button>
      </div>
    </div>
  );
}
