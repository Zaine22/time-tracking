import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { RecentLogsClientWrapper } from '@/components/RecentLogsClientWrapper';
import { TimeLogFilters } from '@/components/TimeLogFilters';
import { Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { stripHtml } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TimeLogsPage(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { ownedProjects: { select: { id: true, name: true } } }
  });
  
  if (!currentUser || (currentUser.role !== 'STAFF' && currentUser.role !== 'ADMIN')) {
    redirect('/');
  }

  const isOwner = currentUser.ownedProjects && currentUser.ownedProjects.length > 0;

  if (isOwner) {
    const projectIds = currentUser.ownedProjects.map(p => p.id);
    
    // Parse filters
    const filterUserId = typeof searchParams?.userId === 'string' ? searchParams.userId : undefined;
    const filterProjectId = typeof searchParams?.projectId === 'string' ? searchParams.projectId : undefined;
    const filterDateStr = typeof searchParams?.date === 'string' ? searchParams.date : undefined;

    let dateFilter = {};
    if (filterDateStr) {
      const startOfDay = new Date(`${filterDateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${filterDateStr}T23:59:59.999Z`);
      dateFilter = {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
    }

    const whereClause = {
      projectId: filterProjectId ? filterProjectId : { in: projectIds },
      ...(filterUserId ? { userId: filterUserId } : { userId: { not: currentUser.id } }),
      ...dateFilter
    };

    const staffLogs = await prisma.timeLog.findMany({
      where: whereClause,
      include: {
        user: true,
        project: true,
        report: true
      },
      orderBy: { date: 'desc' }
    });

    const uniqueUsers = await prisma.user.findMany({
      where: {
        id: { not: currentUser.id },
        projectUsers: {
          some: {
            projectId: { in: projectIds }
          }
        }
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    return (
      <DashboardLayout userName={currentUser.name} role={currentUser.role}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Clock className="text-primary" size={28} />
              Staff Time Logs
            </h1>
            <p className="text-slate-400 mt-1">View the time logging history of staff in your projects.</p>
          </div>
        </div>

        <div className="glass-panel rounded-xl overflow-hidden mt-8">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold">All Staff Time Logs</h2>
          </div>
          
          <TimeLogFilters users={uniqueUsers} projects={currentUser.ownedProjects} />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Staff Member</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Project</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Hours</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Description</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Report Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No time logs found for your projects.
                    </td>
                  </tr>
                ) : (
                  staffLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-sm">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium">{log.user.name}</td>
                      <td className="p-4 text-sm">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {log.project.name}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{log.hours}</td>
                      <td className="p-4 text-sm text-slate-400 truncate max-w-xs" title={stripHtml(log.description)}>{stripHtml(log.description)}</td>
                      <td className="p-4 text-right">
                        {log.report ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            log.report.status === 'APPROVED' ? 'bg-success/10 text-success border-success/20' :
                            log.report.status === 'LATE' ? 'bg-danger/10 text-danger border-danger/20' :
                            log.report.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {log.report.status}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Unsubmitted</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Regular staff view
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
