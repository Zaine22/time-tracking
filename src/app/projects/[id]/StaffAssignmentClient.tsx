'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';

interface StaffAssignmentClientProps {
  projectId: string;
  assignedUsers: any[];
  availableUsers: any[];
}

export function StaffAssignmentClient({ projectId, assignedUsers, availableUsers }: StaffAssignmentClientProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAddStaff = async () => {
    if (!selectedUserId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      });
      if (!res.ok) throw new Error('Failed to assign staff');
      
      setSelectedUserId('');
      router.refresh();
    } catch (e) {
      alert('Error assigning staff');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/projects/${projectId}/staff`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Failed to remove staff');
      
      router.refresh();
    } catch (e) {
      alert('Error removing staff');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* List of assigned staff */}
      <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-2">
        {assignedUsers.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">
            No staff assigned to this project yet.
          </div>
        ) : (
          assignedUsers.map(assignment => (
            <div key={assignment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div>
                <p className="font-medium text-sm text-white">{assignment.user.name}</p>
                <p className="text-xs text-slate-400">{assignment.user.role} • ${assignment.user.costPerHour?.toFixed(2) || '0.00'}/hr</p>
              </div>
              <button
                onClick={() => handleRemoveStaff(assignment.userId)}
                disabled={removingId === assignment.userId}
                className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors disabled:opacity-50"
                title="Remove Staff"
              >
                {removingId === assignment.userId ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Staff Controls */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <label className="text-sm font-medium text-slate-300 block mb-2">Assign New Staff</label>
        <div className="flex gap-2">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          >
            <option value="" disabled>Select user...</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
          <button
            onClick={handleAddStaff}
            disabled={isLoading || !selectedUserId}
            className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
