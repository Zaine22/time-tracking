import prisma from '@/lib/prisma';
import { ReportStatus } from '@prisma/client';

export class ReportService {
  /**
   * Submit a daily report for a user and project.
   * Enforces the 48-hour submission rule.
   */
  static async submitDailyReport(userId: string, projectId: string, date: Date) {
    // Ensure we are working with just the date part (no time)
    const reportDate = new Date(date);
    reportDate.setUTCHours(0, 0, 0, 0);
    const reportDateEnd = new Date(reportDate);
    reportDateEnd.setUTCHours(23, 59, 59, 999);

    // Enforce one report per user per date across all projects.
    const existingReport = await prisma.report.findFirst({
      where: {
        userId,
        date: {
          gte: reportDate,
          lte: reportDateEnd,
        },
      },
    });

    if (existingReport) {
      throw new Error('You already submitted a report for this date. Only one report per day is allowed.');
    }

    // Get all unsubmitted time logs for this user/date across projects.
    const timeLogs = await prisma.timeLog.findMany({
      where: {
        userId,
        date: {
          gte: reportDate,
          lt: new Date(reportDate.getTime() + 24 * 60 * 60 * 1000)
        },
        reportId: null, // Only get unsubmitted logs
      }
    });

    if (timeLogs.length === 0) {
      throw new Error("No pending time logs found for this project on this date.");
    }

    const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

    // Submission is allowed until end of the 2nd day after report date (48-hour late window).
    // E.g. report for 23rd can still be submitted until end of 25th.
    const deadline = new Date(reportDate);
    deadline.setUTCDate(deadline.getUTCDate() + 2);
    deadline.setUTCHours(23, 59, 59, 999);

    const submittedAt = new Date();
    if (submittedAt > deadline) {
      throw new Error('Submission window closed. Staff can submit reports within 48 hours only.');
    }

    // Only mark LATE if the report date is today AND submitted after end of today.
    // Submissions for yesterday or the day before are always PENDING — they are
    // within the allowed 48-hour window and should not be penalised.
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    const isToday = reportDate.getTime() === todayUTC.getTime();
    const status =
      isToday && submittedAt > reportDateEnd ? ReportStatus.LATE : ReportStatus.PENDING;

    // Create the report and link the time logs
    const report = await prisma.report.create({
      data: {
        userId,
        // Keep schema compatibility; report now represents the whole day.
        // We store the initiating project as the report's project.
        projectId,
        date: reportDate,
        status,
        totalHours,
        submittedAt,
        locked: true, // Lock immediately upon submission
        timeLogs: {
          connect: timeLogs.map(log => ({ id: log.id }))
        }
      }
    });

    return report;
  }
}
