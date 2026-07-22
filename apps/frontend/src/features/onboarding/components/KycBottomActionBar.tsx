import React from 'react';
import { Save, ChevronLeft, ChevronRight, CheckCircle, Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KycBottomActionBarProps {
  currentStep: number;
  totalSteps?: number;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
  isLocked?: boolean;
  draftSuccess?: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSaveDraft: () => void;
  onSubmitKyc?: () => void;
  onResumeLater?: () => void;
}

export const KycBottomActionBar: React.FC<KycBottomActionBarProps> = ({
  currentStep,
  totalSteps = 10,
  isSubmitting = false,
  isSavingDraft = false,
  isLocked = false,
  draftSuccess = false,
  onPrevStep,
  onNextStep,
  onSaveDraft,
  onSubmitKyc,
  onResumeLater,
}) => {
  const navigate = useNavigate();

  const handleResumeLater = () => {
    if (!isLocked) {
      onSaveDraft();
    }
    if (onResumeLater) {
      onResumeLater();
    } else {
      navigate('/dashboard/home');
    }
  };

  return (
    <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 -mb-6 mt-8 p-4 sm:p-5 bg-white/90 dark:bg-brand-900/90 backdrop-blur-md border-t border-brand-200/80 dark:border-brand-850 rounded-b-2xl flex flex-wrap items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-3">
        {!isLocked && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-100/60 dark:bg-brand-800 hover:bg-brand-200/80 transition-colors disabled:opacity-50"
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Draft
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleResumeLater}
          disabled={isSavingDraft || isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-800/50 transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {isLocked ? 'Exit View' : 'Resume Later'}
        </button>

        {!isLocked && draftSuccess && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
            <CheckCircle className="h-3.5 w-3.5" /> Draft Saved
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={onPrevStep}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-800/50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
        )}

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={onNextStep}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900 shadow-md transition-all duration-200 disabled:opacity-50"
          >
            Next Step
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : isLocked ? (
          <button
            type="button"
            onClick={() => navigate('/my-home')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all duration-200"
          >
            Back to Dashboard
            <CheckCircle className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmitKyc}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900 shadow-md transition-all duration-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting Verification...
              </>
            ) : (
              <>
                Submit KYC Application
                <CheckCircle className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
