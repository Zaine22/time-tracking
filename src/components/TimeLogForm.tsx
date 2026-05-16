'use client';

import React, { useState } from 'react';
import { Clock, Briefcase, FileText, Calendar, Loader2 } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface Project {
  id: string;
  name: string;
}

interface TimeLogFormProps {
  userId: string;
  projects: Project[];
  blockedDateKeys?: string[]; // kept for prop compat but unused — API rejects duplicates
  onLogAdded: () => void;
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TimeLogForm({ userId, projects, onLogAdded }: TimeLogFormProps) {
  const today = new Date();
  const dateCandidates = [0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    return d;
  });

  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [date, setDate] = useState(toDateKey(dateCandidates[0]));
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!projectId || !hours || !description || !date) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          projectId,
          date,
          hours: Number(hours),
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to log time');
        return;
      }

      setHours('');
      setDescription('');
      onLogAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/20 text-primary">
          <Clock size={20} />
        </div>
        <h2 className="text-xl font-bold">Log Time</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm border border-danger/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              Date
            </label>
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {dateCandidates.map((candidate) => {
                const key = toDateKey(candidate);
                return (
                  <option key={key} value={key}>
                    {candidate.toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Briefcase size={14} className="text-slate-400" />
              Project
            </label>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">No projects assigned.</p>
            ) : (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
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

        <button
          type="submit"
          disabled={isLoading || projects.length === 0}
          className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 mt-4 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
          {isLoading ? 'Logging...' : 'Log Time'}
        </button>
      </form>
    </div>
  );
}
