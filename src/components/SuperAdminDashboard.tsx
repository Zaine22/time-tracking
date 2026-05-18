import React from 'react';
import DashboardLayout from './DashboardLayout';
import MetricCard from './MetricCard';
import { ReportFilters } from './ReportFilters';
import { Users, Briefcase, FileText, DollarSign } from 'lucide-react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export default async function SuperAdminDashboard({ 
  user, 
  searchParams 
}: { 
  user: any;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Fetch system-wide metrics
  const totalUsers = await prisma.user.count();
  const totalProjects = await prisma.project.count();

  // Parse filters
  const filterUserId = typeof searchParams?.userId === 'string' ? searchParams.userId : undefined;
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
    ...(filterUserId ? { userId: filterUserId } : {}),
    ...dateFilter
  };

  const allReports = await prisma.report.findMany({
    where: whereClause,
    include: {
      user: true,
      project: true
    },
    orderBy: { createdAt: 'desc' },
    take: filterUserId || filterDateStr ? undefined : 10 // Show all if filtered, else 10
  });

  const allUsers = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, role: true }
  });

  const pendingReportsCount = await prisma.report.count({
    where: { status: 'PENDING' }
  });

  const totalCostAggregation = await prisma.report.aggregate({
    _sum: { totalCost: true },
    where: { totalCost: { not: null } }
  });

  const totalCost = totalCostAggregation._sum.totalCost || 0;

  return (
    <DashboardLayout userName={user.name} role={user.role}>
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Super Admin Overview</h1>
        <p className="text-slate-400">System-wide metrics and reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
        <MetricCard
          title="Total Projects"
          value={totalProjects}
          icon={Briefcase}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
        <MetricCard
          title="Pending Reports"
          value={pendingReportsCount}
          icon={FileText}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
        <MetricCard
          title="Total Payouts"
          value={`${totalCost.toFixed(2)} MMK`}
          icon={DollarSign}
          className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/20"
        />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden mt-8">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold">Recent System Reports</h2>
        </div>
        
        <ReportFilters users={allUsers} />
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">User</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Project</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Hours</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Cost</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allReports.map(report => (
                <tr key={report.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-sm">{new Date(report.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm font-medium">{report.user.name}</td>
                  <td className="p-4 text-sm">{report.project.name}</td>
                  <td className="p-4 text-sm">{report.totalHours}</td>
                  <td className="p-4 text-sm">{report.totalCost?.toFixed(2) || '0.00'} MMK</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      report.status === 'APPROVED' ? 'bg-success/10 text-success border-success/20' :
                      report.status === 'LATE' ? 'bg-danger/10 text-danger border-danger/20' :
                      report.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                      href={`/reports/${report.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md transition-colors text-sm"
                    >
                      <Eye size={14} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
