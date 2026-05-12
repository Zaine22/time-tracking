import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { RecentLogsClientWrapper } from '@/components/RecentLogsClientWrapper';
import { Clock, Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TimeLogsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || (currentUser.role !== 'STAFF' && currentUser.role !== 'ADMIN')) {
    redirect('/');
  }

  // Fetch all time logs for the user
  const logs = await prisma.timeLog.findMany({
    where: { userId: currentUser.id },
    include: {
      project: true,
      report: true
    },
    orderBy: { date: 'desc' }
  });

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="text-primary" size={28} />
            My Time Logs
          </h1>
          <p className="text-slate-400 mt-1">View your entire time logging history.</p>
        </div>
        <Link 
          href="/time-logs/create" 
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Log New Time
        </Link>
      </div>

      <div className="lg:col-span-3">
        <RecentLogsClientWrapper 
          logs={logs.map(l => ({
            ...l, 
            date: l.date.toISOString(), 
            createdAt: l.createdAt.toISOString()
          }))} 
          userId={currentUser.id} 
        />
      </div>
    </DashboardLayout>
  );
}
