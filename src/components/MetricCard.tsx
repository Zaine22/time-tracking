import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn("glass-panel rounded-xl p-6 transition-transform hover:-translate-y-1 duration-300", className)}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
        <div className="p-2 rounded-lg bg-white/5 text-slate-300">
          <Icon size={20} />
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold text-white">{value}</span>
        
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", 
              trend.isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            )}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-400">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
