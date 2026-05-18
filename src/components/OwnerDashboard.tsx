import React from 'react';
import DashboardLayout from './DashboardLayout';
import MetricCard from './MetricCard';
import { Users, Briefcase, Clock, FileText } from 'lucide-react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { stripHtml } from '@/lib/utils';

export default async function OwnerDashboard({ 
  user,
}: { 
  user: any;
}) {
  // Fetch projects owned by the user
  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: user.id },
    select: { id: true, name: true }
  });

  const projectIds = ownedProjects.map(p => p.id);

  // If they don't own any projects, maybe we shouldn't show this, but we'll assume they do.
  
  // Fetch time logs for these projects
  const staffTimeLogs = await prisma.timeLog.findMany({
    where: { projectId: { in: projectIds } },
    include: {
      user: true,
      project: true,
      report: true
    },
    orderBy: { date: 'desc' },
    take: 50 // limit for dashboard
  });

  // Calculate metrics
  const totalProjects = ownedProjects.length;
  const totalStaffLogs = staffTimeLogs.length;
  const totalStaffHours = staffTimeLogs.reduce((sum, log) => sum + log.hours, 0);
  
  // Count unique staff members
  const uniqueStaffIds = new Set(staffTimeLogs.map(log => log.userId));
  const activeStaffCount = uniqueStaffIds.size;

  return (
    <DashboardLayout userName={user.name} role={user.role}>
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Project Owner Dashboard</h1>
        <p className="text-slate-400">Overview of your projects and staff time logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <MetricCard
          title="My Projects"
          value={totalProjects}
          icon={Briefcase}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
        <MetricCard
          title="Active Staff"
          value={activeStaffCount}
          icon={Users}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
        <MetricCard
          title="Total Staff Hours"
          value={totalStaffHours.toFixed(1)}
          icon={Clock}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
        <MetricCard
          title="Recent Logs"
          value={totalStaffLogs}
          icon={FileText}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden mt-8">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold">Staff Time Logs (Your Projects)</h2>
        </div>
        
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
              {staffTimeLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No time logs found for your projects.
                  </td>
                </tr>
              ) : (
                staffTimeLogs.map(log => (
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
