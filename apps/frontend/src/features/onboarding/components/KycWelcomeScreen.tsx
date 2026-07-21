import React from 'react';
import { ShieldCheck, FileCheck, Users, Lock, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface KycWelcomeScreenProps {
  onStartWizard: () => void;
}

export const KycWelcomeScreen: React.FC<KycWelcomeScreenProps> = ({ onStartWizard }) => {
  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Editorial Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-850 to-brand-950 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800/80 border border-brand-700/50 text-[11px] font-semibold text-brand-200">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
            Official Homeowner Verification
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            GoodEarth KYC & Registry Verification
          </h1>
          <p className="text-sm text-brand-200 leading-relaxed">
            Welcome to the GoodEarth Homeowner Onboarding Journey. Completing this digital KYC application enables legal record verification, title deed preparation, and personalized design studio access.
          </p>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2 hover:border-brand-400 transition-colors">
          <div className="p-3 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-xl w-fit">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-base font-bold text-brand-900 dark:text-white">
            1. Identity Details
          </h3>
          <p className="text-xs text-brand-600 dark:text-brand-400 leading-relaxed">
            Provide applicant PAN, Aadhaar, permanent address, and occupational information.
          </p>
        </Card>

        <Card className="p-5 space-y-2 hover:border-brand-400 transition-colors">
          <div className="p-3 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-xl w-fit">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-base font-bold text-brand-900 dark:text-white">
            2. Co-Applicants
          </h3>
          <p className="text-xs text-brand-600 dark:text-brand-400 leading-relaxed">
            Register co-buyers or family members for joint unit ownership agreements.
          </p>
        </Card>

        <Card className="p-5 space-y-2 hover:border-brand-400 transition-colors">
          <div className="p-3 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-xl w-fit">
            <FileCheck className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-base font-bold text-brand-900 dark:text-white">
            3. Document Vault
          </h3>
          <p className="text-xs text-brand-600 dark:text-brand-400 leading-relaxed">
            Upload digital scans of PAN, Aadhaar, and address proof for automated verification.
          </p>
        </Card>
      </div>

      {/* Security & Instructions Callout */}
      <Card className="p-6 bg-brand-50/50 dark:bg-brand-900/20 border-brand-200/80 dark:border-brand-850">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300 rounded-xl shrink-0 mt-0.5">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-2 text-xs text-brand-700 dark:text-brand-300">
            <h4 className="font-bold text-sm text-brand-900 dark:text-white">
              Important Compliance Guidelines
            </h4>
            <ul className="list-disc list-inside space-y-1 text-brand-600 dark:text-brand-400">
              <li>Ensure all names match your official government identity documents exactly.</li>
              <li>Have your Aadhaar, PAN, and address proof files ready in PDF, JPG, or PNG format.</li>
              <li>You can save a draft at any step and resume your verification anytime.</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Start Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onStartWizard}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-700 to-brand-900 hover:from-brand-800 hover:to-brand-950 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          Begin KYC Verification
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
};
