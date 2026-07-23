import React from 'react';

interface KycErrorStateProps {
  title?: string;
  message?: string;
  type?: 'unauthorized' | 'forbidden' | 'validation' | 'network' | 'server' | 'empty';
  onRetry?: () => void;
}

export const KycErrorState: React.FC<KycErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load KYC verification data.',
  type = 'server',
  onRetry,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center my-6 shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
        <svg className="w-7 h-7 stroke-current" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <span className="text-xs uppercase tracking-wider font-semibold text-rose-500">{type} error</span>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default KycErrorState;
