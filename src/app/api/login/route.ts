import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password, customName } = await req.json();

    // 1. Find user by email first
    const user = await prisma.user.findFirst({ where: { email } });
    
    if (!user) {
       return NextResponse.json({ success: false, error: "Email address not found" }, { status: 401 });
    }

    // 2. Check Password
    if (user.password !== password) {
       return NextResponse.json({ success: false, error: "Incorrect password" }, { status: 401 });
    }

    // 3. Handle Name-based restrictions
    const cleanedSearch = customName ? customName.toLowerCase().trim().replace(/^(dr\.?\s*)+/, '') : '';

    if (user.role === 'DOCTOR') {
      if (!cleanedSearch) {
        return NextResponse.json({ success: false, error: "Doctor Name is required" }, { status: 400 });
      }

      const allowedDoctors = ['aravind', 'ramaswamy'];
      if (!allowedDoctors.includes(cleanedSearch)) {
        return NextResponse.json({ 
          success: false, 
          error: "Unauthorized: Only Dr. Aravind and Dr. Ramaswamy are registered for this portal." 
        }, { status: 403 });
      }

      // Also ensure the customName matches the record in the DB for doctors
      if (!user.name.toLowerCase().includes(cleanedSearch)) {
        return NextResponse.json({ success: false, error: `Name "${customName}" does not match our records for this email.` }, { status: 401 });
      }
    } else {
      // For non-doctors: "Reception can log in with any name"
      // We don't block them if the name doesn't match the DB, but we still use the provided name for the session if available.
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
