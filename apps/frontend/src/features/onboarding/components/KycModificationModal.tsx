import React, { useState } from 'react';
import { X, Send, Loader2, AlertCircle } from 'lucide-react';

interface KycModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReason: (reason: string) => void;
  isSubmitting: boolean;
}

export const KycModificationModal: React.FC<KycModificationModalProps> = ({
  isOpen,
  onClose,
  onSubmitReason,
  isSubmitting,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for requesting KYC modification.');
      return;
    }
    setError(null);
    onSubmitReason(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-brand-900 p-6 shadow-2xl border border-brand-200 dark:border-brand-800 text-left space-y-5">
        <div className="flex items-center justify-between border-b border-brand-100 dark:border-brand-850 pb-3">
          <h3 className="font-serif text-lg font-bold text-brand-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Request KYC Modification
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-brand-400 hover:text-brand-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-brand-600 dark:text-brand-300 leading-relaxed">
          Your KYC verification record is currently locked in read-only mode. Submitting a modification request will alert the CRM team. Once approved, the form will be unlocked for re-submission.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1.5">
              Reason for Modification Request <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Updated permanent residence address / Corrected co-applicant passport detail"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/30 p-3 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/30 dark:text-white"
            />
            {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  Submit to CRM
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
