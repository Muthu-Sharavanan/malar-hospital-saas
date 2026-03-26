import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { 
      visitId, pulse, bloodPressure, spo2, temperature, 
      weight, height, bmi 
    } = await req.json();

    const updatedVisit = await prisma.visit.update({
      where: { id: visitId },
      data: {
        pulse: parseInt(pulse),
        bloodPressure,
        spo2: parseInt(spo2),
        temperature: parseFloat(temperature),
        weight: parseFloat(weight),
        height: parseFloat(height),
        bmi: parseFloat(bmi),
        status: 'VITALS_DONE'
      }
    });

    return NextResponse.json({ success: true, visit: updatedVisit });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Fetch all patients waiting for vitals
    const queue = await prisma.visit.findMany({
      where: {
        status: 'REGISTERED'
      },
      include: {
        patient: true,
        doctor: true
      },
      orderBy: {
        tokenNumber: 'asc'
      }
    });

    return NextResponse.json({ success: true, queue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
