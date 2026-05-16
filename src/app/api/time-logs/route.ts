import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, projectId, date, hours, description } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'A project must be selected.' }, { status: 400 });
    }

    const logDate = new Date(date);
    if (Number.isNaN(logDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date provided' }, { status: 400 });
    }

    // Allow calendar-day window: today and the previous 2 days (no future dates).
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const minAllowedDate = new Date(startOfToday);
    minAllowedDate.setDate(minAllowedDate.getDate() - 2);

    const logDay = new Date(logDate);
    logDay.setHours(0, 0, 0, 0);

    if (logDay > startOfToday || logDay < minAllowedDate) {
      return NextResponse.json(
        { error: 'You can only submit a record for today, yesterday, or the day before yesterday.' },
        { status: 400 }
      );
    }

    // Validate the user is assigned to this project
    const assignment = await prisma.projectUser.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'You are not assigned to this project.' }, { status: 403 });
    }

    // Enforce one time log per user per project per calendar day
    const dayStart = new Date(logDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(logDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.timeLog.findFirst({
      where: {
        userId,
        projectId,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      const projectName =
        (await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }))
          ?.name ?? 'this project';
      return NextResponse.json(
        {
          error: `You already have a time log for ${projectName} on ${logDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}.`,
        },
        { status: 409 }
      );
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        userId,
        projectId,
        date: new Date(date),
        hours: Number(hours),
        description,
      },
    });

    return NextResponse.json(timeLog, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create time log' }, { status: 500 });
  }
}
