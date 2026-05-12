'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ReportStatusUpdaterProps {
  reportId: string;
}

export function ReportStatusUpdater({ reportId }: ReportStatusUpdaterProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    setIsLoading(status);
    try {
      const res = await fetch(`/api/reports/${reportId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Action failed');
      
      router.push('/reports');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('An error occurred while updating the report.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
      <button 
        onClick={() => handleUpdate('APPROVED')}
        disabled={isLoading !== null}
        className="w-full sm:w-auto px-6 py-2.5 bg-success hover:bg-success/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading === 'APPROVED' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
        Approve Report
      </button>

      <button 
        onClick={() => handleUpdate('REJECTED')}
        disabled={isLoading !== null}
        className="w-full sm:w-auto px-6 py-2.5 bg-white/10 hover:bg-danger/20 text-white hover:text-danger rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border border-white/10 hover:border-danger/30"
      >
        {isLoading === 'REJECTED' ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
        Reject Report
      </button>
    </div>
  );
}
