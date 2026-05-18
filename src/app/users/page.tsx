import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { Users as UsersIcon, Plus, Edit } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || currentUser.role !== 'SUPERADMIN') {
    redirect('/');
  }

  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UsersIcon className="text-primary" size={28} />
            Manage Users
          </h1>
          <p className="text-slate-400 mt-1">View and manage all staff accounts.</p>
        </div>
        <Link 
          href="/users/create" 
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add New User
        </Link>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold">System Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Name</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Email</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Role</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Base Cost/Hr</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-sm font-medium text-white">{user.name}</td>
                  <td className="p-4 text-sm text-slate-300">{user.email}</td>
                  <td className="p-4 text-sm">
                    <span className="px-2 py-1 bg-white/5 rounded text-xs font-medium text-slate-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-accent">
                    {user.costPerHour?.toFixed(2) || '0.00'} MMK
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                      href={`/users/${user.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md transition-colors text-sm"
                    >
                      <Edit size={14} />
                      Edit
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
