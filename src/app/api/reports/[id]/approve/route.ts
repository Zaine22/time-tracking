import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ReportStatus } from '@prisma/client';

async function recalculateMonthlyPayroll(userId: string, reportDate: Date) {
  const month = reportDate.getMonth() + 1;
  const year = reportDate.getFullYear();
  const monthStart = new Date(year, reportDate.getMonth(), 1);
  const monthEnd = new Date(year, reportDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const [user, reports] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { costPerHour: true }
    }),
    prisma.report.findMany({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd
        },
        status: {
          in: [ReportStatus.APPROVED, ReportStatus.LATE]
        }
      },
      select: {
        id: true,
        totalHours: true,
        status: true
      }
    })
  ]);

  const baseRate = user?.costPerHour ?? 0;
  let totalHours = 0;
  let lateHours = 0;
  let totalAmount = 0;

  for (const monthReport of reports) {
    totalHours += monthReport.totalHours;
    const isLate = monthReport.status === ReportStatus.LATE;
    if (isLate) {
      lateHours += monthReport.totalHours;
    }
    const reportCost = monthReport.totalHours * (isLate ? baseRate * 0.5 : baseRate);
    totalAmount += reportCost;

    await prisma.report.update({
      where: { id: monthReport.id },
      data: { totalCost: reportCost }
    });
  }

  if (reports.length === 0) {
    await prisma.monthlyPayroll.deleteMany({
      where: { userId, month, year }
    });
    return;
  }

  await prisma.monthlyPayroll.upsert({
    where: {
      userId_month_year: { userId, month, year }
    },
    update: {
      totalHours,
      lateHours,
      totalAmount
    },
    create: {
      userId,
      month,
      year,
      totalHours,
      lateHours,
      totalAmount,
      status: 'DRAFT'
    }
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body; // Expected: APPROVED or REJECTED

    if (![ReportStatus.APPROVED, ReportStatus.REJECTED].includes(status)) {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }

    // Fetch the target report with user data
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Preserve LATE status when admin "approves" a late report.
    const nextStatus =
      status === ReportStatus.APPROVED && report.status === ReportStatus.LATE
        ? ReportStatus.LATE
        : status;

    // Update the report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: nextStatus,
        totalCost: nextStatus === ReportStatus.REJECTED ? null : undefined
      }
    });

    // Recalculate monthly payroll from reports only (no PaymentRecord table).
    await recalculateMonthlyPayroll(report.userId, new Date(report.date));

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Failed to update report status:', error);
    return NextResponse.json({ error: 'Failed to update report status' }, { status: 500 });
  }
}
