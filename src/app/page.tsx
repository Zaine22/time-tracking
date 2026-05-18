import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import MetricCard from '@/components/MetricCard';
import SuperAdminDashboard from '@/components/SuperAdminDashboard';
import OwnerDashboard from '@/components/OwnerDashboard';
import { RecentLogsClientWrapper } from '@/components/RecentLogsClientWrapper';
import { Clock, Briefcase, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projectUsers: {
        include: {
          project: true
        }
      },
      ownedProjects: true
    }
  });

  if (!user) {
    // If cookie is invalid, clear it by redirecting to login which could maybe clear it, 
    // or just redirect. We'll just redirect to login.
    redirect('/login');
  }

  // Route to the specific dashboard based on role
  if (user.role === 'SUPERADMIN') {
    return <SuperAdminDashboard user={user} searchParams={searchParams} />;
  }

  // Project Owner Dashboard
  if (user.ownedProjects && user.ownedProjects.length > 0) {
    return <OwnerDashboard user={user} />;
  }

  // Default Staff / Admin Dashboard
  return <StaffDashboard user={user} />;
}

async function StaffDashboard({ user }: { user: any }) {
  // Fetch recent time logs (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const logs = await prisma.timeLog.findMany({
    where: {
      userId: user.id,
      date: { gte: sevenDaysAgo }
    },
    include: {
      project: true,
      report: true
    },
    orderBy: { date: 'desc' }
  });

  // Calculate Metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyLogs = await prisma.timeLog.findMany({
    where: {
      userId: user.id,
      date: {
        gte: new Date(currentYear, currentMonth, 1),
        lt: new Date(currentYear, currentMonth + 1, 1)
      }
    }
  });

  const totalMonthlyHours = monthlyLogs.reduce((sum, log) => sum + log.hours, 0);
  const projectsCount = user.projectUsers.length;
  
  // Total reports submitted by the user
  const totalReportsCount = await prisma.report.count({
    where: { userId: user.id }
  });

  return (
    <DashboardLayout userName={user.name} role={user.role}>
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-slate-400">Here's your analytical overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Hours (This Month)"
          value={totalMonthlyHours}
          icon={Clock}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
        <MetricCard
          title="Total Projects"
          value={projectsCount}
          icon={Briefcase}
          subtitle="Assigned to you"
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
        <MetricCard
          title="Total Reports"
          value={totalReportsCount}
          icon={FileText}
          subtitle="Submitted all time"
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
        />
      </div>

      <div className="lg:col-span-3">
        <RecentLogsClientWrapper 
          logs={logs.map(l => ({
            ...l, 
            date: l.date.toISOString(), 
            createdAt: l.createdAt.toISOString()
          }))} 
          userId={user.id} 
        />
      </div>
    </DashboardLayout>
  );
}
