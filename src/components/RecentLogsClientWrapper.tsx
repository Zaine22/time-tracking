'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import RecentLogsTableWithEdit from './RecentLogsTableWithEdit';

export function RecentLogsClientWrapper({ logs, userId }: { logs: any[], userId: string }) {
  const router = useRouter();

  const handleReportSubmitted = () => {
    router.refresh();
  };

  return <RecentLogsTableWithEdit logs={logs} userId={userId} onReportSubmitted={handleReportSubmitted} />;
}
