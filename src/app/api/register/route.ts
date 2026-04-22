import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, age, gender, address, doctorId, patientId, abhaId, consentGranted } = body;

    // 1. Check for EXACT duplicate (Name + Phone) if this is a manual entry (no patientId)
    if (!patientId) {
      const existing = await prisma.patient.findFirst({
        where: {
          name: { equals: name }, // Case-insensitive handled by DB collation usually, but let's be safe if needed
          phone: phone
        }
      });
      if (existing) {
        return NextResponse.json({ 
          success: false, 
          error: "Patient already exists with this name and number", 
          uhid: existing.uhid 
        }, { status: 409 });
      }
    }

    let patient;
    let isNewPatient = false;

    if (patientId) {
      // Use the selected patient
      patient = await prisma.patient.update({
        where: { id: patientId },
        data: { name, age: parseInt(age), gender, address, phone, abhaId: abhaId || null, consentGranted: Boolean(consentGranted), consentDate: consentGranted ? new Date() : null }
      });
    } else {
      isNewPatient = true;
      // More robust UHID generation: get the highest UHID and increment
      const lastPatient = await prisma.patient.findFirst({
        orderBy: { uhid: 'desc' }
      });
      
      let nextUhidNum = 10001;
      if (lastPatient && lastPatient.uhid.startsWith('MH-')) {
        const lastNum = parseInt(lastPatient.uhid.split('-')[1]);
        if (!isNaN(lastNum)) {
          nextUhidNum = lastNum + 1;
        }
      }
      
      const uhid = `MH-${nextUhidNum}`;
      patient = await prisma.patient.create({
        data: { uhid, name, age: parseInt(age), gender, phone, address, abhaId: abhaId || null, consentGranted: Boolean(consentGranted), consentDate: consentGranted ? new Date() : null }
      });
    }

    // Calculate NEXT GLOBAL TOKEN for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastVisit = await prisma.visit.findFirst({
      where: {
        visitDate: {
          gte: today
        }
      },
      orderBy: {
        tokenNumber: 'desc'
      }
    });

    const nextToken = lastVisit ? lastVisit.tokenNumber + 1 : 1;

    const selectedDoc = await prisma.user.findUnique({ where: { id: doctorId } });
    const assignedDoctorName = selectedDoc?.name || 'Unknown';

    // 2. Create Visit
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        doctorId,
        assignedDoctorName,
        tokenNumber: nextToken,
        status: 'REGISTERED'
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    // 3. Create Initial Bill (Consultation)
    await prisma.bill.create({
      data: {
        visitId: visit.id,
        amount: 200,
        type: 'CONSULTATION',
        paymentStatus: 'UNPAID',
        finalAmount: 200
      }
    });

    return NextResponse.json({ success: true, visit, isNewPatient, uhid: patient.uhid });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visits = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: today
        }
      },
      include: {
        patient: true,
        doctor: true,
        bills: true
      },
      orderBy: {
        tokenNumber: 'asc'
      }
    });

    return NextResponse.json({ success: true, visits });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
