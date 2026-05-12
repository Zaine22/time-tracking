'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, Save } from 'lucide-react';

interface UserFormProps {
  initialData?: {
    id: string;
    name: string;
    email: string;
    role: string;
    costPerHour: number | null;
  };
}

export function UserForm({ initialData }: UserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || 'STAFF',
    costPerHour: initialData?.costPerHour ? String(initialData.costPerHour) : ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        password: '',
        role: initialData.role,
        costPerHour: initialData.costPerHour ? String(initialData.costPerHour) : ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }
    if (!isEditing && !formData.password) {
      setError('Password is required when creating a new user');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isEditing ? `/api/users/${initialData.id}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';

      // Only send password if it was filled in
      const body: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        costPerHour: formData.costPerHour ? Number(formData.costPerHour) : null
      };
      if (formData.password) {
        body.password = formData.password;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} user`);
      }

      router.push('/users');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/20 text-primary">
          {isEditing ? <Save size={20} /> : <UserPlus size={20} />}
        </div>
        <h2 className="text-xl font-bold">{isEditing ? 'Update User' : 'Add New User'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20">{error}</div>}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Jane Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="jane@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {isEditing ? 'New Password' : 'Password'}
            {isEditing && <span className="text-slate-500 text-xs ml-2">(leave blank to keep current)</span>}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder={isEditing ? '••••••••' : 'Min. 6 characters'}
            minLength={isEditing ? undefined : 6}
            required={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Role</label>
          <select
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
            className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
            <option value="ACCOUNTING">Accounting</option>
            <option value="SUPERADMIN">Super Admin</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Cost per Hour ($)</label>
          <input
            type="number"
            step="0.01"
            value={formData.costPerHour}
            onChange={e => setFormData({...formData, costPerHour: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. 25.00"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium rounded-lg flex justify-center items-center gap-2 mt-2"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? <Save size={18} /> : <UserPlus size={18} />)}
          {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create User')}
        </button>
      </form>
    </div>
  );
}
