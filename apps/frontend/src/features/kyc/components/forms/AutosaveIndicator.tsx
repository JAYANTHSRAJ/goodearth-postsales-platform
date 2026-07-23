import React from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt?: string | null;
  onRetry?: () => void;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSavedAt,
  onRetry,
}) => {
  if (status === 'idle' && !lastSavedAt) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      {status === 'saving' && (
        <>
          <span className="h-2 w-2 animate-ping rounded-full bg-amber-500 shrink-0" />
          <span className="text-amber-600 dark:text-amber-400 font-medium">Autosaving changes...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-500 fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-emerald-700 dark:text-emerald-300">
            Saved {lastSavedAt ? `at ${new Date(lastSavedAt).toLocaleTimeString()}` : ''}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
          <span className="text-rose-600 dark:text-rose-400 font-medium">Save failed</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-1 text-xs underline font-bold text-rose-700 dark:text-rose-300 hover:opacity-80"
            >
              Retry
            </button>
          )}
        </>
      )}

      {status === 'offline' && (
        <>
          <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
          <span className="text-slate-500">Offline (Changes pending)</span>
        </>
      )}
    </div>
  );
};

export default AutosaveIndicator;
