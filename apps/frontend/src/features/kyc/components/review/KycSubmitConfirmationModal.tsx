import React, { useEffect } from 'react';

interface KycSubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  applicantCount: number;
  uploadedDocCount: number;
  missingDocCount: number;
}

export const KycSubmitConfirmationModal: React.FC<KycSubmitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  applicantCount,
  uploadedDocCount,
  missingDocCount,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 focus:outline-none" tabIndex={-1}>
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold">
            ✓
          </div>
          <div>
            <h3 id="confirm-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Confirm KYC Submission
            </h3>
            <p className="text-xs text-slate-500">GoodEarth Post-Sales Verification Queue</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Applicants Recorded:</span>
            <span className="font-bold text-slate-900 dark:text-white">{applicantCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Uploaded Documents:</span>
            <span className="font-bold text-brand-600">{uploadedDocCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Missing Mandatory Documents:</span>
            <span className={`font-bold ${missingDocCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {missingDocCount}
            </span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          <p className="font-bold">Submission Notice:</p>
          <p className="mt-0.5">
            Once submitted, your KYC form will be locked for verification by the CRM team. You will be notified via email upon approval or request for document corrections.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-slate-600 hover:bg-slate-50 focus:ring-2 focus:ring-brand-500"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || missingDocCount > 0}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all shadow-md shadow-brand-500/20 focus:ring-2 focus:ring-brand-500"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </span>
            ) : (
              'Confirm & Submit'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KycSubmitConfirmationModal;
