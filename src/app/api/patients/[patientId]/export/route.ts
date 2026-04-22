import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await params;

    const patientData = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        visits: {
          include: {
            doctor: {
              select: { id: true, name: true, role: true }
            },
            prescriptions: true,
            labOrders: true,
            bills: true,
            admission: {
              include: {
                surgeries: true
              }
            }
          }
        },
        admissions: true
      }
    });

    if (!patientData) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }

    // Prepare FHIR-light structure for export
    const exportDocument = {
      resourceType: "Patient",
      id: patientData.uhid,
      abhaId: patientData.abhaId || null,
      identifier: [{ value: patientData.uhid }],
      name: [{ text: patientData.name }],
      telecom: patientData.phone ? [{ system: "phone", value: patientData.phone }] : [],
      gender: patientData.gender.toLowerCase(),
      birthDate: `${new Date().getFullYear() - patientData.age}-01-01`, // Approximation
      address: [{ text: patientData.address || '' }],
      managingOrganization: { display: "Malar Hospital EMR Framework" },
      consentStatus: {
        granted: patientData.consentGranted,
        date: patientData.consentDate
      },
      exportTimestamp: new Date().toISOString(),
      clinicalRecords: patientData.visits.map((v: any) => ({
        visitId: v.id,
        date: v.visitDate,
        practitioner: v.doctor.name,
        vitals: {
          pulse: v.pulse,
          bp: v.bloodPressure,
          spo2: v.spo2,
          temp: v.temperature,
          weight: v.weight,
        },
        clinicalNotes: {
          complaints: v.chiefComplaints,
          history: v.history,
          examination: v.examination,
          diagnosis: v.diagnosis
        },
        prescriptions: v.prescriptions.map((p: any) => ({
          drug: p.drugName,
          dosage: p.dosage,
          duration: p.duration,
          instructions: p.instructions
        })),
        labOrders: v.labOrders.map((l: any) => ({
          test: l.testName,
          status: l.status,
          report: l.reportData
        })),
        financial: v.bills.map((b: any) => ({
          type: b.type,
          amount: b.finalAmount,
          status: b.paymentStatus
        }))
      }))
    };

    // Also Log the Export Action for DPDP Audit
    await prisma.auditLog.create({
      data: {
        patientId: patientData.id,
        action: 'EXPORTED',
        details: JSON.stringify({ reason: 'DSR Request - Portability' })
      }
    });

    return NextResponse.json({ success: true, data: exportDocument });
  } catch (error: any) {
    console.error("Export Patient Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
