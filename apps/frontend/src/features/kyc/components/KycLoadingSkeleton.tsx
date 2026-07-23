import React from 'react';

export const KycLoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-40 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
      </div>
    </div>
  );
};

export default KycLoadingSkeleton;
