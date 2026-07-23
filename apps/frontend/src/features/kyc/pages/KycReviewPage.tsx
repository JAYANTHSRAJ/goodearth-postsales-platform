import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import KycStepper from '../components/KycStepper';
import KycNavigation from '../components/KycNavigation';
import KycLoadingSkeleton from '../components/KycLoadingSkeleton';
import KycStatusBanner from '../components/review/KycStatusBanner';
import KycValidationChecklist from '../components/review/KycValidationChecklist';
import KycTimelineList from '../components/review/KycTimelineList';
import KycSubmitConfirmationModal from '../components/review/KycSubmitConfirmationModal';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto, KycTimelineResponseDto, KycValidationSummaryResponseDto } from '../types/kyc';
import { useUnitStore } from '../../../store/unitStore';

export const KycReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeUnit } = useUnitStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [kycData, setKycData] = useState<KycApplicationResponseDto | null>(null);
  const [validationSummary, setValidationSummary] = useState<KycValidationSummaryResponseDto | null>(null);
  const [timeline, setTimeline] = useState<KycTimelineResponseDto | null>(null);
  
  // Phase 5A Declarations
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const bookingId = searchParams.get('bookingId') || activeUnit?.unitName || activeUnit?.workflowId || activeUnit?.id || 'BKG-2026-101';

  const loadData = async () => {
    try {
      const data = await kycService.getKycByBooking(bookingId);
      setKycData(data);
      const valSummary = await kycService.validateKyc(bookingId).catch(() => null);
      if (valSummary) setValidationSummary(valSummary);

      const timelineData = await kycService.getKycTimeline(bookingId).catch(() => null);
      if (timelineData) setTimeline(timelineData);
    } catch (err) {
      // Handled in UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmSubmit = async () => {
    if (!kycData?.kycApplicationId) return;
    setSubmitting(true);
    try {
      const updated = await kycService.submitKyc({
        kycApplicationId: kycData.kycApplicationId,
        declarationAccepted: true,
      });
      setKycData(updated);
      setIsConfirmModalOpen(false);
      navigate('/client/kyc');
    } catch (err: any) {
      alert(err?.message || 'Failed to submit KYC application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <KycLoadingSkeleton />
      </div>
    );
  }

  const documentSlots = kycData?.documentSlots || [];
  const requiredSlots = documentSlots.filter((s) => s.isRequired);
  const uploadedRequiredSlots = requiredSlots.filter((s) => !!s.currentVersion);
  const missingSlots = requiredSlots.filter((s) => !s.currentVersion);

  const isValidationPassing = validationSummary?.overallValid ?? false;
  const canProceedToSubmit = isValidationPassing && declarationAccepted && consentAccepted && kycData?.status !== 'SUBMITTED' && kycData?.status !== 'APPROVED';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Step 4: Review & Declaration</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your complete application summary, address missing requirements, and accept declarations.
        </p>
      </div>

      <KycStepper currentStepId="review" status={kycData?.status} />

      <KycStatusBanner
        status={kycData?.status}
        submittedAt={kycData?.submittedAt}
        verifiedAt={kycData?.verifiedAt}
        verifiedBy={kycData?.verifiedBy}
      />

      <KycValidationChecklist
        kycData={kycData}
        validationSummary={validationSummary}
        bookingId={bookingId}
      />

      {/* Primary & Joint Applicant Summaries */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Applicant Profiles Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs font-bold text-brand-600 uppercase">Primary Applicant</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{kycData?.primaryApplicant?.fullName || 'N/A'}</p>
            <p className="text-xs text-slate-500">Email: {kycData?.primaryApplicant?.email || 'N/A'}</p>
            <p className="text-xs text-slate-500">Phone: {kycData?.primaryApplicant?.phone || 'N/A'}</p>
            <p className="text-xs text-slate-500">PAN: {kycData?.primaryApplicant?.panNumber || 'N/A'}</p>
            <p className="text-xs text-slate-500">Aadhaar: {kycData?.primaryApplicant?.maskedAadhaarNumber || 'N/A'}</p>
            {kycData?.primaryApplicant?.address?.city && (
              <p className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-200 dark:border-slate-700">
                Address: {kycData.primaryApplicant.address.street}, {kycData.primaryApplicant.address.city}, {kycData.primaryApplicant.address.state} - {kycData.primaryApplicant.address.pincode}
              </p>
            )}
          </div>

          {kycData?.jointApplicants?.map((joint, idx) => (
            <div key={joint.id || idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                {joint.applicantType === 'JOINT_1' ? 'Co-Applicant' : 'Third Applicant'} ({joint.applicantType})
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{joint.fullName || 'N/A'}</p>
              <p className="text-xs text-slate-500">Email: {joint.email || 'N/A'}</p>
              <p className="text-xs text-slate-500">Phone: {joint.phone || 'N/A'}</p>
              <p className="text-xs text-slate-500">PAN: {joint.panNumber || 'N/A'}</p>
              <p className="text-xs text-slate-500">Aadhaar: {joint.maskedAadhaarNumber || 'N/A'}</p>
              {joint.address?.city && (
                <p className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-200 dark:border-slate-700">
                  Address: {joint.address.street}, {joint.address.city}, {joint.address.state} - {joint.address.pincode}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Document Slots Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Document Verification Summary ({uploadedRequiredSlots.length}/{requiredSlots.length} Uploaded)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documentSlots.map((slot) => (
            <div key={slot.documentId} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{slot.documentType} ({slot.applicantType})</p>
                <p className="text-[11px] text-slate-500">{slot.currentVersion?.fileName || 'No file uploaded'}</p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${slot.currentVersion ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {slot.currentVersion ? `v${slot.currentVersion.versionNumber}` : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Declarations & Consent */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Legal Declarations & Consent
        </h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              disabled={kycData?.status === 'SUBMITTED' || kycData?.status === 'APPROVED'}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              I/We hereby confirm and declare that all identity details, contact information, address proofs, and documents submitted in this application are true, accurate, and legally authentic.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              disabled={kycData?.status === 'SUBMITTED' || kycData?.status === 'APPROVED'}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              I/We authorize GoodEarth Post-Sales Team to verify the submitted particulars and store verification copies securely in Zoho WorkDrive for unit allocation and agreement processing.
            </span>
          </label>
        </div>
      </div>

      {/* Audit Timeline */}
      <KycTimelineList events={timeline?.events || []} />

      <div className="flex flex-col items-end gap-2">
        <KycNavigation
          onBack={() => navigate('/client/kyc/documents')}
          onNext={() => setIsConfirmModalOpen(true)}
          canNext={canProceedToSubmit}
          isSubmitting={submitting}
          nextLabel="Submit Final KYC Application"
        />
        {!canProceedToSubmit && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {!isValidationPassing
              ? '⚠️ Submission disabled: Resolve all missing fields and uploads listed in the checklist.'
              : '⚠️ Submission disabled: Please accept both declaration and consent checkboxes above.'}
          </p>
        )}
      </div>

      <KycSubmitConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        isSubmitting={submitting}
        applicantCount={1 + (kycData?.jointApplicants?.length || 0)}
        uploadedDocCount={uploadedRequiredSlots.length}
        missingDocCount={missingSlots.length}
      />
    </div>
  );
};

export default KycReviewPage;
