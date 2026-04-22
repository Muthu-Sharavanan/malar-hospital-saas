import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    const users = await prisma.user.findMany({
      where: role ? { role } : {},
      select: {
        id: true,
        name: true,
        role: true,
        email: true
      }
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
