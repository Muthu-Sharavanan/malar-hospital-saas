import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Seed using upsert for idempotency

    const users = [
      { name: 'Dr. Ramaswamy', email: 'ramaswamy@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Dr. Aravind', email: 'aravind@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Nurse Anitha', email: 'nurse@malar.com', password: 'password123', role: 'NURSE' },
      { name: 'Receptionist Susi', email: 'reception@malar.com', password: 'password123', role: 'RECEPTIONIST' },
      { name: 'Pharmacist Ravi', email: 'pharmacy@malar.com', password: 'password123', role: 'PHARMACIST' },
      { name: 'Lab Tech Kumar', email: 'lab@malar.com', password: 'password123', role: 'LAB_TECH' },
      { name: 'Admin Admin', email: 'admin@malar.com', password: 'password123', role: 'ADMIN' },
    ];

    // AGGRESSIVE CLEANUP: Delete any account with the old email or name variations
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'doctor@malar.com' },
          { name: { contains: 'Ramasamy', mode: 'insensitive' } },
          { name: { contains: 'Ramaswamy', mode: 'insensitive' } }
        ]
      }
    });

    // Create the fresh doctor accounts and others
    for (const user of users) {
      await prisma.user.create({ data: user });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Production database seeded successfully with 6 staff accounts!",
      users: users.map(u => ({ name: u.name, role: u.role }))
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
