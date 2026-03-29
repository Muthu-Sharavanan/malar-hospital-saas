import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    
    const yesterday = subDays(today, 1);
    const yStart = startOfDay(yesterday);
    const yEnd = endOfDay(yesterday);

    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // 1. Total Registrations (Today, Month)
    const totalPatients = await prisma.patient.count({
      where: { createdAt: { gte: start, lte: end } }
    });

    const totalPatientsMonth = await prisma.patient.count({
      where: { createdAt: { gte: monthStart, lte: monthEnd } }
    });

    // 2. Collections (Today, Yesterday, Month)
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

    const yesterdayBills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: yStart, lte: yEnd },
        paymentStatus: 'PAID'
      }
    });

    const monthlyBills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        paymentStatus: 'PAID'
      }
    });

    const totalCollection = dailyBills.reduce((sum, bill) => sum + bill.finalAmount, 0);
    const yesterdayCollection = yesterdayBills.reduce((sum, bill) => sum + bill.finalAmount, 0);
    const monthlyCollection = monthlyBills.reduce((sum, bill) => sum + bill.finalAmount, 0);

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

    // 5. 7-Day Trend for Revenue
    const sevenDays = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();
    const trend = await Promise.all(sevenDays.map(async (date) => {
      const dStart = startOfDay(date);
      const dEnd = endOfDay(date);
      const bills = await prisma.bill.findMany({
        where: { createdAt: { gte: dStart, lte: dEnd }, paymentStatus: 'PAID' },
        select: { finalAmount: true }
      });
      return {
        date: format(date, 'MMM dd'),
        amount: bills.reduce((sum, b) => sum + b.finalAmount, 0)
      };
    }));

    // 6. Recent Activity (Last 10 bills)
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
        totalPatientsMonth,
        totalCollection,
        yesterdayCollection,
        monthlyCollection,
        breakdown,
        paymentModes,
        sevenDayTrend: trend,
        recentActivity
      }
    });
  } catch (error: any) {
    console.error("Admin stats fetch failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

