import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
}) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h4>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trend && (
          <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {trend}
          </span>
        )}
      </div>
      <div className={`p-3 rounded-xl border ${colorStyles[color]} shadow-xs`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
