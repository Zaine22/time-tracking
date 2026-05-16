import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { ReportStatusUpdater } from './ReportStatusUpdater';
import { ArrowLeft, User, Briefcase, Calendar, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReportViewPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || !['SUPERADMIN', 'ADMIN', 'ACCOUNTING'].includes(currentUser.role)) {
    redirect('/');
  }

  const { id } = await params;

  const targetReport = await prisma.report.findUnique({
    where: { id },
    include: {
      user: true,
      project: true,
      timeLogs: {
        include: { project: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!targetReport) {
    redirect('/reports');
  }

  const isPending = targetReport.status === 'PENDING' || targetReport.status === 'LATE';

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="mb-6">
        <Link href="/reports" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4">
          <ArrowLeft size={16} />
          Back to Reports
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Report Details</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
            targetReport.status === 'APPROVED' ? 'bg-success/10 text-success border-success/20' :
            targetReport.status === 'LATE' ? 'bg-danger/10 text-danger border-danger/20' :
            targetReport.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' :
            targetReport.status === 'REJECTED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : ''
          }`}>
            {targetReport.status}
          </span>
        </div>
        <p className="text-slate-400 mt-1">Review the staff member's submitted hours and descriptions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Meta Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 border-b border-white/5 pb-3">Summary</h2>
            
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 text-sm flex items-center gap-2 mb-1"><User size={14} /> Staff Member</span>
                <p className="font-medium text-white">{targetReport.user.name}</p>
                <p className="text-xs text-slate-400">{targetReport.user.role}</p>
              </div>
              
              <div>
                <span className="text-slate-400 text-sm flex items-center gap-2 mb-1"><Briefcase size={14} /> Projects</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Array.from(
                    new Map(
                      targetReport.timeLogs
                        .filter((l: any) => l.project)
                        .map((l: any) => [l.project.id, l.project.name])
                    ).entries()
                  ).map(([pid, pname]) => (
                    <span key={pid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/20">
                      {pname}
                    </span>
                  ))}
                  {targetReport.timeLogs.length === 0 && (
                    <p className="font-medium text-white">{targetReport.project.name}</p>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-sm flex items-center gap-2 mb-1"><Calendar size={14} /> Report Date</span>
                <p className="font-medium text-white">{new Date(targetReport.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              <div>
                <span className="text-slate-400 text-sm flex items-center gap-2 mb-1"><Clock size={14} /> Total Logged</span>
                <p className="font-medium text-accent text-xl">{targetReport.totalHours} Hours</p>
              </div>
            </div>

            {/* Status Update Actions - Only show if report is pending or late */}
            {isPending ? (
              <ReportStatusUpdater reportId={targetReport.id} />
            ) : (
              <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                <p className="text-sm text-slate-400">This report is locked and its status cannot be changed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown of Time Logs */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-xl overflow-hidden h-full">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <FileText size={20} />
              </div>
              <h2 className="text-xl font-bold">Time Log Breakdown</h2>
            </div>
            
            <div className="p-6">
              {targetReport.timeLogs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No specific time logs attached to this report.</p>
              ) : (
                <div className="space-y-4">
                  {targetReport.timeLogs.map((log, index) => (
                    <div key={log.id} className="p-4 bg-white/5 border border-white/10 rounded-lg flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center border border-primary/20 text-primary">
                        <span className="text-xl font-bold">{log.hours}</span>
                        <span className="text-xs uppercase font-semibold">HRS</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Task #{index + 1}</h4>
                          {(log as any).project && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/20">
                              <Briefcase size={10} />
                              {(log as any).project.name}
                            </span>
                          )}
                        </div>
                        <div 
                          className="text-white text-sm leading-relaxed prose prose-invert max-w-none [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&>p]:mb-2 [&>strong]:font-bold [&>strong]:text-accent"
                          dangerouslySetInnerHTML={{ __html: log.description }}
                        />
                        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-white/5">Logged at {new Date(log.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
