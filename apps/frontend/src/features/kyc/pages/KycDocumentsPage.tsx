import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import KycStepper from '../components/KycStepper';
import KycNavigation from '../components/KycNavigation';
import KycLoadingSkeleton from '../components/KycLoadingSkeleton';
import KycDocumentSlotCard from '../components/documents/KycDocumentSlotCard';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto, KycProgressResponseDto } from '../types/kyc';
import { useUnitStore } from '../../../store/unitStore';

export const KycDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeUnit } = useUnitStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [kycData, setKycData] = useState<KycApplicationResponseDto | null>(null);
  const [progress, setProgress] = useState<KycProgressResponseDto | null>(null);

  const bookingId = searchParams.get('bookingId') || activeUnit?.unitName || activeUnit?.workflowId || activeUnit?.id || 'BKG-2026-101';

  const loadData = async () => {
    try {
      const data = await kycService.getKycByBooking(bookingId);
      setKycData(data);
      const prog = await kycService.getKycProgress(bookingId).catch(() => null);
      if (prog) setProgress(prog);
    } catch {
      // Handled in UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <KycLoadingSkeleton />
      </div>
    );
  }

  const allDocumentSlots = kycData?.documentSlots || [];
  const canEdit = kycData?.status === 'DRAFT' || kycData?.status === 'ACTION_REQUIRED';

  // Filter out PAN_CARD and AADHAAR_CARD slots since they are uploaded in the Identity Verification section
  const documentSlots = allDocumentSlots.filter(
    (s) => s.documentType !== 'PAN_CARD' && s.documentType !== 'AADHAAR_CARD'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Step 3: Mandatory Document Uploads</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload clear scanned copies or photos of your address proof and optional identification documents. Note: PAN and Aadhaar cards are uploaded directly under Applicant Details.
        </p>
      </div>

      <KycStepper currentStepId="documents" status={kycData?.status} />

      {/* Upload Progress Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Slots</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {progress?.requiredSlotsCount ?? allDocumentSlots.filter((s) => s.isRequired).length}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Uploaded</span>
          <p className="text-lg font-bold text-brand-600 mt-0.5">
            {progress?.uploadedSlotsCount ?? allDocumentSlots.filter((s) => s.currentVersion).length}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Approved</span>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">
            {progress?.approvedSlotsCount ?? 0}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Action Required</span>
          <p className="text-lg font-bold text-rose-600 mt-0.5">
            {progress?.rejectedSlotsCount ?? 0}
          </p>
        </div>
      </div>

      {/* Primary Applicant Document Slots (Address Proof, Voter ID) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Primary Applicant Documents</h3>
        {documentSlots.filter((s) => s.applicantType === 'PRIMARY').length > 0 ? (
          documentSlots
            .filter((s) => s.applicantType === 'PRIMARY')
            .map((slot) => (
              <KycDocumentSlotCard
                key={slot.documentId}
                slot={slot}
                kycApplicationId={kycData?.kycApplicationId || ''}
                onRefresh={loadData}
                canEdit={canEdit}
              />
            ))
        ) : (
          <div className="p-6 text-center bg-white dark:bg-slate-900 border rounded-2xl">
            <p className="text-sm text-slate-500">No additional primary document slots provisioned.</p>
          </div>
        )}
      </div>

      {/* Co-Applicant Document Slots (Conditional) */}
      {kycData?.hasCoApplicant === 'Yes' && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Co-Applicant Documents</h3>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
              Co-Applicant Active
            </span>
          </div>

          {documentSlots.filter((s) => s.applicantType === 'JOINT_1').length > 0 ? (
            documentSlots
              .filter((s) => s.applicantType === 'JOINT_1')
              .map((slot) => (
                <KycDocumentSlotCard
                  key={slot.documentId}
                  slot={slot}
                  kycApplicationId={kycData?.kycApplicationId || ''}
                  onRefresh={loadData}
                  canEdit={canEdit}
                />
              ))
          ) : (
            <div className="p-6 text-center bg-white dark:bg-slate-900 border rounded-2xl">
              <p className="text-sm text-slate-500">No additional co-applicant document slots provisioned.</p>
            </div>
          )}
        </div>
      )}

      {/* Third Applicant Document Slots (Conditional) */}
      {kycData?.hasCoApplicant === 'Yes' && kycData?.hasThirdApplicant === 'Yes' && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Third Applicant Documents</h3>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
              Third Applicant Active
            </span>
          </div>

          {documentSlots.filter((s) => s.applicantType === 'JOINT_2').length > 0 ? (
            documentSlots
              .filter((s) => s.applicantType === 'JOINT_2')
              .map((slot) => (
                <KycDocumentSlotCard
                  key={slot.documentId}
                  slot={slot}
                  kycApplicationId={kycData?.kycApplicationId || ''}
                  onRefresh={loadData}
                  canEdit={canEdit}
                />
              ))
          ) : (
            <div className="p-6 text-center bg-white dark:bg-slate-900 border rounded-2xl">
              <p className="text-sm text-slate-500">No additional third applicant document slots provisioned.</p>
            </div>
          )}
        </div>
      )}

      <KycNavigation
        onBack={() => navigate('/client/kyc/applicants')}
        onNext={() => navigate('/client/kyc/review')}
        nextLabel="Proceed to Final Review"
      />
    </div>
  );
};

export default KycDocumentsPage;
