import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActivityItemProps {
  description: string;
  date: string;
  icon?: LucideIcon;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ description, date, icon: Icon }) => {
  return (
    <div className="flex gap-4 py-3 border-b border-brand-100/50 last:border-none dark:border-brand-800/40">
      {Icon && (
        <div className="h-8 w-8 shrink-0 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm text-brand-800 dark:text-brand-200 font-sans">{description}</p>
        <span className="text-[10px] font-mono text-brand-400 mt-1 block">{date}</span>
      </div>
    </div>
  );
};
