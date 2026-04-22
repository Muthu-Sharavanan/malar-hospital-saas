'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReceiptPrint() {
  const { billId } = useParams();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/bill-summary/${billId}`);
        const data = await res.json();
        if (data.success) setBill(data.bill);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [billId]);

  if (loading) return <div className="p-10 text-center">Loading Receipt...</div>;
  if (!bill) return <div className="p-10 text-center">Receipt Not Found</div>;

  return (
    <div className="print-container" style={{ maxWidth: '600px', margin: '20px auto', padding: '40px', background: 'white', border: '1px solid #ddd', fontFamily: 'serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#0A4D68' }}>MALAR HOSPITAL</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>Opp. Railway Station, Thoothukudi</p>
        <p style={{ margin: 0, fontSize: '14px' }}>Phone: 04362-231234</p>
        <div style={{ margin: '15px 0', borderBottom: '2px solid #0A4D68' }}></div>
        <h3 style={{ margin: 0, textDecoration: 'underline' }}>VISIT SLIP / CLINICAL SUMMARY</h3>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '15px', marginBottom: '30px' }}>
         <div>
            <p><strong>Receipt No:</strong> RE/{bill.id.slice(-6).toUpperCase()}</p>
            <p><strong>Date:</strong> {new Date(bill.createdAt).toLocaleDateString()}</p>
         </div>
         <div style={{ textAlign: 'right' }}>
            <p><strong>Token No:</strong> #{bill.visit.tokenNumber}</p>
            <p><strong>Payment Mode:</strong> {bill.paymentMode || 'CASH'}</p>
         </div>
      </div>

      <div style={{ fontSize: '16px', marginBottom: '40px' }}>
         <p>Received with thanks from <strong>{bill.visit.patient.name}</strong> ({bill.visit.patient.age}Y, {bill.visit.patient.gender[0]})</p>
         {bill.visit.patient.address && <p><strong>Address:</strong> {bill.visit.patient.address}</p>}
         <p>Towards <strong>{bill.type}</strong> consultation/services.</p>
         <p>Consulting Doctor: <strong>{bill.visit.doctor.name}</strong></p>
      </div>

      {/* Amount Table */}
      <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '40px' }}>
         <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Clinical Details:</p>
         <p>Towards <strong>{bill.type}</strong> consultation/services.</p>
         <p>Consulting Doctor: <strong>{bill.visit.doctor.name}</strong></p>
         <p style={{ marginTop: '20px', fontSize: '13px', color: '#64748B' }}>* Please proceed to the clinical area for further assessment.</p>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
         <div style={{ fontSize: '12px' }}>
            <p><em>*This is a computer generated receipt.</em></p>
         </div>
         <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>Cashier Signature</p>
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
         <button className="btn btn-primary" onClick={() => window.print()}>Print Visit Slip</button>
      </div>
    </div>
  );
}
