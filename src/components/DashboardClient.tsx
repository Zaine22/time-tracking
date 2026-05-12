'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TimeLogForm from './TimeLogForm';
import RecentLogsTable from './RecentLogsTable';

export function DashboardClient({ userId, projects, logs }: { userId: string, projects: any[], logs: any[] }) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <TimeLogForm 
          userId={userId} 
          projects={projects} 
          onLogAdded={handleRefresh} 
        />
      </div>
      
      <div className="lg:col-span-2">
        <RecentLogsTable 
          logs={logs} 
          userId={userId} 
          onReportSubmitted={handleRefresh} 
        />
      </div>
    </div>
  );
}
