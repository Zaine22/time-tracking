'use client';

import React from 'react';
import { LayoutDashboard, Clock, FileText, Settings, LogOut, User, Users, Briefcase, Calculator } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayoutClient({ 
  children, 
  userName = "Staff Member", 
  role = "STAFF",
  isProjectOwner = false
}: { 
  children: React.ReactNode, 
  userName?: string, 
  role?: string,
  isProjectOwner?: boolean
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 glass-panel border-r border-b md:border-b-0 flex flex-col sticky top-0 md:h-screen z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="text-xl font-bold text-gradient">TimeTrack</span>
        </div>
        
        <div className="px-4 py-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-white/5 border border-white/10 mb-6">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User size={16} className="text-slate-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs text-slate-400">{role}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link href="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${pathname === '/' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          {(role === 'STAFF' || role === 'ADMIN') && (
            <Link href="/time-logs" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname?.startsWith('/time-logs') ? 'bg-primary/10 text-primary font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
              <Clock size={18} />
              Time Logs
            </Link>
          )}
          
          {(role === 'SUPERADMIN' || role === 'ADMIN' || role === 'ACCOUNTING') && (
            <Link href="/reports" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/reports' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
              <FileText size={18} />
              Reports
            </Link>
          )}

          {role === 'SUPERADMIN' && (
            <>
              <Link href="/users" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/users' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                <Users size={18} />
                Manage Users
              </Link>
              <Link href="/projects" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/projects' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                <Briefcase size={18} />
                Manage Projects
              </Link>
            </>
          )}

          {role === 'ACCOUNTING' && (
            <Link href="/projects" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/projects' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
              <Briefcase size={18} />
              View Projects
            </Link>
          )}

          {(role === 'SUPERADMIN' || role === 'ACCOUNTING' || role === 'ADMIN' || role === 'STAFF') && (
            <Link href="/payroll" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname?.startsWith('/payroll') ? 'bg-primary/10 text-primary font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
              <Calculator size={18} />
              Payroll
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 mt-auto">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors">
            <Settings size={18} />
            Settings
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-red-400 hover:bg-red-400/10 transition-colors mt-1"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
