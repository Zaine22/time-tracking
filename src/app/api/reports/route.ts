import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/reportService';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    const where: any = {};
    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;

    const reports = await prisma.report.findMany({
      where,
      include: {
        timeLogs: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, projectId, date } = body;

    const report = await ReportService.submitDailyReport(userId, projectId, new Date(date));

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit report' }, { status: 400 });
  }
}
