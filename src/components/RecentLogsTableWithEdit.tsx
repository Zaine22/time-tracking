'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, FileWarning, Send, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { stripHtml } from '@/lib/utils';

interface TimeLog {
  id: string;
  date: string;
  hours: number;
  description: string;
  project: { name: string; id: string };
  reportId: string | null;
  report?: {
    status: string;
  } | null;
}

/** All TimeLog rows that share the same calendar date, grouped as one visual entry. */
interface LogGroup {
  dateKey: string;
  date: string;
  totalHours: number;
  description: string;
  projects: { id: string; name: string }[];
  reportId: string | null;
  reportStatus: string | null;
  firstProjectId: string;
  firstLogDate: string;
  logs: TimeLog[]; // Individual logs for this date
}

interface RecentLogsTableWithEditProps {
  logs: TimeLog[];
  userId: string;
  onReportSubmitted: () => void;
}

export default function RecentLogsTableWithEdit({ logs, userId, onReportSubmitted }: RecentLogsTableWithEditProps) {
  const [submittingDate, setSubmittingDate] = useState<string | null>(null);

  // ── Group logs by calendar date ─────────────────────────────────────────────
  const groupMap = new Map<string, LogGroup>();

  for (const log of logs) {
    const dateKey = new Date(log.date).toISOString().split('T')[0];

    if (!groupMap.has(dateKey)) {
      groupMap.set(dateKey, {
        dateKey,
        date: log.date,
        totalHours: 0,
        description: log.description,
        projects: [],
        reportId: log.reportId,
        reportStatus: log.report?.status ?? null,
        firstProjectId: log.project.id,
        firstLogDate: log.date,
        logs: [],
      });
    }

    const group = groupMap.get(dateKey)!;
    group.totalHours += log.hours;
    group.logs.push(log);

    if (!group.projects.find((p) => p.id === log.project.id)) {
      group.projects.push({ id: log.project.id, name: log.project.name });
    }

    if (log.reportId && !group.reportId) {
      group.reportId = log.reportId;
      group.reportStatus = log.report?.status ?? null;
    }
  }

  const groups = Array.from(groupMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // ── Check if a log can be edited ────────────────────────────────────────────
  const canEditLog = (log: TimeLog) => {
    if (log.reportId) return false;
    
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const minAllowedDate = new Date(startOfToday);
    minAllowedDate.setDate(minAllowedDate.getDate() - 2);

    const logDay = new Date(log.date);
    logDay.setHours(0, 0, 0, 0);

    return logDay >= minAllowedDate;
  };

  // ── Status badge ────────────────────────────────────────────────────────────
  const getStatusBadge = (group: LogGroup) => {
    if (!group.reportId) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-medium">
          <Clock size={12} />
          Unsubmitted
        </span>
      );
    }

    switch (group.reportStatus) {
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
            {group.reportStatus || 'Unknown'}
          </span>
        );
    }
  };

  // ── Submit report for a whole day ───────────────────────────────────────────
  const submitReport = async (group: LogGroup) => {
    setSubmittingDate(group.dateKey);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          projectId: group.firstProjectId,
          date: group.date,
        }),
      });
      if (res.ok) {
        onReportSubmitted();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingDate(null);
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
              groups.map((group) => {
                const isSubmitting = submittingDate === group.dateKey;
                const canSubmit = !group.reportId;

                return (
                  <React.Fragment key={group.dateKey}>
                    {/* Date header row */}
                    <tr className="bg-white/[0.01]">
                      <td colSpan={6} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-slate-300">
                            {new Date(group.date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })} - Total: {group.totalHours} hours
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(group)}
                            {canSubmit && (
                              <button
                                onClick={() => submitReport(group)}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-colors disabled:opacity-50"
                              >
                                {isSubmitting ? (
                                  'Submitting...'
                                ) : (
                                  <>
                                    Submit Report <Send size={12} />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Individual log rows */}
                    {group.logs.map((log) => {
                      const canEdit = canEditLog(log);
                      
                      return (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 text-sm font-medium whitespace-nowrap pl-8">
                            {new Date(log.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-4 text-sm">
                            <span className="px-2 py-0.5 bg-white/5 rounded text-slate-300 text-xs whitespace-nowrap">
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
                            {/* Empty for individual rows */}
                          </td>
                          <td className="p-4 whitespace-nowrap text-right">
                            {canEdit && (
                              <Link
                                href={`/time-logs/${log.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-colors"
                              >
                                <Edit2 size={12} />
                                Edit
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
