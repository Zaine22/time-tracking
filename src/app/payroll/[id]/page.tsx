import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { PayrollEditForm } from './PayrollEditForm';
import { ArrowLeft, User, Calendar, Clock, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PayrollEditPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ mode?: 'view' | 'calculate' }>;
  }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  const isStaff = currentUser?.role === 'STAFF';
  const canManage =
    currentUser?.role === 'SUPERADMIN' ||
    currentUser?.role === 'ACCOUNTING' ||
    currentUser?.role === 'ADMIN';

  if (!currentUser || (!canManage && !isStaff)) {
    redirect('/');
  }

  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const autoOpenCalculate = !isStaff && searchParams.mode === 'calculate';
  // Staff always view-only; admins can toggle between view and edit
  const isViewMode = isStaff || searchParams.mode === 'view';

  const targetPayroll = await prisma.monthlyPayroll.findUnique({
    where: { id },
    include: {
      user: true
    }
  });

  if (!targetPayroll) {
    redirect('/payroll');
  }

  // Staff can only view their own payroll record
  if (isStaff && targetPayroll.userId !== currentUser.id) {
    redirect('/payroll');
  }

  const periodStart = new Date(targetPayroll.year, targetPayroll.month - 1, 1);
  const periodEnd = new Date(targetPayroll.year, targetPayroll.month, 0, 23, 59, 59, 999);
  const staffReports = await prisma.report.findMany({
    where: {
      userId: targetPayroll.userId,
      date: {
        gte: periodStart,
        lte: periodEnd
      }
    },
    include: {
      project: true
    },
    orderBy: { date: 'desc' }
  });

  const monthName = new Date(targetPayroll.year, targetPayroll.month - 1).toLocaleString('default', { month: 'long' });

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="mb-6">
        <Link href="/payroll" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4">
          <ArrowLeft size={16} />
          Back to Payroll
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">{isViewMode ? 'View Payroll Record' : 'Edit Payroll Record'}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
            targetPayroll.status === 'PAID' ? 'bg-success/10 text-success border-success/20' :
            targetPayroll.status === 'FINALIZED' ? 'bg-primary/10 text-primary border-primary/20' :
            'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}>
            {targetPayroll.status}
          </span>
        </div>
        <p className="text-slate-400 mt-1">
          {isViewMode
            ? 'Review payroll details and report breakdown for this period.'
            : 'Adjust final payout amounts and update payment status.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Meta Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 border-b border-white/5 pb-3">Record Details</h2>
            
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 text-sm flex items-center gap-2 mb-1"><User size={14} /> Staff Member</span>
                <p className="font-medium text-white">{targetPayroll.user.name}</p>
                <p className="text-xs text-slate-400">Base Rate: ${targetPayroll.user.costPerHour?.toFixed(2) || '0.00'}/hr</p>
              </div>
              
              <div>
                <span className="text-slate-400 text-sm flex items-center gap-2 mb-1"><Calendar size={14} /> Pay Period</span>
                <p className="font-medium text-white">{monthName} {targetPayroll.year}</p>
              </div>

              <div>
                <span className="text-slate-400 text-sm flex items-center gap-2 mb-1"><Clock size={14} /> Approved Hours</span>
                <p className="font-medium text-white">{targetPayroll.totalHours} hrs</p>
              </div>

              {targetPayroll.lateHours > 0 && (
                <div>
                  <span className="text-warning text-sm flex items-center gap-2 mb-1"><AlertTriangle size={14} /> Late Hours Penalty</span>
                  <p className="font-medium text-warning">{targetPayroll.lateHours} hrs (50% Rate)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form — hidden for staff (view-only) */}
        <div className="lg:col-span-2">
          {!isStaff ? (
            <PayrollEditForm payroll={targetPayroll} autoOpenCalculate={autoOpenCalculate} readOnly={isViewMode} />
          ) : (
            // Staff sees a clean summary card instead of the edit form
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold border-b border-white/5 pb-3">Payout Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Total Hours</p>
                  <p className="text-2xl font-bold text-white">{targetPayroll.totalHours} <span className="text-sm font-normal text-slate-400">hrs</span></p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Final Payout</p>
                  <p className="text-2xl font-bold text-accent">${targetPayroll.totalAmount.toFixed(2)}</p>
                </div>
                {targetPayroll.lateHours > 0 && (
                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 col-span-2">
                    <p className="text-warning text-xs uppercase font-semibold mb-1">Late Hours (50% rate)</p>
                    <p className="text-lg font-bold text-warning">{targetPayroll.lateHours} hrs</p>
                  </div>
                )}
                {targetPayroll.notes && (
                  <div className="bg-white/5 rounded-lg p-4 col-span-2">
                    <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Notes</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{targetPayroll.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden mt-6">
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h2 className="text-xl font-bold">Staff Reports ({monthName} {targetPayroll.year})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Project</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Hours</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Report Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staffReports.map((report) => (
                <tr key={report.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-sm text-white">{new Date(report.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-slate-300">{report.project.name}</td>
                  <td className="p-4 text-sm text-slate-200 font-medium">{report.totalHours} hrs</td>
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
                  <td className="p-4 text-sm text-right text-accent font-medium">
                    {report.totalCost !== null ? `$${report.totalCost.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
              {staffReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400">
                    No reports found for this staff member in this payroll month.
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
