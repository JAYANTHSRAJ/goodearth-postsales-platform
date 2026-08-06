import React from 'react';
import {
  Building2,
  Compass,
  Maximize2,
  Grid3x3,
  Layers,
  Bed,
  Bath,
  Car,
  FileCheck,
  FileSpreadsheet,
  FolderGit2,
  Hammer,
  Users,
  CreditCard,
  HelpCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ClientHomeDetails } from '../../../../services/client.service';
import { Card } from '../../../../components/ui/Card';

interface UnitDetailsTabProps {
  details?: ClientHomeDetails | null;
  isLoading?: boolean;
  onNavigateTab?: (tabId: string) => void;
}

export const UnitDetailsTab: React.FC<UnitDetailsTabProps> = ({ details, isLoading, onNavigateTab }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-brand-100/50 dark:bg-brand-900/40 animate-pulse border border-brand-200/50 dark:border-brand-850"
          />
        ))}
      </div>
    );
  }

  const specCards = [
    {
      title: 'Unit Type',
      value: details?.unitType || '4 BHK Eco-Luxury Villa',
      subtitle: 'Luxury Architecture',
      icon: Building2,
      badge: 'Eco Residence',
    },
    {
      title: 'Bedrooms',
      value: details?.bedrooms || '4 Bedrooms + Maid Suite',
      subtitle: 'Spacious Accommodation',
      icon: Bed,
      badge: 'Spacious Suite',
    },
    {
      title: 'Bathrooms',
      value: details?.bathrooms || '4 Ensuite + Powder Room',
      subtitle: 'Premium Sanitaryware',
      icon: Bath,
      badge: 'Ensuite',
    },
    {
      title: 'Floor Elevation',
      value: details?.floor || 'Ground + 2 Upper Floors',
      subtitle: 'Multi-level Layout',
      icon: Layers,
      badge: 'Triplex Layout',
    },
    {
      title: 'Property Orientation',
      value: details?.facing || 'East Facing (Vastu Compliant)',
      subtitle: 'Optimal Light & Ventilation',
      icon: Compass,
      badge: 'Vastu Compliant',
    },
    {
      title: 'Super Built-up Area',
      value: details?.area || '3,850 Sq. Ft.',
      subtitle: 'Total Constructed Area',
      icon: Maximize2,
      badge: 'Built-up',
    },
    {
      title: 'Carpet Area',
      value: details?.carpetArea || '3,120 Sq. Ft.',
      subtitle: 'Usable Internal Space',
      icon: Grid3x3,
      badge: 'Net Area',
    },
    {
      title: 'Parking Allocation',
      value: details?.parking || '2 Covered EV-Ready Bays',
      subtitle: 'Dedicated Parking',
      icon: Car,
      badge: 'EV Ready',
    },
    {
      title: 'Registration Status',
      value: details?.registrationStatus || 'Registered / Agreement Executed',
      subtitle: 'Zoho CRM Deed Status',
      icon: FileCheck,
      badge: 'Legal Verified',
      isGreenBadge: true,
    },
  ];

  const quickCards = [
    {
      id: 'floor-plans',
      title: 'Floor Plans',
      desc: 'View & download CRM architectural drawings',
      icon: FileSpreadsheet,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      id: 'documents',
      title: 'Documents',
      desc: 'Legal deeds, contracts & agreement vault',
      icon: FolderGit2,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      id: 'project-updates',
      title: 'Construction Progress',
      desc: 'Live site photo timeline & CRM milestones',
      icon: Hammer,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      id: 'family-access',
      title: 'Family Access',
      desc: 'Manage household member permissions',
      icon: Users,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'finance',
      title: 'Payments & Invoices',
      desc: 'Financial ledger & payment receipts',
      icon: CreditCard,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    },
    {
      id: 'support',
      title: 'Homeowner Support',
      desc: 'Helpdesk ticket desk & CRM helpline',
      icon: HelpCircle,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
  ];

  const recentActivities = [
    {
      title: 'CRM Deal Attachments Updated',
      time: 'Today at 10:30 AM',
      desc: 'Latest structural revision drawing PDF synchronized from Zoho CRM Deals.',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Stage Milestone Achieved',
      time: 'Yesterday at 04:15 PM',
      desc: 'Superstructure slab casting completed. Certified by CRM Site Engineer.',
      icon: Hammer,
      iconColor: 'text-amber-500',
    },
    {
      title: 'Family Access Permission Granted',
      time: 'Aug 04, 2026',
      desc: 'Co-applicant household permission validated by Primary Homeowner.',
      icon: ShieldCheck,
      iconColor: 'text-blue-500',
    },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* 1. Property Specifications Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-500" />
            Property Specifications & Details
          </h3>
          <span className="text-xs font-semibold text-brand-400">Zoho CRM Synchronized</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {specCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Card key={idx} className="hover:border-amber-500/40 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        card.isGreenBadge
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {card.badge}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-brand-100/70 dark:bg-brand-850 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-brand-400 uppercase tracking-wider">{card.title}</div>
                    <div className="text-base sm:text-lg font-bold text-brand-900 dark:text-white font-serif mt-0.5">
                      {card.value}
                    </div>
                    <div className="text-[11px] font-medium text-brand-500 dark:text-brand-400 mt-1">{card.subtitle}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 2. Quick Action Hub */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            Homeowner Quick Actions Hub
          </h3>
          <span className="text-xs font-semibold text-brand-400">Direct Navigation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickCards.map((qc) => {
            const Icon = qc.icon;
            return (
              <button
                key={qc.id}
                onClick={() => onNavigateTab && onNavigateTab(qc.id)}
                className="group p-5 rounded-2xl bg-white dark:bg-brand-900 border border-brand-200/80 dark:border-brand-800 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all duration-200 text-left flex items-start justify-between"
              >
                <div className="space-y-2">
                  <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center ${qc.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-bold text-brand-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {qc.title}
                    </h4>
                    <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">{qc.desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-brand-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all mt-1" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Recent Activity & Timeline */}
      <Card>
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-100 dark:border-brand-850 pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Recent CRM Activity & Updates
              </h3>
              <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
                Real-time activity log for your residence from Zoho CRM.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
              Live Stream
            </span>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-brand-200/60 dark:before:bg-brand-800">
            {recentActivities.map((act, idx) => {
              const Icon = act.icon;
              return (
                <div key={idx} className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 top-0.5 -translate-x-1/2 h-5 w-5 rounded-full bg-white dark:bg-brand-900 border-2 border-amber-500 flex items-center justify-center">
                    <Icon className={`h-3 w-3 ${act.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-brand-900 dark:text-white font-serif">{act.title}</h4>
                      <span className="text-[11px] font-semibold text-brand-400">{act.time}</span>
                    </div>
                    <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5 leading-relaxed">{act.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};
