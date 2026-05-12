import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { Calculator, DollarSign, Edit, Eye } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PayrollPage(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) redirect('/login');

  const isStaff = currentUser.role === 'STAFF';
  const canManagePayroll =
    currentUser.role === 'SUPERADMIN' || currentUser.role === 'ACCOUNTING' || currentUser.role === 'ADMIN';

  const now = new Date();
  const monthFilter = typeof searchParams?.month === 'string' ? searchParams.month : '';
  const userFilter = typeof searchParams?.userId === 'string' ? searchParams.userId : '';
  const statusFilter = typeof searchParams?.status === 'string' ? searchParams.status : '';

  let filterMonth: number | undefined;
  let filterYear: number | undefined;
  if (monthFilter) {
    const [yearPart, monthPart] = monthFilter.split('-');
    const parsedYear = Number(yearPart);
    const parsedMonth = Number(monthPart);
    if (!Number.isNaN(parsedYear) && !Number.isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
      filterYear = parsedYear;
      filterMonth = parsedMonth;
    }
  }

  // Fetch MonthlyPayroll records
  const whereClause: {
    userId?: string;
    month?: number;
    year?: number;
    status?: string;
  } = {};
  if (isStaff) {
    whereClause.userId = currentUser.id;
  } else {
    if (userFilter) whereClause.userId = userFilter;
    if (statusFilter) whereClause.status = statusFilter;
    if (filterMonth && filterYear) {
      whereClause.month = filterMonth;
      whereClause.year = filterYear;
    }
  }
  
  const payrollList = await prisma.monthlyPayroll.findMany({
    where: whereClause,
    include: {
      user: true
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { user: { name: 'asc' } }]
  });

  const grandTotal = payrollList.reduce((sum, item) => sum + item.totalAmount, 0);
  const staffUsers = canManagePayroll
    ? await prisma.user.findMany({
        where: { role: 'STAFF' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    : [];

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calculator className="text-primary" size={28} />
            Payroll & Accounting
          </h1>
          <p className="text-slate-400 mt-1">
            {isStaff 
              ? 'Your monthly income history' 
              : 'All payroll records with month, user, and status filters'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel rounded-xl p-6 col-span-1 md:col-span-3 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 flex justify-between items-center">
          <div>
            <h3 className="text-slate-300 font-medium text-sm mb-1">Total Monthly Payout</h3>
            <p className="text-4xl font-bold text-white">${grandTotal.toFixed(2)}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <DollarSign size={32} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold">Staff Payout Summary</h2>
          <span className="text-xs px-2.5 py-1 bg-white/5 rounded-full text-slate-400">
            Based on processed reports
          </span>
        </div>
        {canManagePayroll && (
          <form method="GET" className="p-6 border-b border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Month</label>
              <input
                type="month"
                name="month"
                defaultValue={monthFilter}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Staff User</label>
              <select
                name="userId"
                defaultValue={userFilter}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All staff</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Payment Status</label>
              <select
                name="status"
                defaultValue={statusFilter}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="FINALIZED">Finalized</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
              >
                Filter
              </button>
              <Link
                href="/payroll"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm font-medium"
              >
                Reset
              </Link>
            </div>
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Staff Member</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Month/Year</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Approved Hours</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Late Hours</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Final Payout</th>
                {canManagePayroll && <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payrollList.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-sm font-medium text-white">
                    {payroll.user.name}
                    <span className="block text-xs text-slate-400 font-normal mt-0.5">{payroll.user.role}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-300">
                    {new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'short' })} {payroll.year}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-200">{payroll.totalHours} hrs</td>
                  <td className="p-4 text-sm text-warning">
                    {payroll.lateHours > 0 ? `${payroll.lateHours} hrs` : '-'}
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      payroll.status === 'PAID' ? 'bg-success/10 text-success border-success/20' :
                      payroll.status === 'FINALIZED' ? 'bg-primary/10 text-primary border-primary/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {payroll.status}
                    </span>
                  </td>
                  <td className="p-4 text-right text-lg font-bold text-accent">
                    ${payroll.totalAmount.toFixed(2)}
                  </td>
                  {canManagePayroll && (
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/payroll/${payroll.id}?mode=view`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-colors text-sm"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                        <Link
                          href={`/payroll/${payroll.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md transition-colors text-sm"
                        >
                          <Edit size={14} />
                          Edit
                        </Link>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {payrollList.length === 0 && (
                <tr>
                  <td colSpan={canManagePayroll ? 7 : 6} className="p-12 text-center text-slate-400">
                    <p className="mb-2">No payroll records found for this filter.</p>
                    <p className="text-sm">Try changing month, user, or payment status.</p>
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
