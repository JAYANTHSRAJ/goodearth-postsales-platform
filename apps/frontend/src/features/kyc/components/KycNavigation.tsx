import React from 'react';
import { useNavigate } from 'react-router-dom';

interface KycNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  nextLabel?: string;
  isSubmitting?: boolean;
  canNext?: boolean;
}

export const KycNavigation: React.FC<KycNavigationProps> = ({
  onBack,
  onNext,
  onSaveDraft,
  nextLabel = 'Continue',
  isSubmitting = false,
  canNext = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={onBack || (() => navigate(-1))}
        className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
      >
        Back
      </button>

      <div className="flex items-center gap-3">
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            className="px-5 py-2.5 rounded-xl border border-brand-200 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-all"
          >
            Save Draft
          </button>
        )}

        {onNext && (
          <button
            type="button"
            disabled={!canNext || isSubmitting}
            onClick={onNext}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/20"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : (
              nextLabel
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default KycNavigation;
