import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ReportStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get('userId')?.value;

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!currentUser || !['SUPERADMIN', 'ACCOUNTING', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, cutoffDate, adjustmentAmount, notes } = body;

    if (!userId || !cutoffDate) {
      return NextResponse.json({ error: 'userId and cutoffDate are required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, costPerHour: true, role: true }
    });

    if (!targetUser || targetUser.role !== 'STAFF') {
      return NextResponse.json({ error: 'Target user must be a staff member' }, { status: 400 });
    }

    const selectedDate = new Date(cutoffDate);
    if (Number.isNaN(selectedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid cutoffDate' }, { status: 400 });
    }

    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const rangeEnd = new Date(selectedDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const reports = await prisma.report.findMany({
      where: {
        userId,
        status: { in: [ReportStatus.APPROVED, ReportStatus.LATE] },
        date: {
          gte: monthStart,
          lte: rangeEnd
        }
      },
      select: {
        date: true,
        totalHours: true,
        status: true
      }
    });

    const baseRate = targetUser.costPerHour ?? 0;
    let totalHours = 0;
    let lateHours = 0;
    let baseAmount = 0;
    const workedDayKeys = new Set<string>();

    for (const report of reports) {
      workedDayKeys.add(new Date(report.date).toISOString().slice(0, 10));
      totalHours += report.totalHours;
      if (report.status === ReportStatus.LATE) {
        lateHours += report.totalHours;
        baseAmount += report.totalHours * baseRate * 0.5;
      } else {
        baseAmount += report.totalHours * baseRate;
      }
    }
    const workedDays = workedDayKeys.size;

    const numericAdjustment = Number(adjustmentAmount ?? 0);
    if (Number.isNaN(numericAdjustment)) {
      return NextResponse.json({ error: 'adjustmentAmount must be a number' }, { status: 400 });
    }

    const totalAmount = baseAmount + numericAdjustment;
    const month = monthStart.getMonth() + 1;
    const year = monthStart.getFullYear();

    const existingPayroll = await prisma.monthlyPayroll.findUnique({
      where: {
        userId_month_year: { userId, month, year }
      }
    });

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll record not found. A report must be approved first.' }, { status: 404 });
    }

    const payroll = await prisma.monthlyPayroll.update({
      where: {
        userId_month_year: {
          userId,
          month,
          year
        }
      },
      data: {
        totalHours,
        lateHours,
        totalAmount,
        status: 'DRAFT',
        notes: [
          `Recalculated to ${rangeEnd.toISOString().slice(0, 10)}.`,
          `Worked days: ${workedDays}.`,
          `Total hours: ${totalHours.toFixed(2)}.`,
          `Rate: ${baseRate.toFixed(2)} MMK/hr.`,
          `Base: ${baseAmount.toFixed(2)} MMK.`,
          `Adjustment: ${numericAdjustment.toFixed(2)} MMK.`,
          notes?.trim() ? `Note: ${notes.trim()}` : ''
        ]
          .filter(Boolean)
          .join(' ')
      }
    });

    return NextResponse.json({
      message: 'Payroll calculated and updated',
      payroll,
      userName: targetUser.name,
      workedDays,
      totalHours,
      baseRate,
      baseAmount,
      adjustmentAmount: numericAdjustment,
      totalAmount
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to calculate payroll';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
