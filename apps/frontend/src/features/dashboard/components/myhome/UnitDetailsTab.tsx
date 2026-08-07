import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Compass,
  Maximize2,
  Grid3x3,
  Layers,
  Car,
  FileCheck,
  FileSpreadsheet,
  FolderGit2,
  Hammer,
  Users,
  CreditCard,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  IndianRupee,
  Percent,
  Sparkles,
  Receipt,
  FileText,
  FileCheck2,
} from 'lucide-react';
import { ClientHomeDetails } from '../../../../services/client.service';
import { Card } from '../../../../components/ui/Card';
import { kycService } from '../../../kyc/services/kyc.service';
import { useUnitStore } from '../../../../store/unitStore';

interface UnitDetailsTabProps {
  details?: ClientHomeDetails | null;
  isLoading?: boolean;
  onNavigateTab?: (tabId: string) => void;
}

export const UnitDetailsTab: React.FC<UnitDetailsTabProps> = ({ details, isLoading, onNavigateTab }) => {
  const { activeUnit } = useUnitStore();
  const targetBooking =
    activeUnit?.unitName ||
    activeUnit?.zohoDealName ||
    activeUnit?.workflowId ||
    activeUnit?.id ||
    'current';

  // Fetch structured Offer Letter data for unit details, pricing, and payment milestones
  const { data: offerLetter, isLoading: isOfferLetterLoading } = useQuery({
    queryKey: ['offerLetterDetails', targetBooking],
    queryFn: () => kycService.getOfferLetterDetails(targetBooking),
    enabled: !!targetBooking,
  });

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



  // Offer Letter Table 1: Unit Details & Schedule of Area
  const offerLetterTable1Fields = [
    { label: 'Unit Name', value: offerLetter?.unitName || details?.villa || details?.unitNumber || 'Not Available', icon: Building2 },
    { label: 'Carpet Area', value: offerLetter?.carpetAreaSqm ? `${offerLetter.carpetAreaSqm} Sq.m` : 'Not Available', icon: Grid3x3 },
    { label: 'Super Built-up Area', value: offerLetter?.superBuiltUpAreaSqm ? `${offerLetter.superBuiltUpAreaSqm} Sq.m` : 'Not Available', icon: Maximize2 },
    { label: 'Exclusive Common Area', value: offerLetter?.exclusiveCommonAreaSqm ? `${offerLetter.exclusiveCommonAreaSqm} Sq.m` : 'Not Available', icon: Layers },
    { label: 'Common Area allotted to Association', value: offerLetter?.associationCommonAreaSqm ? `${offerLetter.associationCommonAreaSqm} Sq.m` : 'Not Available', icon: Users },
    { label: 'UDS to Allottee', value: offerLetter?.udsAllotteeSqm ? `${offerLetter.udsAllotteeSqm} Sq.m` : 'Not Available', icon: FileCheck },
    { label: 'Total UDS', value: offerLetter?.totalUdsSqm ? `${offerLetter.totalUdsSqm} Sq.m` : 'Not Available', icon: ShieldCheck },
    { label: 'Exclusive Balcony / Verandah Area', value: offerLetter?.exclusiveBalconySqm ? `${offerLetter.exclusiveBalconySqm} Sq.m` : 'Not Available', icon: Compass },
    { label: 'Open Terrace Area', value: offerLetter?.openTerraceSqm ? `${offerLetter.openTerraceSqm} Sq.m` : 'Not Available', icon: Maximize2 },
    { label: 'Covered Car Parks', value: offerLetter?.coveredCarParks || details?.parking || 'Not Available', icon: Car },
  ];

  // Quick Action Hub Cards
  const quickCards = [
    {
      id: 'floor-plans',
      title: 'Floor Plans',
      desc: 'View & download architectural drawings',
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
      desc: 'Live site photo timeline & milestones',
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
      desc: 'Helpdesk ticket desk & support',
      icon: HelpCircle,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
  ];

  // Data-driven Status Summary (No hardcoded demo items)
  const recentActivities = [
    {
      title: 'Construction Milestone Status',
      time: details?.constructionStatus || 'In Progress',
      desc: details?.completionPercent !== undefined ? `Overall completion progress: ${details.completionPercent}%` : 'Development progressing according to project schedule.',
      icon: Hammer,
      iconColor: 'text-amber-500',
    },
    {
      title: 'Primary Registered Homeowner',
      time: details?.primaryBuyer || 'Registered Allottee',
      desc: details?.primaryBuyerEmail ? `Contact email: ${details.primaryBuyerEmail}` : 'Primary applicant details recorded.',
      icon: ShieldCheck,
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-10 text-left">
      {/* 1. ENHANCED SECTION: UNIT DETAILS (Offer Letter Table 1 Data) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-amber-500" />
              Unit Details & Schedule of Area
            </h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
              Official area metrics & undivided share of land (UDS) from Offer Letter Schedule 1.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Offer Letter Table 1
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {offerLetterTable1Fields.map((field, idx) => {
            const Icon = field.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-brand-900 border border-brand-200/80 dark:border-brand-800 shadow-sm hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider line-clamp-1">
                    {field.label}
                  </span>
                </div>
                <div className="font-serif text-base font-bold text-brand-900 dark:text-white truncate">
                  {field.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ENHANCED SECTION: PRICE DETAILS (Offer Letter Table 2 Data) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-500" />
              Price Details & Financial Summary
            </h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
              Comprehensive valuation breakdown & tax schedule from Offer Letter Table 2.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Offer Letter Table 2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Cost of Unit */}
          <Card className="border-brand-200 dark:border-brand-800">
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Cost of Unit</span>
                <IndianRupee className="h-4 w-4 text-amber-500" />
              </div>
              <div className="font-serif text-2xl font-bold text-brand-900 dark:text-white">
                {offerLetter?.costOfUnitFormatted || 'N/A'}
              </div>
              <p className="text-[11px] text-brand-500 dark:text-brand-400">Base Property Consideration</p>
            </div>
          </Card>

          {/* Card 2: GST */}
          <Card className="border-brand-200 dark:border-brand-800">
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">GST</span>
                <Percent className="h-4 w-4 text-blue-500" />
              </div>
              <div className="font-serif text-2xl font-bold text-brand-900 dark:text-white">
                {offerLetter?.gstAmountFormatted || 'N/A'}
              </div>
              <p className="text-[11px] text-brand-500 dark:text-brand-400">
                {offerLetter?.gstRate ? `Applicable Rate: ${offerLetter.gstRate}%` : 'Goods & Services Tax'}
              </p>
            </div>
          </Card>

          {/* Card 3: Total Cost of Home */}
          <Card className="border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-transparent">
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Total Cost of Home
                </span>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <div className="font-serif text-2xl font-bold text-brand-900 dark:text-white">
                {offerLetter?.costOfHomeFormatted || 'N/A'}
              </div>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
                Inclusive of Base Price & Taxes
              </p>
            </div>
          </Card>

          {/* Card 4: Maintenance Deposit */}
          <Card className="border-brand-200 dark:border-brand-800">
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Maintenance Deposit</span>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="font-serif text-2xl font-bold text-brand-900 dark:text-white">
                {offerLetter?.maintenanceDepositsFormatted || 'N/A'}
              </div>
              <p className="text-[11px] text-brand-500 dark:text-brand-400">Corpus / Security Fund</p>
            </div>
          </Card>
        </div>

        {/* Amount in Words Banner */}
        {offerLetter?.amountInWords && (
          <div className="mt-4 p-4 rounded-2xl bg-brand-50 dark:bg-brand-850/60 border border-brand-200/60 dark:border-brand-800 flex items-center gap-3">
            <FileText className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Amount in Words: </span>
              <span className="text-xs sm:text-sm font-serif font-bold text-brand-900 dark:text-white">
                {offerLetter.amountInWords}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. ENHANCED SECTION: PAYMENT MILESTONES (Offer Letter Table 3 Data) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-500" />
              Payment Milestones & Schedule
            </h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
              Structured installment plan & payment timeline from Offer Letter Table 3.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            Offer Letter Table 3
          </span>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-200 dark:border-brand-800 bg-brand-50/60 dark:bg-brand-850/60">
                  <th className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">#</th>
                  <th className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">Milestone</th>
                  <th className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider text-center">Payment %</th>
                  <th className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">Due Date</th>
                  <th className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider text-right">Unit Amount</th>
                  <th className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider text-right">GST</th>
                  <th className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider text-right">Installment Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 dark:divide-brand-850">
                {offerLetter?.milestones && offerLetter.milestones.length > 0 ? (
                  offerLetter.milestones.map((m, idx) => (
                    <tr key={idx} className="hover:bg-brand-50/40 dark:hover:bg-brand-850/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-brand-400 font-bold">{m.sequenceNumber || idx + 1}</td>
                      <td className="py-3.5 px-4 font-serif font-bold text-brand-900 dark:text-white">
                        {m.milestoneName}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {m.paymentPercentageFormatted || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-brand-600 dark:text-brand-300">
                        {m.dueDateFormatted || 'As per Schedule'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-brand-700 dark:text-brand-200">
                        {m.unitAmountFormatted || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-brand-500 dark:text-brand-400">
                        {m.gstAmountFormatted || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-brand-900 dark:text-white">
                        {m.installmentAmountFormatted || 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-brand-400">
                      {isOfferLetterLoading ? 'Loading payment milestone schedule...' : 'No payment milestones registered for this booking.'}
                    </td>
                  </tr>
                )}
              </tbody>
              {offerLetter?.milestones && offerLetter.milestones.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-brand-200 dark:border-brand-800 bg-brand-100/40 dark:bg-brand-850/80 font-bold text-brand-900 dark:text-white">
                    <td colSpan={2} className="py-4 px-4 font-serif text-sm">
                      Total Schedule Summary
                    </td>
                    <td className="py-4 px-4 text-center text-amber-600 dark:text-amber-400">
                      {offerLetter.totalMilestonePercent || '100%'}
                    </td>
                    <td className="py-4 px-4"></td>
                    <td className="py-4 px-4 text-right">{offerLetter.totalUnitCostFormatted || 'N/A'}</td>
                    <td className="py-4 px-4 text-right">{offerLetter.totalGstAmountFormatted || 'N/A'}</td>
                    <td className="py-4 px-4 text-right font-serif text-sm text-amber-600 dark:text-amber-400">
                      {offerLetter.totalInstallmentCostFormatted || 'N/A'}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>

      {/* 5. QUICK ACTION HUB (Existing) */}
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

      {/* 6. RECENT ACTIVITY & TIMELINE (Existing) */}
      <Card>
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-100 dark:border-brand-850 pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Recent Activity & Updates
              </h3>
              <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
                Real-time activity log for your residence.
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
