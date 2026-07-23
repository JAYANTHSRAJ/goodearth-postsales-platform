import React from 'react';
import { KycTimelineEventDto } from '../../types/kyc';

interface KycTimelineListProps {
  events: KycTimelineEventDto[];
}

export const KycTimelineList: React.FC<KycTimelineListProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-sm text-slate-500 italic">No timeline events recorded yet.</p>
      </div>
    );
  }

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'KYC_APPROVED':
        return { icon: '✓', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' };
      case 'DOCUMENT_REJECTED':
      case 'CHANGES_REQUESTED':
        return { icon: '!', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' };
      case 'KYC_SUBMITTED':
      case 'REVIEW_STARTED':
        return { icon: '★', color: 'bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300' };
      default:
        return { icon: '•', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
        Audit Activity Timeline
      </h3>

      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 py-2">
        {events.map((evt) => {
          const badge = getEventBadge(evt.eventType);
          return (
            <div key={evt.eventId} className="relative pl-6 group">
              <div
                className={`absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs shadow-sm ${badge.color}`}
              >
                {badge.icon}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{evt.summary}</p>
                  <span className="text-xs font-semibold text-slate-400">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Actor: <span className="font-semibold">{evt.actorId}</span> ({evt.actorRole}) • Event: {evt.eventType}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KycTimelineList;
