import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, hours, description } = body;

    // Find the time log
    const timeLog = await prisma.timeLog.findUnique({
      where: { id },
      include: { report: true },
    });

    if (!timeLog) {
      return NextResponse.json({ error: 'Time log not found' }, { status: 404 });
    }

    // Check if the user owns this time log
    if (timeLog.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the time log is already part of a submitted report
    if (timeLog.reportId) {
      return NextResponse.json(
        { error: 'Cannot edit time log that has already been submitted in a report' },
        { status: 400 }
      );
    }

    // Validate that the time log is still within the editable window (today, yesterday, or day before)
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const minAllowedDate = new Date(startOfToday);
    minAllowedDate.setDate(minAllowedDate.getDate() - 2);

    const logDay = new Date(timeLog.date);
    logDay.setHours(0, 0, 0, 0);

    if (logDay < minAllowedDate) {
      return NextResponse.json(
        { error: 'This time log is too old to edit. You can only edit logs from today, yesterday, or the day before yesterday.' },
        { status: 400 }
      );
    }

    // Update the time log
    const updatedTimeLog = await prisma.timeLog.update({
      where: { id },
      data: {
        hours: Number(hours),
        description,
      },
    });

    return NextResponse.json(updatedTimeLog, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update time log' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find the time log
    const timeLog = await prisma.timeLog.findUnique({
      where: { id },
      include: { report: true },
    });

    if (!timeLog) {
      return NextResponse.json({ error: 'Time log not found' }, { status: 404 });
    }

    // Check if the user owns this time log
    if (timeLog.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the time log is already part of a submitted report
    if (timeLog.reportId) {
      return NextResponse.json(
        { error: 'Cannot delete time log that has already been submitted in a report' },
        { status: 400 }
      );
    }

    // Delete the time log
    await prisma.timeLog.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Time log deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete time log' }, { status: 500 });
  }
}
