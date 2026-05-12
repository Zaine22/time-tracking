import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import TimeLogForm from '@/components/TimeLogForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default async function CreateTimeLogPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ 
    where: { id: userId },
    include: {
      projectUsers: {
        include: {
          project: true
        }
      }
    }
  });
  
  if (!currentUser || (currentUser.role !== 'STAFF' && currentUser.role !== 'ADMIN')) {
    redirect('/');
  }

  const projects = currentUser.projectUsers.map((pu: any) => ({
    id: pu.project.id,
    name: pu.project.name
  }));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const minAllowedDate = new Date(startOfToday);
  minAllowedDate.setDate(minAllowedDate.getDate() - 2);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  const existingReports = await prisma.report.findMany({
    where: {
      userId: currentUser.id,
      date: {
        gte: minAllowedDate,
        lte: endOfToday,
      },
    },
    select: {
      date: true,
    },
  });

  const blockedDateKeys = Array.from(new Set(existingReports.map((report) => toDateKey(new Date(report.date)))));

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="mb-6">
        <Link href="/time-logs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4">
          <ArrowLeft size={16} />
          Back to Time Logs
        </Link>
        <h1 className="text-3xl font-bold text-white">Log New Time</h1>
        <p className="text-slate-400 mt-1">Record the hours you've worked on assigned projects.</p>
      </div>

      <div className="w-full">
        <ClientWrapper userId={currentUser.id} projects={projects} blockedDateKeys={blockedDateKeys} />
      </div>
    </DashboardLayout>
  );
}

// ClientWrapper to handle navigation after log creation
import { ClientWrapper } from './ClientWrapper';
