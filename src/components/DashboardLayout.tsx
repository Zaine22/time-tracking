import React from 'react';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({ 
  children, 
  userName = "Staff Member", 
  role = "STAFF" 
}: { 
  children: React.ReactNode, 
  userName?: string, 
  role?: string 
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  let isProjectOwner = false;

  if (userId) {
    const ownedProject = await prisma.project.findFirst({
      where: { ownerId: userId },
      select: { id: true }
    });
    isProjectOwner = !!ownedProject;
  }

  return (
    <DashboardLayoutClient 
      userName={userName} 
      role={role} 
      isProjectOwner={isProjectOwner}
    >
      {children}
    </DashboardLayoutClient>
  );
}
