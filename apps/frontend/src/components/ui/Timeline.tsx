import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export interface TimelineStep {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export const Timeline: React.FC<TimelineProps> = ({ steps }) => {
  return (
    <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-track-brand-50 scrollbar-thumb-brand-200 dark:scrollbar-track-brand-950 dark:scrollbar-thumb-brand-800 scroll-snap-x-mandatory">
      <div className="relative flex min-w-[700px] justify-between px-4">
        {/* Horizontal Connecting Line */}
        <div className="absolute left-8 right-8 top-[11px] h-0.5 bg-brand-200 dark:bg-brand-800" />

        {steps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center flex-1 text-center px-2 scroll-snap-align-start"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-brand-900">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400 fill-white dark:fill-brand-900" />
                ) : isCurrent ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-accent-500 bg-white dark:bg-brand-900">
                    <span className="h-2 w-2 rounded-full bg-accent-500" />
                  </span>
                ) : (
                  <Circle className="h-5 w-5 text-brand-300 dark:text-brand-700" />
                )}
              </span>
              <h5
                className={`mt-3 text-xs font-semibold ${
                  isCurrent
                    ? 'text-accent-700 dark:text-accent-400 font-serif'
                    : 'text-brand-800 dark:text-brand-200'
                }`}
              >
                {step.name}
              </h5>
              {step.date && (
                <span className="mt-1 text-[9px] font-mono text-brand-400 dark:text-brand-500 uppercase tracking-wider">
                  {step.date}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
