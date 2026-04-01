import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // We use upsert to create or update users based on their email.
    // This avoids foreign key constraint errors by keeping the same ID if the account exists.

    const users = [
      { name: 'Dr. Ramaswamy', email: 'ramaswamy@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Dr. Aravind', email: 'aravind@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Nurse Anitha', email: 'nurse@malar.com', password: 'password123', role: 'NURSE' },
      { name: 'Receptionist Susi', email: 'reception@malar.com', password: 'password123', role: 'RECEPTIONIST' },
      { name: 'Pharmacist Ravi', email: 'pharmacy@malar.com', password: 'password123', role: 'PHARMACIST' },
      { name: 'Lab Tech Kumar', email: 'lab@malar.com', password: 'password123', role: 'LAB_TECH' },
      { name: 'Admin Admin', email: 'admin@malar.com', password: 'password123', role: 'ADMIN' },
    ];

    // Seed/Update all users
    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          password: user.password,
          role: user.role as any
        },
        create: {
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role as any
        }
      });
    }

    // SPECIAL CASE: If 'doctor@malar.com' exists, we should probably keep it but update its password 
    // to match Ramaswamy's so it still works if they use the old email, 
    // or we can try to reassign its visits later.
    // For now, let's just update his password too so they aren't locked out.
    await prisma.user.upsert({
      where: { email: 'doctor@malar.com' },
      update: {
        name: 'Dr. Ramaswamy',
        password: 'password123',
        role: 'DOCTOR'
      },
      create: {
        name: 'Dr. Ramaswamy',
        email: 'doctor@malar.com',
        password: 'password123',
        role: 'DOCTOR'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Production database synchronized successfully! You can now login with either ramaswamy@malar.com or the old doctor@malar.com with 'password123'.",
      users: users.map(u => ({ name: u.name, role: u.role }))
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
