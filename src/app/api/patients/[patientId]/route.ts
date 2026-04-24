import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await params;
    const body = await req.json();
    if (body.password !== 'aravind55') return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });

    await prisma.$transaction([
      prisma.prescription.deleteMany({ where: { visit: { patientId } } }),
      prisma.labOrder.deleteMany({ where: { visit: { patientId } } }),
      prisma.surgery.deleteMany({ where: { admission: { patientId } } }),
      prisma.bill.deleteMany({ where: { visit: { patientId } } }),
      prisma.admission.deleteMany({ where: { patientId } }),
      prisma.visit.deleteMany({ where: { patientId } }),
      prisma.patient.delete({ where: { id: patientId } })
    ]);
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error: any) { return NextResponse.json({ success: false, error: error.message }, { status: 500 }); }
}
