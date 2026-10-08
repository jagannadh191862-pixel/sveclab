import React from 'react';

interface BadgeProps {
  variant: 'available' | 'booked' | 'break' | 'past' | 'cancelled' | 'active' | 'inactive' | 'admin' | 'user';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant, label, size = 'md', children }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const variantStyles = {
    available: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    booked: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    break: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    past: 'bg-slate-100 text-slate-500 border border-slate-200',
    cancelled: 'bg-gray-100 text-gray-600 border border-gray-300 line-through',
    active: 'bg-teal-50 text-teal-700 border border-teal-200',
    inactive: 'bg-slate-100 text-slate-600 border border-slate-200',
    admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    user: 'bg-sky-50 text-sky-700 border border-sky-200',
  };

  const defaultLabels = {
    available: 'Available',
    booked: 'Booked',
    break: 'Lunch Break',
    past: 'Past Slot',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
    admin: 'Administrator',
    user: 'Faculty User',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full tracking-wide shadow-xs ${sizeClasses[size]} ${variantStyles[variant]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          variant === 'available'
            ? 'bg-emerald-500'
            : variant === 'booked'
            ? 'bg-rose-500'
            : variant === 'break'
            ? 'bg-amber-500'
            : variant === 'admin'
            ? 'bg-indigo-500'
            : variant === 'active'
            ? 'bg-teal-500'
            : 'bg-slate-400'
        }`}
      />
      {children || label || defaultLabels[variant]}
    </span>
  );
};
