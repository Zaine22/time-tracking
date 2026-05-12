import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { ProjectForm } from '../ProjectForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CreateProjectPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'ADMIN')) {
    redirect('/');
  }

  const allUsers = await prisma.user.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="mb-6">
        <Link href="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4">
          <ArrowLeft size={16} />
          Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-white">Create New Project</h1>
        <p className="text-slate-400 mt-1">Setup a new project and assign its owner.</p>
      </div>

      <div className="max-w-2xl">
        <ProjectForm users={allUsers} />
      </div>
    </DashboardLayout>
  );
}
