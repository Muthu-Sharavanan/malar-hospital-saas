'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FinalBillPrint() {
  const { visitId } = useParams();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const res = await fetch(`/api/consolidated-bill/${visitId}`);
        const data = await res.json();
        if (data.success) setVisit(data.visit);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisit();
  }, [visitId]);

  if (loading) return <div className="p-10 text-center">Loading Visit Summary...</div>;
  if (!visit) return <div className="p-10 text-center">Visit Not Found</div>;

  return (
    <div className="print-container" style={{ maxWidth: '800px', margin: '20px auto', padding: '40px', background: 'white', border: '1px solid #ddd', fontFamily: 'serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#0A4D68' }}>MALAR HOSPITAL</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>Opp. Railway Station, Thoothukudi</p>
        <p style={{ margin: 0, fontSize: '14px' }}>Phone: 04362-231234</p>
        <div style={{ margin: '15px 0', borderBottom: '2px solid #0A4D68' }}></div>
        <h3 style={{ margin: 0, textDecoration: 'underline' }}>CONSOLIDATED VISIT SUMMARY</h3>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '15px', marginBottom: '30px' }}>
         <div>
            <p><strong>Patient Name:</strong> {visit.patient.name}</p>
            <p><strong>Patient ID / UHID:</strong> {visit.patient.uhid}</p>
            <p><strong>Age / Gender:</strong> {visit.patient.age}Y, {visit.patient.gender}</p>
         </div>
         <div style={{ textAlign: 'right' }}>
            <p><strong>Token No:</strong> #{visit.tokenNumber}</p>
            <p><strong>Visit Date:</strong> {new Date(visit.visitDate).toLocaleDateString()}</p>
            <p><strong>Primary Doctor:</strong> {visit.doctor.name}</p>
         </div>
      </div>

      {/* Clinical Breakdown */}
      <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Clinical Activities</h4>
      <div style={{ padding: '10px 0' }}>
         {visit.bills.map((b: any) => (
           <div key={b.id} style={{ marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{b.type} SERVICES</div>
              <div style={{ fontSize: '13px', color: '#444', marginTop: '5px' }}>
                 {b.type === 'LAB' && b.labOrders.map((o:any)=>o.testName).join(', ')}
                 {b.type === 'SURGERY' && "Surgical procedure documented."}
                 {b.type === 'CONSULTATION' && 'General OPD Consultation'}
              </div>
           </div>
         ))}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
         <p><strong>Note:</strong> This document is a clinical summary of the patient's visit. For financial statements or detailed bills, please contact the hospital administration office.</p>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
         <div style={{ fontSize: '12px' }}>
            <p><em>*This is a computer generated clinical summary.</em></p>
         </div>
         <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>Authorized Signatory</p>
         </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { border: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
        }
      `}</style>
      <div className="no-print" style={{ textAlign: 'center', marginTop: '30px' }}>
         <button className="btn btn-primary" onClick={() => window.print()}>Print Visit Summary</button>
      </div>
    </div>
  );
}

