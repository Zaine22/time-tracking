'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, Briefcase, FileText, Calendar, Loader2, ChevronDown, Check, X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface Project {
  id: string;
  name: string;
}

interface TimeLogFormProps {
  userId: string;
  projects: Project[];
  blockedDateKeys?: string[];
  onLogAdded: () => void;
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TimeLogForm({ userId, projects, blockedDateKeys = [], onLogAdded }: TimeLogFormProps) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const today = new Date();
  const dateCandidates = [0, 1, 2].map(offset => {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    return d;
  });
  const availableDates = dateCandidates.filter(d => !blockedDateKeys.includes(toDateKey(d)));
  const [date, setDate] = useState(availableDates[0] ? toDateKey(availableDates[0]) : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (availableDates.length === 0) {
      setDate('');
      return;
    }

    const selectedStillAvailable = availableDates.some(d => toDateKey(d) === date);
    if (!selectedStillAvailable) {
      setDate(toDateKey(availableDates[0]));
    }
  }, [availableDates, date]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProject = (id: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const removeProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectIds(prev => prev.filter(p => p !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedProjectIds.length === 0 || !hours || !description || !date) {
      setError('Please fill in all fields and select at least one project.');
      return;
    }

    setIsLoading(true);
    try {
      // Submit one time log per selected project — use allSettled so partial
      // failures don't block successful ones.
      const results = await Promise.allSettled(
        selectedProjectIds.map(projectId =>
          fetch('/api/time-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              projectId,
              date,
              hours: Number(hours),
              description
            })
          }).then(async res => {
            if (!res.ok) {
              const data = await res.json();
              const name = projects.find(p => p.id === projectId)?.name ?? projectId;
              throw new Error(`${name}: ${data.error || 'Failed to log time'}`);
            }
            return res.json();
          })
        )
      );

      const failures = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason?.message ?? 'Unknown error');

      const successCount = results.filter(r => r.status === 'fulfilled').length;

      if (failures.length > 0) {
        setError(failures.join('\n'));
      }

      if (successCount > 0) {
        setHours('');
        setDescription('');
        setSelectedProjectIds([]);
        onLogAdded();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

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
              disabled={availableDates.length === 0}
              className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-60"
            >
              {availableDates.length === 0 ? (
                <option value="">No available dates</option>
              ) : (
                availableDates.map((candidate) => {
                  const key = toDateKey(candidate);
                  return (
                    <option key={key} value={key}>
                      {candidate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Multi-select Project dropdown */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Briefcase size={14} className="text-slate-400" />
              Projects
              {selectedProjectIds.length > 0 && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                  {selectedProjectIds.length} selected
                </span>
              )}
            </label>

            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <span className={selectedProjectIds.length === 0 ? 'text-slate-500 text-sm' : 'text-white text-sm'}>
                {selectedProjectIds.length === 0
                  ? 'Select projects...'
                  : `${selectedProjectIds.length} project${selectedProjectIds.length > 1 ? 's' : ''} selected`}
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown list */}
            {dropdownOpen && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                {projects.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-slate-400">No projects assigned.</p>
                ) : (
                  <ul className="max-h-52 overflow-y-auto divide-y divide-white/5">
                    {projects.map(p => {
                      const isSelected = selectedProjectIds.includes(p.id);
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => toggleProject(p.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                              isSelected
                                ? 'bg-primary/15 text-white'
                                : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-white/20 bg-transparent'
                              }`}
                            >
                              {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                            </span>
                            {p.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Selected project tags */}
            {selectedProjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedProjects.map(p => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium"
                  >
                    {p.name}
                    <button
                      type="button"
                      onClick={(e) => removeProject(p.id, e)}
                      className="hover:text-white transition-colors"
                      aria-label={`Remove ${p.name}`}
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </span>
                ))}
              </div>
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
          disabled={isLoading || availableDates.length === 0}
          className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 mt-4 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
          {isLoading
            ? 'Logging...'
            : selectedProjectIds.length > 1
              ? `Log Time for ${selectedProjectIds.length} Projects`
              : 'Log Time'}
        </button>
      </form>
    </div>
  );
}
