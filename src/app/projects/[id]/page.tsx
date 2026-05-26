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
  if (!currentUser || !['SUPERADMIN', 'ADMIN', 'ACCOUNTING'].includes(currentUser.role)) {
    redirect('/');
  }

  const isViewOnly = currentUser.role === 'ACCOUNTING';

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
        <h1 className="text-3xl font-bold text-white">{isViewOnly ? 'View Project' : 'Manage Project'}</h1>
        <p className="text-slate-400 mt-1">
          {isViewOnly ? `View details for ${targetProject.name}.` : `Update details and assign staff to ${targetProject.name}.`}
        </p>
      </div>

      {isViewOnly ? (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold">Project Details</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Project Name</label>
              <p className="text-white text-lg">{targetProject.name}</p>
            </div>
            {targetProject.description && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <p className="text-slate-300">{targetProject.description}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Assigned Staff</label>
              <div className="mt-2 space-y-2">
                {targetProject.users.map(pu => (
                  <div key={pu.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                        {pu.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{pu.user.name}</p>
                        <p className="text-xs text-slate-400">{pu.role}</p>
                      </div>
                    </div>
                    {pu.customRate && (
                      <span className="text-sm text-slate-400">{pu.customRate} MMK/hr</span>
                    )}
                  </div>
                ))}
                {targetProject.users.length === 0 && (
                  <p className="text-slate-400 text-sm">No staff assigned yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </DashboardLayout>
  );
}
