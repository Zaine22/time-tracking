import React from 'react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import TimeLogEditForm from './TimeLogEditForm';
import { Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EditTimeLogPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ 
    where: { id: userId }
  });
  
  if (!currentUser || currentUser.role !== 'STAFF') {
    redirect('/');
  }

  // Fetch the time log
  const timeLog = await prisma.timeLog.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      report: true
    }
  });

  if (!timeLog) {
    notFound();
  }

  // Check if the user owns this time log
  if (timeLog.userId !== userId) {
    redirect('/time-logs');
  }

  // Check if the time log is already submitted
  if (timeLog.reportId) {
    redirect('/time-logs');
  }

  // Check if the time log is within the editable window
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const minAllowedDate = new Date(startOfToday);
  minAllowedDate.setDate(minAllowedDate.getDate() - 2);

  const logDay = new Date(timeLog.date);
  logDay.setHours(0, 0, 0, 0);

  if (logDay < minAllowedDate) {
    redirect('/time-logs');
  }

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="text-primary" size={28} />
            Edit Time Log
          </h1>
          <p className="text-slate-400 mt-1">
            Update your time log for {timeLog.project.name} on {new Date(timeLog.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <TimeLogEditForm 
          timeLog={{
            id: timeLog.id,
            hours: timeLog.hours,
            description: timeLog.description,
            projectName: timeLog.project.name,
            date: timeLog.date.toISOString()
          }}
          userId={userId}
        />
      </div>
    </DashboardLayout>
  );
}
