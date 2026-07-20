import React from 'react';

interface StatusBadgeProps {
  label: string;
  type?: 'success' | 'warning' | 'info' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, type = 'neutral' }) => {
  const styles = {
    success:
      'text-green-700 bg-green-50 border border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-900/30',
    warning:
      'text-accent-700 bg-accent-50 border border-accent-200 dark:text-accent-400 dark:bg-accent-950/20 dark:border-accent-900/30',
    info: 'text-brand-700 bg-brand-50 border border-brand-200 dark:text-brand-400 dark:bg-brand-950/20 dark:border-brand-900/30',
    neutral:
      'text-brand-600 bg-brand-50 border border-brand-200 dark:text-brand-300 dark:bg-brand-950/40 dark:border-brand-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[type]}`}
    >
      {label}
    </span>
  );
};
