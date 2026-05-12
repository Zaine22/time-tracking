'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import RecentLogsTable from './RecentLogsTable';

export function RecentLogsClientWrapper({ logs, userId }: { logs: any[], userId: string }) {
  const router = useRouter();

  const handleReportSubmitted = () => {
    router.refresh();
  };

  return <RecentLogsTable logs={logs} userId={userId} onReportSubmitted={handleReportSubmitted} />;
}
