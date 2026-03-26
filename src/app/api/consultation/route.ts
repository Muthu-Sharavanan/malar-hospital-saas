import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const { visitId, status } = await req.json();
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: { status }
    });
    return NextResponse.json({ success: true, visit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { 
      visitId, chiefComplaints, history, examination, diagnosis 
    } = await req.json();

    const visitSearch = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visitSearch) throw new Error("Visit not found");

    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: {
        chiefComplaints,
        history,
        examination,
        diagnosis,
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({ success: true, visit });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Fetch all patients who have vitals done
    const doctorsQueue = await prisma.visit.findMany({
      where: {
        status: { in: ['VITALS_DONE', 'CONSULTING'] }
      },
      include: {
        patient: true,
        doctor: true,
        labOrders: true,
        prescriptions: true
      },
      orderBy: {
        tokenNumber: 'asc'
      }
    });

    return NextResponse.json({ success: true, queue: doctorsQueue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
