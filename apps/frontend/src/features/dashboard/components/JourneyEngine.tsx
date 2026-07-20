import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  FileText,
  Layers,
  Zap,
  Grid,
  Hammer,
  Key,
  Award,
  Sparkles,
  Lock,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export interface StageInfo {
  id: number;
  title: string;
  icon: any;
  route: string;
  defaultDueDate: string;
  defaultCompletion: number;
}

const STAGES_CONFIG: StageInfo[] = [
  { id: 1, title: 'Booking Verification', icon: ClipboardCheck, route: '/my-home', defaultDueDate: '15 May 2026', defaultCompletion: 100 },
  { id: 2, title: 'Agreement Signing', icon: FileText, route: '/my-home', defaultDueDate: '30 May 2026', defaultCompletion: 100 },
  { id: 3, title: 'Design Layout Selection', icon: Layers, route: '/design-studio', defaultDueDate: '15 Jun 2026', defaultCompletion: 70 },
  { id: 4, title: 'Electrical & Plumbing Layout', icon: Zap, route: '/selections', defaultDueDate: '30 Jun 2026', defaultCompletion: 0 },
  { id: 5, title: 'Flooring & Finishes Selection', icon: Grid, route: '/selections', defaultDueDate: '10 Jul 2026', defaultCompletion: 0 },
  { id: 6, title: 'Construction & Civil Phase', icon: Hammer, route: '/construction-updates', defaultDueDate: '30 Aug 2026', defaultCompletion: 0 },
  { id: 7, title: 'Handover Walkthrough', icon: Key, route: '/my-home', defaultDueDate: '15 Oct 2026', defaultCompletion: 0 },
  { id: 8, title: 'Registration & Legals', icon: Award, route: '/my-home', defaultDueDate: '30 Oct 2026', defaultCompletion: 0 },
  { id: 9, title: 'Interior Services Execution', icon: Sparkles, route: '/selections', defaultDueDate: '30 Nov 2026', defaultCompletion: 0 },
];

export const JourneyEngine: React.FC = () => {
  const navigate = useNavigate();

  // Load from local storage or default to stage 3
  const [activeStageId] = useState<number>(() => {
    const saved = localStorage.getItem('agy_journey_active_stage');
    return saved ? Number(saved) : 3;
  });

  const [activeStageState, setActiveStageState] = useState<'AVAILABLE' | 'IN_PROGRESS' | 'UNDER_REVIEW'>(() => {
    const saved = localStorage.getItem('agy_journey_active_state');
    return (saved as any) || 'IN_PROGRESS';
  });

  // Track simulated payment outstanding status to trigger invoice notifications
  const [hasOutstandingInvoice] = useState(true);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('agy_journey_active_stage', String(activeStageId));
    localStorage.setItem('agy_journey_active_state', activeStageState);
  }, [activeStageId, activeStageState]);

  // Compute status for all stages
  const getStageStatus = (stageId: number) => {
    if (stageId < activeStageId) return 'COMPLETED';
    if (stageId > activeStageId) return 'LOCKED';
    return activeStageState; // AVAILABLE, IN_PROGRESS, or UNDER_REVIEW
  };

  const getCompletionPercent = (stageId: number) => {
    if (stageId < activeStageId) return 100;
    if (stageId > activeStageId) return 0;
    if (activeStageState === 'UNDER_REVIEW') return 90;
    if (activeStageState === 'IN_PROGRESS') return 45;
    return 10;
  };

  const handleStartStage = (stage: StageInfo) => {
    setActiveStageState('IN_PROGRESS');
    navigate(stage.route);
  };

  // Get active stage details
  const currentStage = STAGES_CONFIG.find((s) => s.id === activeStageId) || STAGES_CONFIG[2];

  // Contextual Hero "Next Action" computed dynamically
  const getNextActionText = () => {
    if (hasOutstandingInvoice) {
      return {
        action: 'Pay Outstanding Draw Invoice',
        subtext: 'Your current phase draw billing is overdue. Please authorize milestone draw payment.',
        cta: 'Authorize Payment',
        handler: () => navigate('/finance'),
      };
    }

    if (activeStageState === 'AVAILABLE') {
      return {
        action: `Initiate ${currentStage.title}`,
        subtext: `The GoodEarth care team unlocked the ${currentStage.title} customization phase.`,
        cta: 'Start Phase Now',
        handler: () => handleStartStage(currentStage),
      };
    }

    if (activeStageState === 'IN_PROGRESS') {
      switch (activeStageId) {
        case 3:
          return {
            action: 'Configure Master Plan Upgrades',
            subtext: 'Drop upgrade selection pins on your interactive floor plan drawing canvas.',
            cta: 'Open Design Studio',
            handler: () => navigate('/design-studio'),
          };
        case 4:
          return {
            action: 'Configure Electrical & Plumbing Options',
            subtext: 'Select modular automation layouts and sanitary fixtures.',
            cta: 'Choose Electrical',
            handler: () => navigate('/selections'),
          };
        case 5:
          return {
            action: 'Submit Flooring Finishes Preferences',
            subtext: 'Finalize bedroom engineered oak and Italian marble options.',
            cta: 'Select Flooring',
            handler: () => navigate('/selections'),
          };
        default:
          return {
            action: `Complete ${currentStage.title} tasks`,
            subtext: 'Submit outstanding customization items for site validation.',
            cta: 'Complete Phase Tasks',
            handler: () => navigate(currentStage.route),
          };
      }
    }

    return {
      action: 'Awaiting Civil Validation',
      subtext: `Your submissions for ${currentStage.title} are currently being audited by site engineers.`,
      cta: 'View Phase Submission',
      handler: () => navigate(currentStage.route),
    };
  };

  const nextAction = getNextActionText();

  // Contextual notification array generated dynamically based on active status
  const getNotificationsList = () => {
    const alerts = [];
    
    if (activeStageState === 'AVAILABLE') {
      alerts.push({
        id: 'notif-1',
        title: 'Phase Unlocked',
        message: `${currentStage.title} phase is now open for inputs.`,
        type: 'info',
      });
    }
    if (activeStageState === 'UNDER_REVIEW') {
      alerts.push({
        id: 'notif-2',
        title: 'Submission Received',
        message: `Your configurations for ${currentStage.title} were received successfully.`,
        type: 'neutral',
      });
    }
    if (activeStageId > 3) {
      alerts.push({
        id: 'notif-3',
        title: 'Submission Approved',
        message: `Design layout upgrades approved by com.goodearth.postsales.`,
        type: 'success',
      });
    }
    if (hasOutstandingInvoice) {
      alerts.push({
        id: 'notif-4',
        title: 'Payment Required',
        message: `Overdue invoice draw pending for structural work.`,
        type: 'warning',
      });
    } else {
      alerts.push({
        id: 'notif-5',
        title: 'Payment Successful',
        message: `Transaction cleared for previous milestone draw.`,
        type: 'success',
      });
    }
    alerts.push({
      id: 'notif-6',
      title: 'Construction Updated',
      message: `New site log updates uploaded for plot superstructure progress.`,
      type: 'info',
    });

    return alerts;
  };

  const notifications = getNotificationsList();

  return (
    <div className="space-y-8">

      {/* Dynamic Contextual Notifications Stream */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {notifications.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs ${
                item.type === 'success'
                  ? 'bg-green-50/20 border-green-200 dark:border-green-900/30'
                  : item.type === 'warning'
                    ? 'bg-yellow-50/20 border-yellow-250 dark:border-yellow-900/30'
                    : 'bg-brand-50/30 border-brand-150 dark:border-brand-800/40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.type === 'warning' ? (
                  <AlertTriangle className="h-4.5 w-4.5 text-yellow-600" />
                ) : item.type === 'success' ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />
                ) : (
                  <Clock className="h-4.5 w-4.5 text-brand-450" />
                )}
              </div>
              <div>
                <h5 className="font-bold text-brand-850 dark:text-white uppercase tracking-wider text-[9px] mb-0.5">{item.title}</h5>
                <p className="text-brand-600 dark:text-brand-300 text-[10px] leading-relaxed">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* YOUR NEXT ACTION Hero Widget */}
      <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-sm dark:border-brand-850 dark:bg-brand-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
        <div className="space-y-1.5">
          <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-accent-700 bg-accent-600/10 px-2 py-0.5 rounded">
            YOUR NEXT ACTION
          </span>
          <h3 className="text-lg font-bold text-brand-900 dark:text-white mt-1">
            {nextAction.action}
          </h3>
          <p className="text-xs text-brand-500 font-medium">
            {nextAction.subtext}
          </p>
        </div>
        <button
          onClick={nextAction.handler}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-5 py-3 text-xs font-semibold shadow-sm transition-all hover:scale-102 shrink-0"
        >
          {nextAction.cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* YOUR HOME JOURNEY Timeline Section */}
      <Card title="YOUR HOME JOURNEY" subtitle="Complete post-sales timeline progression from booking validation to interiors">
        <div className="relative pl-6 ml-2 border-l border-brand-200 dark:border-brand-800 space-y-6 py-2 text-left">
          {STAGES_CONFIG.map((stage) => {
            const status = getStageStatus(stage.id);
            const percent = getCompletionPercent(stage.id);
            const IconComp = stage.icon;

            return (
              <div key={stage.id} className="relative pl-6 group">
                {/* Timeline connector dot */}
                <div className={`absolute left-[-31px] top-1.5 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  status === 'COMPLETED'
                    ? 'bg-brand-700 border-brand-700 text-white'
                    : status === 'UNDER_REVIEW'
                      ? 'bg-yellow-500 border-yellow-500 text-white'
                      : status === 'IN_PROGRESS' || status === 'AVAILABLE'
                        ? 'bg-white border-brand-700 dark:bg-brand-900'
                        : 'bg-brand-100 border-brand-200 dark:bg-brand-800 dark:border-brand-850'
                }`}>
                  {status === 'COMPLETED' ? (
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  ) : status === 'LOCKED' ? (
                    <Lock className="h-2 w-2 text-brand-400" />
                  ) : (
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      status === 'UNDER_REVIEW' ? 'bg-white animate-pulse' : 'bg-brand-700 animate-ping'
                    }`} />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-100/50 dark:border-brand-850/40 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      status === 'COMPLETED'
                        ? 'bg-brand-100/70 text-brand-800 dark:bg-brand-800'
                        : status === 'LOCKED'
                          ? 'bg-brand-50 text-brand-350 dark:bg-brand-950/20'
                          : 'bg-accent-600/10 text-accent-700'
                    }`}>
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-semibold flex items-center gap-2 ${
                        status === 'LOCKED' ? 'text-brand-400' : 'text-brand-900 dark:text-white'
                      }`}>
                        <span>Phase 0{stage.id}: {stage.title}</span>
                        <StatusBadge
                          label={status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : status}
                          type={
                            status === 'COMPLETED'
                              ? 'success'
                              : status === 'UNDER_REVIEW'
                                ? 'warning'
                                : status === 'IN_PROGRESS' || status === 'AVAILABLE'
                                  ? 'info'
                                  : 'neutral'
                          }
                        />
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-brand-450 mt-1 font-medium">
                        <span>Due: {stage.defaultDueDate}</span>
                        <span>•</span>
                        <span>Progress: {percent}% completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {status === 'LOCKED' ? (
                      <button
                        disabled
                        className="rounded-lg bg-brand-50 border border-brand-200 text-brand-300 text-[10px] py-1.5 px-3 font-semibold cursor-not-allowed dark:bg-brand-900 dark:border-brand-800"
                      >
                        Locked
                      </button>
                    ) : status === 'AVAILABLE' ? (
                      <button
                        onClick={() => handleStartStage(stage)}
                        className="rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[10px] py-1.5 px-3 font-semibold transition-colors flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Start Phase
                      </button>
                    ) : status === 'IN_PROGRESS' ? (
                      <button
                        onClick={() => navigate(stage.route)}
                        className="rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[10px] py-1.5 px-3 font-semibold transition-colors"
                      >
                        Configure Selections
                      </button>
                    ) : status === 'UNDER_REVIEW' ? (
                      <button
                        onClick={() => navigate(stage.route)}
                        className="rounded-lg bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-white text-[10px] py-1.5 px-3 font-semibold transition-colors"
                      >
                        View Submission
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(stage.route)}
                        className="rounded-lg bg-brand-50 border border-brand-250 text-brand-700 text-[10px] py-1.5 px-3 font-semibold transition-colors dark:bg-brand-950/20 dark:text-brand-300"
                      >
                        View Summary
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// Check icon helper
const Check: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default JourneyEngine;
