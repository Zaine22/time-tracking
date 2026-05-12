'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ApprovalClientProps {
  action: 'APPROVE' | 'REJECT';
  reportId?: string;
}

export function ApprovalClient({ action, reportId }: ApprovalClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const res = await fetch(`/api/reports/${reportId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Action failed');
      
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (action === 'APPROVE') {
    return (
      <button 
        onClick={handleClick}
        disabled={isLoading}
        title="Approve"
        className="p-1.5 text-success hover:bg-success/10 rounded-md transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
      </button>
    );
  }

  return (
    <button 
      onClick={handleClick}
      disabled={isLoading}
      title="Reject"
      className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors disabled:opacity-50"
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
    </button>
  );
}
