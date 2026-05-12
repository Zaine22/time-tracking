import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { UserForm } from '../UserForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CreateUserPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || currentUser.role !== 'SUPERADMIN') {
    redirect('/');
  }

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="mb-6">
        <Link href="/users" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4">
          <ArrowLeft size={16} />
          Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-white">Create New User</h1>
        <p className="text-slate-400 mt-1">Add a new staff member or administrator.</p>
      </div>

      <div className="max-w-2xl">
        <UserForm />
      </div>
    </DashboardLayout>
  );
}
