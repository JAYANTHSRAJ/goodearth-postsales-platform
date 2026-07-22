import React, { useState } from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';

interface Step10FinalSubmitProps {
  form: Record<string, any>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const Step10FinalSubmit: React.FC<Step10FinalSubmitProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);

  const canSubmit = agreeTerms && agreeAccuracy && !isSubmitting;

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 10: Legal Declaration & Final Submission"
        subtitle="Authorize legal record verification and synchronize with GoodEarth CRM"
      >
        <div className="space-y-6 pt-2">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-950 text-white space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold">GoodEarth Legal Verification Assurance</h4>
                <p className="text-xs text-brand-300">Primary Database of Record Encryption Enabled</p>
              </div>
            </div>
            <p className="text-xs text-brand-200 leading-relaxed">
              By submitting this KYC application, all entered parameters will be stored in GoodEarth's primary database of record and synchronized with your assigned property unit deal.
            </p>
          </div>

          <div className="space-y-4 pt-2 border-t border-brand-100 dark:border-brand-850">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeAccuracy}
                onChange={(e) => setAgreeAccuracy(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-brand-800 dark:text-brand-200">
                I hereby declare that all information and identity documents uploaded in this application are accurate, valid, and belong to the primary homeowner or co-applicants.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-brand-800 dark:text-brand-200">
                I authorize GoodEarth to use this verified profile for legal title deed preparation, sale agreement generation, and statutory registration compliance.
              </span>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 text-xs font-bold transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Submitting Application...' : 'Finalize & Submit KYC'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
