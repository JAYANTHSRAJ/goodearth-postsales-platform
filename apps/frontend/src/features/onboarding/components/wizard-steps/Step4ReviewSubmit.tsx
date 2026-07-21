import React, { useState } from 'react';
import { Card } from '../../../../components/ui/Card';
import { User, FileText, ChevronDown, ChevronUp, Lock, RefreshCw, Clock } from 'lucide-react';
import { KycModificationModal } from '../KycModificationModal';

interface Step4Props {
  form: Record<string, any>;
  isLocked?: boolean;
  hasPendingModificationRequest?: boolean;
  modificationRequestReason?: string;
  onEditStep: (step: number) => void;
  onRequestModification?: (reason: string) => void;
  isSubmittingModification?: boolean;
}

export const Step4ReviewSubmit: React.FC<Step4Props> = ({
  form,
  isLocked = false,
  hasPendingModificationRequest = false,
  modificationRequestReason = '',
  onEditStep,
  onRequestModification,
  isSubmittingModification = false,
}) => {
  const [declared, setDeclared] = useState(isLocked);
  const [openSection, setOpenSection] = useState<string>('primary');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleSection = (sec: string) => {
    setOpenSection(openSection === sec ? '' : sec);
  };

  const handleModalSubmit = (reason: string) => {
    if (onRequestModification) {
      onRequestModification(reason);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Pending Modification Notice Banner */}
      {hasPendingModificationRequest && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">KYC Modification Request Pending CRM Approval</h4>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              Your request to unlock and modify this KYC record is under review by the CRM team.
              <br />
              <span className="font-mono text-[11px] font-bold">Reason: "{modificationRequestReason}"</span>
            </p>
          </div>
        </div>
      )}

      {/* Read-Only Status Banner */}
      {isLocked && !hasPendingModificationRequest && (
        <div className="p-4 rounded-xl bg-brand-50/80 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-850 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 flex items-center justify-center shrink-0 font-bold">
              <Lock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-brand-900 dark:text-white">KYC Record Verified & Read-Only</h4>
              <p className="text-[11px] text-brand-500">This identity application is locked. If you need to update details, submit a modification request.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Request Modification
          </button>
        </div>
      )}

      <Card
        title={isLocked ? 'Verified KYC Records (Read-Only)' : 'Final Review & Digital Verification'}
        subtitle={isLocked ? 'Official identity records submitted for legal agreement processing' : 'Please review all entered details and uploaded identity documents before final submission'}
      >
        <div className="space-y-4">
          {/* Primary Applicant Accordion */}
          <div className="border border-brand-200 dark:border-brand-850 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('primary')}
              className="w-full p-4 bg-brand-50/50 dark:bg-brand-900/40 flex items-center justify-between font-bold text-xs text-brand-900 dark:text-white"
            >
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-brand-600" />
                Primary Applicant: {form.salutation} {form.firstName} {form.lastName}
              </span>
              <div className="flex items-center gap-2">
                {!isLocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStep(1);
                    }}
                    className="text-[11px] font-semibold text-brand-600 underline hover:text-brand-800"
                  >
                    Edit Step 1
                  </button>
                )}
                {openSection === 'primary' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>
            {openSection === 'primary' && (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white dark:bg-brand-950/20">
                <div>
                  <span className="block text-[10px] text-brand-400 font-bold uppercase">Email</span>
                  <span className="font-medium text-brand-800 dark:text-brand-200">{form.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-400 font-bold uppercase">Mobile Phone</span>
                  <span className="font-medium text-brand-800 dark:text-brand-200">+{form.phoneCode} {form.phoneNumber}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-400 font-bold uppercase">PAN Number</span>
                  <span className="font-mono font-bold text-brand-800 dark:text-brand-200">{form.panNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-400 font-bold uppercase">Aadhaar Number</span>
                  <span className="font-mono font-bold text-brand-800 dark:text-brand-200">{form.aadhaarNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-400 font-bold uppercase">Date of Birth</span>
                  <span className="font-medium text-brand-800 dark:text-brand-200">{form.dob || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Documents Accordion */}
          <div className="border border-brand-200 dark:border-brand-850 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('docs')}
              className="w-full p-4 bg-brand-50/50 dark:bg-brand-900/40 flex items-center justify-between font-bold text-xs text-brand-900 dark:text-white"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                Uploaded Documents Vault Status
              </span>
              <div className="flex items-center gap-2">
                {!isLocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStep(3);
                    }}
                    className="text-[11px] font-semibold text-brand-600 underline hover:text-brand-800"
                  >
                    Edit Step 3
                  </button>
                )}
                {openSection === 'docs' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>
            {openSection === 'docs' && (
              <div className="p-4 space-y-2 text-xs bg-white dark:bg-brand-950/20">
                <div className="flex justify-between items-center py-1.5 border-b border-brand-100 dark:border-brand-850">
                  <span className="text-brand-700 dark:text-brand-300">Primary Aadhaar Card Scan</span>
                  <span className={`font-semibold ${form.primaryAadhaarUrl ? 'text-green-600' : 'text-red-500'}`}>
                    {form.primaryAadhaarUrl ? '✓ Uploaded' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-brand-100 dark:border-brand-850">
                  <span className="text-brand-700 dark:text-brand-300">Primary PAN Card Scan</span>
                  <span className={`font-semibold ${form.primaryPanUrl ? 'text-green-600' : 'text-red-500'}`}>
                    {form.primaryPanUrl ? '✓ Uploaded' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-brand-700 dark:text-brand-300">Residence Address Proof</span>
                  <span className={`font-semibold ${form.primaryAddressProofUrl ? 'text-green-600' : 'text-red-500'}`}>
                    {form.primaryAddressProofUrl ? '✓ Uploaded' : 'Missing'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Declaration Box */}
        <div className="mt-6 p-4 rounded-xl bg-brand-50/50 dark:bg-brand-900/20 border border-brand-200/80 dark:border-brand-850 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={declared}
              disabled={isLocked}
              onChange={(e) => setDeclared(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-brand-700 rounded border-brand-300 focus:ring-brand-500"
            />
            <span className="text-xs text-brand-800 dark:text-brand-200 leading-relaxed font-medium">
              I hereby declare that all information provided in this KYC verification form is true, correct, and matches my submitted government identity and address documents. I authorize GoodEarth to use these records for legal registry agreement generation.
            </span>
          </label>
        </div>
      </Card>

      <KycModificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitReason={handleModalSubmit}
        isSubmitting={isSubmittingModification}
      />
    </div>
  );
};
