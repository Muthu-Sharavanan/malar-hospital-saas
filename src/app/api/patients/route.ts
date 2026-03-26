import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ success: true, patients: [] });
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } },
          { uhid: { contains: query } }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, patients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
