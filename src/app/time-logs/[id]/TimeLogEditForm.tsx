'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, FileText, Loader2, Trash2 } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

interface TimeLogEditFormProps {
  timeLog: {
    id: string;
    hours: number;
    description: string;
    projectName: string;
    date: string;
  };
  userId: string;
}

export default function TimeLogEditForm({ timeLog, userId }: TimeLogEditFormProps) {
  const router = useRouter();
  const [hours, setHours] = useState(timeLog.hours.toString());
  const [description, setDescription] = useState(timeLog.description);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hours || !description) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/time-logs/${timeLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          hours: Number(hours),
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update time log');
        return;
      }

      router.push('/time-logs');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update time log');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this time log? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/time-logs/${timeLog.id}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete time log');
        return;
      }

      router.push('/time-logs');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete time log');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm border border-danger/20">
            {error}
          </div>
        )}

        {/* Project and Date Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Project</label>
            <div className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-400">
              {timeLog.projectName}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Date</label>
            <div className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-400">
              {new Date(timeLog.date).toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            Hours
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 4.5"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
            <FileText size={14} className="text-slate-400" />
            Description
          </label>
          <RichTextEditor
            value={description}
            onChange={(val) => setDescription(val)}
            placeholder="What did you work on?"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading || isDeleting}
            className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
            {isLoading ? 'Updating...' : 'Update Time Log'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
            className="px-6 py-2.5 bg-danger/20 hover:bg-danger/30 text-danger font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/time-logs')}
            disabled={isLoading || isDeleting}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-lg transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
