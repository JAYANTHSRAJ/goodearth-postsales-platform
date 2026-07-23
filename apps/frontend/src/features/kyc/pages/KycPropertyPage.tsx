import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import KycStepper from '../components/KycStepper';
import KycNavigation from '../components/KycNavigation';
import KycLoadingSkeleton from '../components/KycLoadingSkeleton';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto } from '../types/kyc';
import { useUnitStore } from '../../../store/unitStore';

export const KycPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeUnit } = useUnitStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [kycData, setKycData] = useState<KycApplicationResponseDto | null>(null);

  const bookingId = searchParams.get('bookingId') || activeUnit?.unitName || activeUnit?.workflowId || activeUnit?.id || 'BKG-2026-101';

  useEffect(() => {
    kycService.getKycByBooking(bookingId)
      .then(setKycData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <KycLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Step 1: Property & Booking Verification</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Verify your allocated unit details before proceeding to applicant details.
        </p>
      </div>

      <KycStepper currentStepId="property" status={kycData?.status} />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Allocated Unit Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase">Booking Reference</span>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-1">{bookingId}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase">Project Name</span>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-1">GoodEarth Malhar - Patterns</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase">Allocated Villa / Unit</span>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-1">Villa #42 (3 BHK Type A)</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase">Verification Status</span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {kycData?.status || 'DRAFT'}
            </p>
          </div>
        </div>
      </div>

      <KycNavigation
        onNext={() => navigate('/client/kyc/applicants')}
        nextLabel="Proceed to Applicants"
      />
    </div>
  );
};

export default KycPropertyPage;
