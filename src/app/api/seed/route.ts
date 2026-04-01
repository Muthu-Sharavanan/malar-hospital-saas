import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const oldEmail = 'doctor@malar.com';
    const newEmail = 'ramaswamy@malar.com';

    // 1. Find both users
    const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });
    const newUser = await prisma.user.findUnique({ where: { email: newEmail } });

    if (oldUser && newUser && oldUser.id !== newUser.id) {
      console.log(`Reassigning data from ${oldEmail} (${oldUser.id}) to ${newEmail} (${newUser.id})...`);
      
      // Reassign Visits
      await prisma.visit.updateMany({
        where: { doctorId: oldUser.id },
        data: { doctorId: newUser.id }
      });

      // Reassign Surgeries (if any)
      await prisma.surgery.updateMany({
        where: { surgeonId: oldUser.id },
        data: { surgeonId: newUser.id }
      });

      // Reassign Bills (if any authorizingDocId matches)
      await prisma.bill.updateMany({
        where: { authorizingDocId: oldUser.id },
        data: { authorizingDocId: newUser.id }
      });

      // 2. Safely delete the old doctor account
      await prisma.user.delete({
        where: { id: oldUser.id }
      });
      console.log(`Successfully deleted legacy account: ${oldEmail}`);
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

    // 3. Seed/Update all users
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
      message: "Database cleanup and synchronization complete! Duplicate doctor account reassigned and removed.",
      users: users.map(u => ({ name: u.name, role: u.role }))
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
