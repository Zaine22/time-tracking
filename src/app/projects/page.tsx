import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { Briefcase, Plus, Settings2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || !['SUPERADMIN', 'ADMIN', 'ACCOUNTING'].includes(currentUser.role)) {
    redirect('/');
  }

  const isViewOnly = currentUser.role === 'ACCOUNTING';

  const allProjects = await prisma.project.findMany({
    include: {
      owner: true,
      users: {
        include: { user: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <DashboardLayout userName={currentUser.name} role={currentUser.role}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="text-primary" size={28} />
            {isViewOnly ? 'View Projects' : 'Manage Projects'}
          </h1>
          <p className="text-slate-400 mt-1">
            {isViewOnly ? 'View all projects and their details.' : 'View projects and manage their staff.'}
          </p>
        </div>
        {!isViewOnly && (
          <Link 
            href="/projects/create" 
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add New Project
          </Link>
        )}
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold">Active Projects</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Project Name</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Owner</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Team Size</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Created</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allProjects.map(project => (
                <tr key={project.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-sm font-medium text-white">
                    {project.name}
                    {project.description && <p className="text-xs text-slate-400 font-normal mt-1 truncate max-w-[200px]">{project.description}</p>}
                  </td>
                  <td className="p-4 text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                        {project.owner.name.charAt(0)}
                      </div>
                      {project.owner.name}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-300">
                    {project.users.length} members
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md transition-colors text-sm"
                    >
                      <Settings2 size={14} />
                      {isViewOnly ? 'View' : 'Manage'}
                    </Link>
                  </td>
                </tr>
              ))}
              {allProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
