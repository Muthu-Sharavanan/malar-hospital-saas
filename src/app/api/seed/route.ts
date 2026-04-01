import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const oldEmail = 'doctor@malar.com';
    const newEmail = 'ramaswamy@malar.com';

    // 1. Ensure the NEW user exists first so we have a valid target ID
    const newUser = await prisma.user.upsert({
      where: { email: newEmail },
      update: {
        name: 'Dr. Ramaswamy',
        password: 'password123',
        role: 'DOCTOR'
      },
      create: {
        name: 'Dr. Ramaswamy',
        email: newEmail,
        password: 'password123',
        role: 'DOCTOR'
      }
    });

    // 2. Find the old user
    const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });

    if (oldUser && oldUser.id !== newUser.id) {
      console.log(`Reassigning data from ${oldUser.id} to ${newUser.id}...`);
      
      // Use a transaction to ensure all-or-nothing reassignment
      await prisma.$transaction([
        prisma.visit.updateMany({
          where: { doctorId: oldUser.id },
          data: { doctorId: newUser.id }
        }),
        prisma.surgery.updateMany({
          where: { surgeonId: oldUser.id },
          data: { surgeonId: newUser.id }
        }),
        prisma.bill.updateMany({
          where: { authorizingDocId: oldUser.id },
          data: { authorizingDocId: newUser.id }
        }),
        // DELETE the old user only after everything is reassigned
        prisma.user.delete({
          where: { id: oldUser.id }
        })
      ]);
      console.log("Reassignment and legacy account deletion successful.");
    }

    const users = [
      { name: 'Dr. Ramaswamy', email: 'ramaswamy@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Dr. Aravind', email: 'aravind@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Nurse Anitha', email: 'nurse@malar.com', password: 'password123', role: 'NURSE' },
      { name: 'Receptionist Susi', email: 'reception@malar.com', password: 'password123', role: 'RECEPTIONIST' },
      { name: 'Pharmacist Ravi', email: 'pharmacy@malar.com', password: 'password123', role: 'PHARMACIST' },
      { name: 'Lab Tech Kumar', email: 'lab@malar.com', password: 'password123', role: 'LAB_TECH' },
      { name: 'Admin Admin', email: 'admin@malar.com', password: 'password123', role: 'ADMIN' },
    ];

    // 4. Seed/Update all other users (mostly for roles/passwords integrity)
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
      message: "Database cleanup and synchronization complete! Duplicate doctor account reassigned and removed using transaction.",
      users: users.map(u => ({ name: u.name, role: u.role }))
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
