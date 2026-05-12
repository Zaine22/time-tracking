'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TimeLogForm from '@/components/TimeLogForm';

export function ClientWrapper({
  userId,
  projects,
  blockedDateKeys = [],
}: {
  userId: string;
  projects: any[];
  blockedDateKeys?: string[];
}) {
  const router = useRouter();

  const handleLogAdded = () => {
    router.push('/time-logs');
    router.refresh();
  };

  return (
    <TimeLogForm
      userId={userId}
      projects={projects}
      blockedDateKeys={blockedDateKeys}
      onLogAdded={handleLogAdded}
    />
  );
}
