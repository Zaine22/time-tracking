'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Clock, FileWarning, Send } from 'lucide-react';

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};

interface TimeLog {
  id: string;
  date: string;
  hours: number;
  description: string;
  project: { name: string, id: string };
  reportId: string | null;
  report?: {
    status: string;
  } | null;
}

interface RecentLogsTableProps {
  logs: TimeLog[];
  userId: string;
  onReportSubmitted: () => void;
}

export default function RecentLogsTable({ logs, userId, onReportSubmitted }: RecentLogsTableProps) {
  const [submittingProject, setSubmittingProject] = useState<string | null>(null);

  const getStatusBadge = (log: TimeLog) => {
    if (!log.reportId) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-medium">
          <Clock size={12} />
          Unsubmitted
        </span>
      );
    }
    
    switch (log.report?.status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20 text-xs font-medium">
            <CheckCircle2 size={12} />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/20 text-xs font-medium">
            <Clock size={12} />
            Pending
          </span>
        );
      case 'LATE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger/10 text-danger border border-danger/20 text-xs font-medium">
            <FileWarning size={12} />
            Late
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-medium">
            {log.report?.status || 'Unknown'}
          </span>
        );
    }
  };

  // Group unsubmitted logs by date (one report per day)
  const unsubmittedByDate = logs
    .filter(log => !log.reportId)
    .reduce((acc, log) => {
      const key = new Date(log.date).toISOString().split('T')[0];
      if (!acc[key]) acc[key] = { projectId: log.project.id, date: log.date };
      return acc;
    }, {} as Record<string, { projectId: string, date: string }>);

  const submitReport = async (projectId: string, date: string) => {
    const key = new Date(date).toISOString().split('T')[0];
    setSubmittingProject(key);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, projectId, date })
      });
      if (res.ok) {
        onReportSubmitted();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingProject(null);
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div>
          <h2 className="text-xl font-bold">Recent Time Logs</h2>
          <p className="text-sm text-slate-400 mt-1">Your detailed activity for the last 7 days</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hours</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle size={24} className="text-slate-500" />
                    <p>No recent time logs found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const logDateStr = new Date(log.date).toISOString().split('T')[0];
                const key = logDateStr;
                const isSubmitting = submittingProject === key;
                const canSubmit = !log.reportId && unsubmittedByDate[key];

                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 text-sm font-medium whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <span className="px-2 py-1 bg-white/5 rounded text-slate-300">
                        {log.project.name}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-white whitespace-nowrap">
                      {log.hours}
                    </td>
                    <td className="p-4 text-sm text-slate-300 max-w-xs truncate" title={stripHtml(log.description)}>
                      {stripHtml(log.description)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getStatusBadge(log)}
                    </td>
                    <td className="p-4 whitespace-nowrap text-right">
                      {canSubmit && (
                        <button
                          onClick={() => {
                            // Only call submit once per day
                            delete unsubmittedByDate[key];
                            submitReport(log.project.id, log.date);
                          }}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? 'Submitting...' : (
                            <>
                              Submit Report <Send size={12} />
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
