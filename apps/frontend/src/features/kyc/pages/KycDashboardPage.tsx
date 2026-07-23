import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import KycDashboard from '../components/KycDashboard';
import KycStepper from '../components/KycStepper';
import KycErrorState from '../components/KycErrorState';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto, KycTimelineResponseDto } from '../types/kyc';
import { useUnitStore } from '../../../store/unitStore';

export const KycDashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { activeUnit } = useUnitStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [kycData, setKycData] = useState<KycApplicationResponseDto | null>(null);
  const [timeline, setTimeline] = useState<KycTimelineResponseDto | null>(null);

  const bookingId = searchParams.get('bookingId') || activeUnit?.unitName || activeUnit?.workflowId || activeUnit?.id || 'BKG-2026-101';

  const fetchKycData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await kycService.getKycByBooking(bookingId);
      setKycData(data);
      const timelineData = await kycService.getKycTimeline(bookingId).catch(() => null);
      if (timelineData) setTimeline(timelineData);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to KYC backend service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KYC & Document Portal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete your Know Your Customer verification to finalize your home allocation.
          </p>
        </div>
      </div>

      <KycStepper currentStepId="property" status={kycData?.status} />

      {error ? (
        <KycErrorState
          title="KYC Service Connection Error"
          message={error}
          onRetry={fetchKycData}
        />
      ) : (
        <>
          <KycDashboard kycData={kycData} loading={loading} />

          {/* Timeline Activity History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Verification Activity History</h3>
            {timeline?.events && timeline.events.length > 0 ? (
              <ul className="space-y-4">
                {timeline.events.map((event) => (
                  <li key={event.eventId} className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 font-bold text-xs">
                      {event.actorRole.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{event.summary}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(event.timestamp).toLocaleString()} • {event.actorRole} ({event.actorId})
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No activity recorded yet for this booking.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default KycDashboardPage;
