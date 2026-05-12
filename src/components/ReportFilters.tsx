'use client';

import React, { useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';

interface ReportFiltersProps {
  users: { id: string; name: string; role: string }[];
}

export function ReportFilters({ users }: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentUserId = searchParams.get('userId') || '';
  const currentDate = searchParams.get('date') || '';

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(pathname + '?' + createQueryString('userId', e.target.value));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(pathname + '?' + createQueryString('date', e.target.value));
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = currentUserId !== '' || currentDate !== '';

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 p-4 bg-white/[0.02] border-b border-white/5">
      <div className="flex items-center gap-2 text-slate-400">
        <Filter size={16} />
        <span className="text-sm font-medium">Filter By:</span>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <select
          value={currentUserId}
          onChange={handleUserChange}
          className="bg-[#1e293b] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm flex-1 max-w-[200px]"
        >
          <option value="">All Users</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
          ))}
        </select>

        <input
          type="date"
          value={currentDate}
          onChange={handleDateChange}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-full sm:w-[160px]"
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors whitespace-nowrap"
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
