import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, age, gender, address, doctorId, patientId } = body;

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
        data: { name, age: parseInt(age), gender, address, phone }
      });
    } else {
      isNewPatient = true;
      const count = await prisma.patient.count();
      const uhid = `MH-${10000 + count + 1}`;
      patient = await prisma.patient.create({
        data: { uhid, name, age: parseInt(age), gender, phone, address }
      });
    }

    // Calculate next token for this doctor today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastVisit = await prisma.visit.findFirst({
      where: {
        doctorId: doctorId,
        visitDate: {
          gte: today
        }
      },
      orderBy: {
        tokenNumber: 'desc'
      }
    });

    const nextToken = lastVisit ? lastVisit.tokenNumber + 1 : 1;

    // 2. Create Visit
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        doctorId,
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
        amount: 500,
        type: 'CONSULTATION',
        paymentStatus: 'UNPAID',
        finalAmount: 500
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
