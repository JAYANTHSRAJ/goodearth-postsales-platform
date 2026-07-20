import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-brand-200 rounded-2xl dark:border-brand-800">
      <div className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="font-serif text-base font-semibold text-brand-900 dark:text-white mb-1">
        {title}
      </h4>
      <p className="text-xs text-brand-500 dark:text-brand-400 max-w-sm">{description}</p>
    </div>
  );
};
