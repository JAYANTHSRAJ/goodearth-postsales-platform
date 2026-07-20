import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | React.ReactNode;
  subtext?: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
}) => {
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm dark:border-brand-800 dark:bg-brand-900 transition-all duration-300 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-500 dark:text-brand-400">
          {title}
        </span>
        <div className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 text-left">
        <h3 className="font-serif text-2xl font-semibold text-brand-900 dark:text-white sm:text-3xl">
          {value || '—'}
        </h3>
        {(subtext || badge) && (
          <div className="mt-2 flex items-center gap-2">
            {badge}
            {subtext && (
              <span className="text-xs text-brand-500 dark:text-brand-400">{subtext}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
