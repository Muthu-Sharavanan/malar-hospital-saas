import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password, customName } = await req.json();

    const userByEmail = await prisma.user.findFirst({ where: { email } });
    if (!userByEmail) {
       return NextResponse.json({ success: false, error: "Email address not found" }, { status: 401 });
    }

    const cleanedSearch = customName ? customName.toLowerCase().trim().replace(/^(dr\.?\s*)+/, '') : null;
    const user = await prisma.user.findFirst({
      where: { 
        email,
        name: cleanedSearch ? {
          contains: cleanedSearch,
          mode: 'insensitive'
        } : undefined
      }
    });

    if (!user) {
       return NextResponse.json({ success: false, error: `Name "${customName}" not found for this email` }, { status: 401 });
    }

    // EXTRA RESTRICTION: Only allow aravind or ramaswamy for DOCTOR role
    if (user.role === 'DOCTOR' && cleanedSearch) {
      const allowedDoctors = ['aravind', 'ramaswamy'];
      if (!allowedDoctors.includes(cleanedSearch.toLowerCase())) {
        return NextResponse.json({ 
          success: false, 
          error: "Unauthorized: Only Dr. Aravind and Dr. Ramaswamy are registered for this portal." 
        }, { status: 403 });
      }
    }

    if (user.password !== password) {
       return NextResponse.json({ success: false, error: "Incorrect password" }, { status: 401 });
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
