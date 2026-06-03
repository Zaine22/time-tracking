import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { ReportFilters } from '@/components/ReportFilters';
import { FileText, Eye } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReportsPage(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) redirect('/login');

  const isAdminOrAccounting = ['SUPERADMIN', 'ADMIN', 'ACCOUNTING'].includes(currentUser.role);
  // Parse filters
  const filterUserId = typeof searchParams?.userId === 'string' ? searchParams.userId : undefined;
  const filterDateStr = typeof searchParams?.date === 'string' ? searchParams.date : undefined;
  const filterStatus = typeof searchParams?.status === 'string' ? searchParams.status : undefined;

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

  // Base where clause depends on role
  const baseWhere: Record<string, unknown> = isAdminOrAccounting ? {} : { userId: currentUser.id };
  
  // Apply explicit filters if present
  if (filterUserId && isAdminOrAccounting) {
    baseWhere.userId = filterUserId;
  }

  // Apply status filter if present
  if (filterStatus) {
    baseWhere.status = filterStatus;
  }
  
  const finalWhere = {
    ...baseWhere,
    ...dateFilter
  };

  const allReports = await prisma.report.findMany({
    where: finalWhere,
    include: {
      user: true,
      project: true,
      timeLogs: {
        include: { project: true },
        distinct: ['projectId'],
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const allUsers = isAdminOrAccounting 
    ? await prisma.user.findMany({ 
        where: { role: { notIn: ['SUPERADMIN', 'ADMIN'] } },
        orderBy: { name: 'asc' }, 
        select: { id: true, name: true, role: true } 
      })
    : [];

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="text-primary" size={28} />
            Daily Reports
          </h1>
          <p className="text-slate-400 mt-1">Review and approve submitted time reports.</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold">Report Inbox</h2>
        </div>
        
        {isAdminOrAccounting && <ReportFilters users={allUsers} />}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Report Date</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Staff Member</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Projects</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Total Hours</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                {isAdminOrAccounting && (
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allReports.map(report => (
                <tr key={report.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-sm font-medium text-white">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-slate-300">{report.user.name}</td>
                  <td className="p-4 text-sm text-slate-300">
                    <div className="flex flex-wrap gap-1">
                      {report.timeLogs.length > 0
                        ? report.timeLogs.map((log) => (
                            <span key={log.project.id} className="px-2 py-0.5 bg-white/5 rounded text-xs whitespace-nowrap">
                              {log.project.name}
                            </span>
                          ))
                        : <span className="px-2 py-0.5 bg-white/5 rounded text-xs">{report.project.name}</span>
                      }
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium">{report.totalHours} hrs</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      report.status === 'APPROVED' ? 'bg-success/10 text-success border-success/20' :
                      report.status === 'LATE' ? 'bg-danger/10 text-danger border-danger/20' :
                      report.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' :
                      report.status === 'REJECTED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : ''
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  {isAdminOrAccounting && (
                    <td className="p-4 text-right whitespace-nowrap">
                      <Link 
                        href={`/reports/${report.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md transition-colors text-sm"
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
              {allReports.length === 0 && (
                <tr>
                  <td colSpan={isAdminOrAccounting ? 6 : 5} className="p-8 text-center text-slate-400">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
