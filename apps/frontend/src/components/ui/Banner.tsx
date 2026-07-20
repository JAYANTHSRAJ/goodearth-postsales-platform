import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface BannerProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export const Banner: React.FC<BannerProps> = ({ title, description, icon: Icon, action }) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-accent-200 bg-accent-50/50 p-6 dark:border-accent-900/30 dark:bg-accent-950/15 sm:flex-row sm:items-center sm:justify-between transition-all duration-200">
      <div className="flex gap-4">
        {Icon && (
          <div className="h-10 w-10 shrink-0 rounded-xl bg-accent-100 dark:bg-accent-950/40 text-accent-700 dark:text-accent-400 flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="text-left">
          <h4 className="font-serif text-base font-semibold text-accent-950 dark:text-accent-100">
            {title}
          </h4>
          <p className="mt-1 text-sm text-accent-800 dark:text-accent-300">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
