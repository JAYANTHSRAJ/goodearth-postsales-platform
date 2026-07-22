import React from 'react';
import { UploadCloud, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';

interface Step8DocumentUploadPlaceholderProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step8DocumentUploadPlaceholder: React.FC<Step8DocumentUploadPlaceholderProps> = ({
  form,
}) => {
  const hasCoApp = form.hasCoApplicant === 'Yes';
  const hasThirdApp = form.hasThirdApplicant === 'Yes';

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 8: Document Vault Upload Placeholders"
        subtitle="Verification document dropzones (Upload execution enabled in Phase 4)"
      >
        <div className="space-y-6 pt-2">
          {/* Information Notice Banner */}
          <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-850 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-brand-900 dark:text-white block">Document Upload Vault Interface</span>
              <p className="text-brand-600 dark:text-brand-300">
                Below are the designated upload dropzones for statutory proofs. Accepted formats: PDF, PNG, JPG (Max 5MB per file). Upload APIs will be connected during Phase 4.
              </p>
            </div>
          </div>

          {/* Primary Applicant Proof Placeholders */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" /> Primary Applicant Document Vault
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlaceholderWidget label="Primary Applicant Aadhaar Card / Passport" required maxMb="2MB" />
              <PlaceholderWidget label="Primary Applicant PAN Card" required maxMb="5MB" />
              <PlaceholderWidget label="Applicant Permanent Address Proof" required maxMb="5MB" multi />
              <PlaceholderWidget label="Applicant Voter ID (Optional)" maxMb="2MB" />
            </div>
          </div>

          {/* Co-Applicant Proof Placeholders */}
          {hasCoApp && (
            <div className="space-y-4 pt-4 border-t border-brand-100 dark:border-brand-850">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" /> Co-Applicant Document Vault
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PlaceholderWidget label="Co-Applicant Aadhaar Card / Passport" required maxMb="2MB" />
                <PlaceholderWidget label="Co-Applicant PAN Card" required maxMb="5MB" />
                <PlaceholderWidget label="Co-Applicant Address Proof" required maxMb="5MB" multi />
                <PlaceholderWidget label="Co-Applicant Voter ID (Optional)" maxMb="2MB" />
              </div>
            </div>
          )}

          {/* Third Applicant Proof Placeholders */}
          {hasThirdApp && (
            <div className="space-y-4 pt-4 border-t border-brand-100 dark:border-brand-850">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" /> Third Applicant Document Vault
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PlaceholderWidget label="Third Applicant Aadhaar Card" required maxMb="2MB" />
                <PlaceholderWidget label="Third Applicant PAN Card" required maxMb="2MB" />
                <PlaceholderWidget label="Third Applicant Address Proof" required maxMb="5MB" multi />
                <PlaceholderWidget label="Third Applicant Voter ID (Optional)" maxMb="2MB" />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const PlaceholderWidget: React.FC<{ label: string; required?: boolean; maxMb?: string; multi?: boolean }> = ({
  label,
  required,
  maxMb = '5MB',
  multi = false,
}) => {
  return (
    <div className="p-4 rounded-xl border border-dashed border-brand-200 dark:border-brand-800 bg-brand-50/20 dark:bg-brand-950/20 text-center space-y-2 hover:border-brand-400 transition-colors cursor-pointer">
      <UploadCloud className="h-6 w-6 text-brand-400 mx-auto" />
      <div className="space-y-1">
        <span className="text-xs font-semibold text-brand-900 dark:text-white block">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        <p className="text-[11px] text-brand-400">
          PDF, JPG or PNG format. Max {maxMb}. {multi ? '(Multiple files allowed)' : ''}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-[10px] font-semibold">
        <CheckCircle2 className="h-3 w-3 text-brand-500" /> Ready for Phase 4 Upload
      </span>
    </div>
  );
};
