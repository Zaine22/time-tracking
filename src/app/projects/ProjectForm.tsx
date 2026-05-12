'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, Save } from 'lucide-react';

interface ProjectFormProps {
  users: any[];
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
  };
}

export function ProjectForm({ users, initialData }: ProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    ownerId: initialData?.ownerId || ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        ownerId: initialData.ownerId || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.ownerId) {
      setError('Name and Owner are required');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isEditing ? `/api/projects/${initialData.id}` : '/api/projects';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} project`);

      const data = await res.json();

      if (!isEditing) {
        setFormData({ name: '', description: '', ownerId: '' });
        router.push(`/projects/${data.id}`);
      } else {
        router.push('/projects');
      }
      
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/20 text-primary">
          {isEditing ? <Save size={20} /> : <PlusCircle size={20} />}
        </div>
        <h2 className="text-xl font-bold">{isEditing ? 'Project Details' : 'New Project'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Project Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. Project Phoenix"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Brief project details..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Project Owner</label>
          <select
            value={formData.ownerId}
            onChange={e => setFormData({...formData, ownerId: e.target.value})}
            className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="" disabled>Select Owner...</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium rounded-lg flex justify-center items-center gap-2 mt-2"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? <Save size={18} /> : <PlusCircle size={18} />)}
          {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Project')}
        </button>
      </form>
    </div>
  );
}
