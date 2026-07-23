import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KycStepper from '../components/KycStepper';
import KycNavigation from '../components/KycNavigation';
import KycLoadingSkeleton from '../components/KycLoadingSkeleton';
import KycDocumentSlotCard from '../components/documents/KycDocumentSlotCard';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto, KycProgressResponseDto } from '../types/kyc';

export const KycDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [kycData, setKycData] = useState<KycApplicationResponseDto | null>(null);
  const [progress, setProgress] = useState<KycProgressResponseDto | null>(null);

  const bookingId = 'BKG-2026-101';

  const loadData = async () => {
    try {
      const data = await kycService.getKycByBooking(bookingId);
      setKycData(data);
      const prog = await kycService.getKycProgress(bookingId).catch(() => null);
      if (prog) setProgress(prog);
    } catch (err) {
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

  const documentSlots = kycData?.documentSlots || [];
  const canEdit = kycData?.status === 'DRAFT' || kycData?.status === 'ACTION_REQUIRED';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Step 3: Mandatory Document Uploads</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload clear scanned copies or photos of your required verification documents.
        </p>
      </div>

      <KycStepper currentStepId="documents" status={kycData?.status} />

      {/* Upload Progress Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Required Slots</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {progress?.requiredSlotsCount ?? documentSlots.filter(s => s.isRequired).length}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Uploaded</span>
          <p className="text-lg font-bold text-brand-600 mt-0.5">
            {progress?.uploadedSlotsCount ?? documentSlots.filter(s => s.currentVersion).length}
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

      {/* Document Slots List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verification Slots</h3>

        {documentSlots.length > 0 ? (
          documentSlots.map((slot) => (
            <KycDocumentSlotCard
              key={slot.documentId}
              slot={slot}
              kycApplicationId={kycData?.kycApplicationId || ''}
              onRefresh={loadData}
              canEdit={canEdit}
            />
          ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border rounded-2xl">
            <p className="text-sm text-slate-500">No document slots provisioned yet.</p>
          </div>
        )}
      </div>

      <KycNavigation
        onBack={() => navigate('/client/kyc/applicants')}
        onNext={() => navigate('/client/kyc/review')}
        nextLabel="Proceed to Final Review"
      />
    </div>
  );
};

export default KycDocumentsPage;
