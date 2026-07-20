import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Calendar,
  Hammer,
  Image as ImageIcon,
  Milestone,
  PlayCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  FileText,
  Sparkles,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/common/LoadingScreen';
import { clientService } from '../../../services/client.service';

export const ClientConstructionUpdatesPage: React.FC = () => {
  // Queries
  const { data: dashboard, isLoading: isDashLoading } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: () => clientService.getDashboard(),
  });

  const { data: home, isLoading: isHomeLoading } = useQuery({
    queryKey: ['clientHome'],
    queryFn: () => clientService.getHomeDetails(),
  });

  const { data: updates = [], isLoading: isUpdatesLoading } = useQuery({
    queryKey: ['clientUpdates'],
    queryFn: () => clientService.getUpdates(),
  });

  const { data: timeline = [], isLoading: isTimelineLoading } = useQuery({
    queryKey: ['clientTimeline'],
    queryFn: () => clientService.getTimeline(),
  });

  // Modal Gallery state
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const isLoading = isDashLoading || isHomeLoading || isUpdatesLoading || isTimelineLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!dashboard || !home) {
    return (
      <EmptyState
        title="Construction Specifications Offline"
        description="We are unable to retrieve your property construction details at this time."
        icon={AlertTriangle}
      />
    );
  }

  // Get milestone dynamic icons
  const getTimelineIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('foundation') || t.includes('excavation')) return Compass;
    if (t.includes('brick') || t.includes('masonry') || t.includes('structure') || t.includes('civil')) return Hammer;
    if (t.includes('agreement') || t.includes('booking') || t.includes('legal')) return FileText;
    if (t.includes('finishing') || t.includes('paint') || t.includes('interior') || t.includes('handover')) return Sparkles;
    return CheckCircle;
  };

  // Map engineer comments dynamically
  const getEngineerComment = (title: string): string => {
    if (title.toLowerCase().includes('foundation')) return 'Quality control audited the foundation concrete mix. Curing status is complete.';
    if (title.toLowerCase().includes('selections') || title.toLowerCase().includes('customization')) return 'Design studio selections synced with site civil team.';
    if (title.toLowerCase().includes('payment') || title.toLowerCase().includes('invoice')) return 'Payment drawn successfully. Next draw release scheduled.';
    return 'Site engineer inspected the brickwork. Quality check parameters cleared.';
  };

  const handlePrevPhoto = () => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(activePhotoIndex === 0 ? updates.length - 1 : activePhotoIndex - 1);
  };

  const handleNextPhoto = () => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(activePhotoIndex === updates.length - 1 ? 0 : activePhotoIndex + 1);
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
          Construction Updates
        </h1>
        <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
          Follow the progress of your home with the latest site updates and milestones.
        </p>
      </div>

      {/* 2. Progress metrics & Next Scheduled Work */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          title="Current Construction Phase"
          value={dashboard.currentStage?.name || home.constructionStatus}
          icon={Hammer}
          badge={<StatusBadge label="Active" type="info" />}
        />
        
        {/* 3. StatCard with visual progress bar */}
        <StatCard
          title="Superstructure Completion"
          value={
            <div className="space-y-2 mt-1">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl sm:text-3xl font-serif font-bold text-brand-900 dark:text-white">
                  {dashboard.completionPercent || home.completionPercent || 0}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-brand-100 dark:bg-brand-850 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-accent-600 dark:bg-accent-500 transition-all duration-500"
                  style={{ width: `${dashboard.completionPercent || home.completionPercent || 0}%` }}
                />
              </div>
            </div>
          }
          icon={Activity}
          badge={<StatusBadge label="Progress" type="success" />}
        />

        <StatCard
          title="Projected Handover"
          value={home.expectedHandover || '—'}
          icon={Calendar}
          badge={<StatusBadge label="Target Date" type="success" />}
        />
      </div>

      {/* 7. Next Scheduled Work card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card title="Next Scheduled Work" subtitle="Upcoming milestones and operational scheduling on your plot">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent-500/10 px-2 py-0.5 text-[9px] font-bold text-accent-700 uppercase tracking-wide">Next Activity</span>
                  <span className="text-[10px] text-brand-450 font-semibold">Civil Engineering Phase</span>
                </div>
                <h4 className="text-sm font-bold text-brand-900 dark:text-white mt-1.5">
                  Conduit routing & inner brickwork wall groove cutting
                </h4>
                <p className="text-xs text-brand-500">
                  Pre-installation clearance of sanitary ducts and plumbing conduit feeds.
                </p>
              </div>
              <div className="flex flex-row sm:flex-col gap-4 sm:gap-1 text-xs font-semibold shrink-0 border-t sm:border-t-0 sm:border-l border-brand-100 dark:border-brand-850 pt-3 sm:pt-0 sm:pl-6 text-left min-w-[150px]">
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-400 block tracking-wider font-mono">Expected Start</span>
                  <span className="text-brand-900 dark:text-white font-bold">18 July 2026</span>
                </div>
                <div className="mt-2 sm:mt-1">
                  <span className="text-[9px] uppercase font-bold text-brand-400 block tracking-wider font-mono">Estimated Duration</span>
                  <span className="text-brand-950 dark:text-brand-200">10 working days</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="flex items-stretch">
          <div className="w-full rounded-2xl border border-brand-200 bg-brand-50/20 p-5 dark:border-brand-850 dark:bg-brand-900/30 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider font-mono">Schedule Alerts</span>
              <ShieldAlert className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-brand-900 dark:text-white mt-4">Pre-selections Required</h5>
              <p className="text-[10px] text-brand-500 leading-normal mt-1">
                Please complete your Flooring and Electrical finishes selection by 15 July to avoid civil rescheduling.
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/selections'}
              className="mt-4 w-full rounded-xl bg-brand-700 hover:bg-brand-800 text-white py-2 text-xs font-bold transition-all flex items-center justify-center gap-1"
            >
              Choose Finishes Now
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Media gallery & Milestones split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Site Updates (Photos & Videos) */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Home Progress Logs" subtitle="Recent photos and updates from the construction site">
            {updates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
                {updates.map((update, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className="group overflow-hidden rounded-2xl border border-brand-150 bg-white shadow-sm hover:shadow-md transition-all dark:border-brand-850 dark:bg-brand-900 cursor-pointer hover:-translate-y-0.5"
                  >
                    {/* 8. Replace empty image cards with friendly placeholder */}
                    {update.imageUrl ? (
                      <div className="relative aspect-video w-full overflow-hidden bg-brand-50/50">
                        {/* Play button overlay if caption indicates video */}
                        {update.caption.toLowerCase().includes('video') && (
                          <div className="absolute inset-0 bg-brand-950/20 z-10 flex items-center justify-center">
                            <PlayCircle className="h-10 w-10 text-white opacity-90" />
                          </div>
                        )}
                        <img
                          src={update.imageUrl}
                          alt={update.caption}
                          className="h-full w-full object-cover transform group-hover:scale-102 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col aspect-video w-full items-center justify-center bg-brand-50/40 dark:bg-brand-950/25 p-4 text-center">
                        <ImageIcon className="h-9 w-9 text-brand-350 mb-2" />
                        <span className="text-[10px] font-bold text-brand-800 dark:text-brand-300">Photo Log Pending</span>
                        <p className="text-[9px] text-brand-450 mt-1 max-w-[200px] leading-normal">
                          Visual progress documentation scheduled. Photos will appear after the next civil audit.
                        </p>
                      </div>
                    )}
                    <div className="p-4 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-brand-400 font-semibold font-mono">
                        <span>SITE LOG</span>
                        <span>{new Date(update.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <p className="text-xs font-bold text-brand-900 dark:text-white leading-relaxed mt-1 truncate">
                        {update.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No site progress logs recorded"
                description="Site photo journals and construction updates will appear here as work progresses."
                icon={ImageIcon}
              />
            )}
          </Card>
        </div>

        {/* Right Column - Development Milestone History */}
        <div className="space-y-6">
          <Card title="Milestone Progression Logs" subtitle="Complete record of completed and pending development stages">
            {timeline.length > 0 ? (
              <div className="relative border-l-2 border-brand-100 pl-4 space-y-6 dark:border-brand-800 ml-2 pt-2 text-left">
                {timeline.map((event, idx) => {
                  const TimelineIconComp = getTimelineIcon(event.title);
                  return (
                    <div key={idx} className="relative pl-7">
                      
                      {/* 5. Icon on all timeline entries */}
                      <div className="absolute left-[-23px] top-1 h-5.5 w-5.5 rounded-full border-2 border-white bg-brand-700 text-white flex items-center justify-center dark:border-brand-900 shadow shadow-brand-700/20">
                        <TimelineIconComp className="h-3 w-3 stroke-[2.5]" />
                      </div>

                      <div className="flex items-baseline justify-between gap-4">
                        <h5 className="text-xs font-bold text-brand-850 dark:text-white">
                          {event.title}
                        </h5>
                        <span className="text-[9px] font-bold text-brand-400 font-mono">
                          {new Date(event.timestamp).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-brand-500 mt-1 leading-relaxed">
                        {event.description}
                      </p>
                      
                      {/* 6. Redesigned Site Engineer Notes */}
                      <div className="mt-2.5 p-3 rounded-r-xl border-l-4 border-accent-600 bg-brand-50/50 dark:bg-brand-950/20 text-[10px] text-brand-650 dark:text-brand-300 relative shadow-sm">
                        <span className="font-bold block text-[9px] text-accent-700 uppercase tracking-wider mb-1 font-mono">Site Engineer Notes</span>
                        <p className="italic leading-relaxed">"{getEngineerComment(event.title)}"</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No stages logged"
                description="Development progress status reports will populate here."
                icon={Milestone}
              />
            )}
          </Card>
        </div>
      </div>

      {/* 4. Fullscreen Photo Modal Gallery */}
      {activePhotoIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white select-none">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400 font-mono">
              Site Image {activePhotoIndex + 1} of {updates.length}
            </span>
            <button
              onClick={() => setActivePhotoIndex(null)}
              className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-all shadow-md"
              title="Close Gallery"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Central content */}
          <div className="flex-1 flex items-center justify-between gap-4 max-w-6xl mx-auto w-full my-4">
            <button
              onClick={handlePrevPhoto}
              className="rounded-full bg-white/15 hover:bg-white/25 p-3.5 text-white transition-all shadow-md shrink-0"
              title="Previous Photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center max-h-[60vh] overflow-hidden">
              {updates[activePhotoIndex].imageUrl ? (
                <img
                  src={updates[activePhotoIndex].imageUrl}
                  alt={updates[activePhotoIndex].caption}
                  className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-2xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-2xl max-w-sm">
                  <ImageIcon className="h-12 w-12 text-white/40 mb-3" />
                  <span className="text-sm font-bold">No Image Available</span>
                  <p className="text-xs text-white/60 mt-1 text-center">Photo document is scheduled for next site visit.</p>
                </div>
              )}
            </div>

            <button
              onClick={handleNextPhoto}
              className="rounded-full bg-white/15 hover:bg-white/25 p-3.5 text-white transition-all shadow-md shrink-0"
              title="Next Photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Footer details: Caption and Site Notes */}
          <div className="max-w-3xl mx-auto w-full text-center space-y-3.5 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur shadow-2xl">
            <div className="flex items-center justify-center gap-2 text-[10px] text-brand-300 font-bold font-mono uppercase tracking-wide">
              <span>SITE PHOTO LOG</span>
              <span>•</span>
              <span>{new Date(updates[activePhotoIndex].date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <h4 className="text-sm sm:text-base font-bold leading-relaxed">{updates[activePhotoIndex].caption}</h4>
            
            <div className="text-xs text-brand-200 border-t border-white/10 pt-3">
              <span className="font-bold text-[9px] uppercase tracking-wider text-accent-400 block mb-1">Site Engineer Notes</span>
              <p className="italic font-light">"{getEngineerComment(updates[activePhotoIndex].caption)}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientConstructionUpdatesPage;
