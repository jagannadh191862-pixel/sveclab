import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; height?: string; className?: string }> = ({
  rows = 5,
  height = 'h-12',
  className = '',
}) => {
  return (
    <div className={`space-y-3 w-full animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`bg-slate-200/80 rounded-xl w-full ${height}`} />
      ))}
    </div>
  );
};
