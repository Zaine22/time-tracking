import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser || (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'ACCOUNTING' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { totalAmount, status, notes } = body;

    const updatedPayroll = await prisma.monthlyPayroll.update({
      where: { id },
      data: {
        totalAmount: Number(totalAmount),
        status,
        notes
      }
    });

    return NextResponse.json({ message: 'Payroll updated successfully', payroll: updatedPayroll });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update payroll' }, { status: 500 });
  }
}
