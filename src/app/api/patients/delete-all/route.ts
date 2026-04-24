import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    if (body.password !== 'aravind55') return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });

    await prisma.$transaction([
      prisma.prescription.deleteMany(),
      prisma.labOrder.deleteMany(),
      prisma.surgery.deleteMany(),
      prisma.bill.deleteMany(),
      prisma.admission.deleteMany(),
      prisma.visit.deleteMany(),
      prisma.patient.deleteMany()
    ]);
    return NextResponse.json({ success: true, message: 'All Deleted' });
  } catch (error: any) { return NextResponse.json({ success: false, error: error.message }, { status: 500 }); }
}
