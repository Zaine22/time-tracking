import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = currentUser.role === 'STAFF';
    const canManagePayroll = ['SUPERADMIN', 'ACCOUNTING'].includes(currentUser.role);

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const monthFilter = searchParams.get('month');
    const userFilter = searchParams.get('userId');
    const statusFilter = searchParams.get('status');

    let filterMonth: number | undefined;
    let filterYear: number | undefined;
    if (monthFilter) {
      const [yearPart, monthPart] = monthFilter.split('-');
      const parsedYear = Number(yearPart);
      const parsedMonth = Number(monthPart);
      if (!Number.isNaN(parsedYear) && !Number.isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        filterYear = parsedYear;
        filterMonth = parsedMonth;
      }
    }

    // Build where clause
    const whereClause: {
      userId?: string;
      month?: number;
      year?: number;
      status?: string;
    } = {};

    if (isStaff) {
      whereClause.userId = currentUser.id;
    } else if (canManagePayroll) {
      if (userFilter) whereClause.userId = userFilter;
      if (statusFilter) whereClause.status = statusFilter;
      if (filterMonth && filterYear) {
        whereClause.month = filterMonth;
        whereClause.year = filterYear;
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payrollList = await prisma.monthlyPayroll.findMany({
      where: whereClause,
      include: {
        user: true
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { user: { name: 'asc' } }]
    });

    return NextResponse.json(payrollList);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payroll records';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
