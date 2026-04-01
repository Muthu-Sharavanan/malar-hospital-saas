import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // 1. Remove the legacy doctor account to prevent duplicates
    await prisma.user.deleteMany({
      where: { email: 'doctor@malar.com' }
    });

    const users = [
      { name: 'Dr. Ramaswamy', email: 'ramaswamy@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Dr. Aravind', email: 'aravind@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Nurse Anitha', email: 'nurse@malar.com', password: 'password123', role: 'NURSE' },
      { name: 'Receptionist Susi', email: 'reception@malar.com', password: 'password123', role: 'RECEPTIONIST' },
      { name: 'Pharmacist Ravi', email: 'pharmacy@malar.com', password: 'password123', role: 'PHARMACIST' },
      { name: 'Lab Tech Kumar', email: 'lab@malar.com', password: 'password123', role: 'LAB_TECH' },
      { name: 'Admin Admin', email: 'admin@malar.com', password: 'password123', role: 'ADMIN' },
    ];

    // 2. Seed/Update all users
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

    return NextResponse.json({ 
      success: true, 
      message: "Production database synchronized successfully! Duplicate 'doctor@malar.com' has been removed.",
      users: users.map(u => ({ name: u.name, role: u.role }))
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
