import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { ProjectForm } from '../ProjectForm';
import { StaffAssignmentClient } from './StaffAssignmentClient';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ManageProjectPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'ADMIN')) {
    redirect('/');
  }

  const { id } = await params;
  
  const targetProject = await prisma.project.findUnique({ 
    where: { id },
    include: {
      users: {
        include: { user: true }
      }
    }
  });

  if (!targetProject) {
    redirect('/projects');
  }

  const allUsers = await prisma.user.findMany({
    orderBy: { name: 'asc' }
  });

  // Filter out users already assigned to the project
  const assignedUserIds = targetProject.users.map(u => u.userId);
  const unassignedUsers = allUsers.filter(u => !assignedUserIds.includes(u.id));

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="mb-6">
        <Link href="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4">
          <ArrowLeft size={16} />
          Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-white">Manage Project</h1>
        <p className="text-slate-400 mt-1">Update details and assign staff to {targetProject.name}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ProjectForm users={allUsers} initialData={targetProject} />
        </div>

        <div>
          <div className="glass-panel rounded-xl overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20 text-accent">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-bold">Assigned Staff</h2>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <StaffAssignmentClient 
                projectId={targetProject.id} 
                assignedUsers={targetProject.users} 
                availableUsers={unassignedUsers} 
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
