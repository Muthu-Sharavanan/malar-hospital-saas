import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password, customName } = await req.json();

    const user = await prisma.user.findFirst({
      where: { 
        email,
        name: customName ? {
          contains: customName.replace(/^(dr\.?\s*)+/i, '').trim(),
          mode: 'insensitive'
        } : undefined
      }
    });

    if (!user || user.password !== password) {
       return NextResponse.json({ success: false, error: "Invalid credentials or name mis-match" }, { status: 401 });
    }

    // Set a simple cookie (In a production app, use JWT and iron-session)
    const displayName = customName || user.name;
    const sessionData = JSON.stringify({ id: user.id, role: user.role, name: displayName });
    (await cookies()).set('session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return NextResponse.json({ success: true, user: { name: user.name, role: user.role } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
