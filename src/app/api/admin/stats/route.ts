import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // 1. Total Registrations Today
    const totalPatients = await prisma.patient.count({
      where: {
        createdAt: { gte: start, lte: end }
      }
    });

    // 2. Today's Collections (PAID bills)
    const dailyBills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: 'PAID'
      },
      include: {
        visit: {
          include: {
            patient: true
          }
        }
      }
    });

    const totalCollection = dailyBills.reduce((sum, bill) => sum + bill.finalAmount, 0);

    // 3. Collections Breakdown by Type
    const breakdown = dailyBills.reduce((acc: any, bill) => {
      acc[bill.type] = (acc[bill.type] || 0) + bill.finalAmount;
      return acc;
    }, {});

    // 4. Collections Breakdown by Payment Mode
    const paymentModes = dailyBills.reduce((acc: any, bill) => {
      const mode = bill.paymentMode || 'UNSPECIFIED';
      acc[mode] = (acc[mode] || 0) + bill.finalAmount;
      return acc;
    }, {});

    // 5. Recent Activity (Last 10 bills)
    const recentActivity = dailyBills.slice(-10).reverse().map(bill => ({
      id: bill.id,
      patientName: bill.visit.patient.name,
      amount: bill.finalAmount,
      type: bill.type,
      paymentMode: bill.paymentMode,
      time: bill.createdAt
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalPatients,
        totalCollection,
        breakdown,
        paymentModes,
        recentActivity
      }
    });
  } catch (error: any) {
    console.error("Admin stats fetch failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
