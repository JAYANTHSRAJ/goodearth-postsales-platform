import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { areAllStepsComplete } from '../../utils/kycValidation';

interface Step10ConfirmationProps {
  form: Record<string, any>;
  documents?: any[];
  onSubmit: (agreeAccuracy: boolean, agreeTerms: boolean) => void;
  onJumpToStep?: (step: number) => void;
  isSubmitting: boolean;
}

export const Step10Confirmation: React.FC<Step10ConfirmationProps> = ({
  form,
  documents = [],
  onSubmit,
  onJumpToStep,
  isSubmitting,
}) => {
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const allComplete = areAllStepsComplete(form, documents);
  const canSubmit = allComplete && agreeAccuracy && agreeTerms && !isSubmitting;

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 10: Legal Declaration & Final Submission"
        subtitle="Confirm statutory disclosures and submit application to GoodEarth DB"
      >
        <div className="space-y-6 pt-2">
          {!allComplete ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4" /> Incomplete Mandatory Information
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Please complete all mandatory fields in previous steps (Steps 1–8) before submitting your KYC application.
              </p>
              {onJumpToStep && (
                <button
                  type="button"
                  onClick={() => {
                    for (let s = 1; s <= 8; s++) {
                      if (!areAllStepsComplete(form, documents)) {
                        onJumpToStep(s);
                        break;
                      }
                    }
                  }}
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 underline hover:text-amber-900"
                >
                  Return to Incomplete Step
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" /> Ready for Final Authorization
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                All steps (1–8) are complete. Upon submission, your KYC details will be stored as the primary legal source of truth in GoodEarth PostgreSQL database.
              </p>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-brand-200 dark:border-brand-850 hover:bg-brand-50/30 transition-colors">
              <input
                type="checkbox"
                checked={agreeAccuracy}
                onChange={(e) => setAgreeAccuracy(e.target.checked)}
                className="mt-0.5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <div className="text-xs text-brand-800 dark:text-brand-200 leading-relaxed">
                <span className="font-bold text-brand-900 dark:text-white block mb-0.5">Statutory Accuracy Declaration</span>
                I hereby declare that all particulars entered in this 10-step application form are true, complete, and match my official identity proofs.
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-brand-200 dark:border-brand-850 hover:bg-brand-50/30 transition-colors">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <div className="text-xs text-brand-800 dark:text-brand-200 leading-relaxed">
                <span className="font-bold text-brand-900 dark:text-white block mb-0.5">Terms & Title Deed Agreement</span>
                I agree that the details provided herein will be reflected in all subsequent agreement drafts, sale deeds, and RERA registration documents.
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => onSubmit(agreeAccuracy, agreeTerms)}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center gap-2 ${
                canSubmit
                  ? 'bg-brand-900 hover:bg-brand-800 dark:bg-brand-100 dark:text-brand-950 dark:hover:bg-white cursor-pointer'
                  : 'bg-brand-300 dark:bg-brand-850 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...
                </>
              ) : (
                <>
                  Submit Final KYC Application <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
