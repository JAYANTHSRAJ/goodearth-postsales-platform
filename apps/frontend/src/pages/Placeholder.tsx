import React from 'react';

interface PlaceholderProps {
  title: string;
  description: string;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ title, description }) => {
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-8 dark:border-brand-800 dark:bg-brand-900/60 transition-colors duration-200">
      <h2 className="font-serif text-2xl font-semibold text-brand-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-sm text-brand-600 dark:text-brand-300 font-sans">{description}</p>

      {/* Wireframe skeleton representing the slot structure */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 rounded-xl bg-brand-50/50 border border-dashed border-brand-200 dark:bg-brand-950/20 dark:border-brand-800 flex items-center justify-center">
          <span className="text-xs text-brand-400 dark:text-brand-500 font-mono">
            Wireframe slot A
          </span>
        </div>
        <div className="h-32 rounded-xl bg-brand-50/50 border border-dashed border-brand-200 dark:bg-brand-950/20 dark:border-brand-800 flex items-center justify-center">
          <span className="text-xs text-brand-400 dark:text-brand-500 font-mono">
            Wireframe slot B
          </span>
        </div>
        <div className="h-32 rounded-xl bg-brand-50/50 border border-dashed border-brand-200 dark:bg-brand-950/20 dark:border-brand-800 flex items-center justify-center">
          <span className="text-xs text-brand-400 dark:text-brand-500 font-mono">
            Wireframe slot C
          </span>
        </div>
      </div>
    </div>
  );
};
