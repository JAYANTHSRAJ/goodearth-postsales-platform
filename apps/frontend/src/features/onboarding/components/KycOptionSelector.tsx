import React from 'react';
import { Card } from '../../../components/ui/Card';
import { ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface KycOptionSelectorProps {
  availableVerifiedKycs: Array<{
    id: string;
    unitName: string;
    kycApplicationId?: string;
  }>;
  onReuseKyc: (sourceKycId: string) => void;
  onStartNewKyc: () => void;
  isReusing: boolean;
}

export const KycOptionSelector: React.FC<KycOptionSelectorProps> = ({
  availableVerifiedKycs,
  onReuseKyc,
  onStartNewKyc,
  isReusing,
}) => {
  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Option 1: Reuse Verified KYC (if available) */}
      {availableVerifiedKycs && availableVerifiedKycs.length > 0 && (
        <Card
          title="Option 1: Use Existing Verified KYC"
          subtitle="Reuse identity records from your other verified GoodEarth properties without uploading files again"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-xs text-green-800 dark:text-green-300 font-medium">
                We found existing verified KYC records under your customer profile. Linking an existing KYC completes verification instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableVerifiedKycs.map((unit) => (
                <div
                  key={unit.id}
                  className="p-4 rounded-2xl border border-brand-200/80 dark:border-brand-850 bg-white dark:bg-brand-900 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-green-600" />
                      <span className="text-xs font-bold text-brand-900 dark:text-white">{unit.unitName}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-green-600 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>

                  <p className="text-[11px] text-brand-500 leading-relaxed">
                    Identity scans, address proof, and applicant details are ready for automatic linkage.
                  </p>

                  <button
                    type="button"
                    disabled={isReusing}
                    onClick={() => {
                      if (unit.kycApplicationId) {
                        onReuseKyc(unit.kycApplicationId);
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Use Verified KYC ({unit.unitName})
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Option 2: Fill New KYC Wizard */}
      <Card
        title={availableVerifiedKycs && availableVerifiedKycs.length > 0 ? 'Option 2: Fill New KYC Application' : 'Complete Property KYC Verification'}
        subtitle="Submit fresh identity scans and applicant details specifically for this property allotment"
      >
        <div className="space-y-4">
          <p className="text-xs text-brand-600 dark:text-brand-300 leading-relaxed">
            If you wish to submit updated identity documents or separate co-applicant records for this unit, launch the GoodEarth KYC wizard below.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={onStartNewKyc}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 transition-colors shadow-md"
            >
              Fill New KYC Application
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
