import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle,
  FolderOpen,
  FileText,
  ArrowLeft,
  Search,
  X,
  Download,
  AlertTriangle,
  Mail,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Check,
  Plus,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { usePayments } from '../hooks/usePayments';

// Extended Finance Record structure for internal GoodEarth staff
interface FinanceRecord {
  id: string;
  buyerName: string;
  projectName: string;
  unitName: string;
  outstandingAmount: number;
  paidAmount: number;
  upcomingAmount: number;
  lastPaymentAmount: number;
  lastPaymentDate: string;
  nextDueDate: string;
  invoiceStatus: 'Sent' | 'Paid' | 'Overdue' | 'Void';
  collectionStatus: 'Cleared' | 'Pending' | 'Overdue';
  coordinatorName: string;
  collectionMonth: string;
  invoices: {
    id: string;
    remarks: string;
    amount: number;
    dueDate: string;
    status: 'sent' | 'paid' | 'overdue' | 'void';
  }[];
  receipts: {
    id: string;
    amount: number;
    date: string;
    method: string;
    status: string;
  }[];
  paymentSchedule: {
    milestone: string;
    amount: number;
    status: 'Paid' | 'Current' | 'Upcoming';
  }[];
  razorpayAttempts: {
    transactionId: string;
    amount: number;
    method: string;
    status: 'Captured' | 'Failed' | 'Refunded';
    timestamp: string;
    failures: number;
    retries: number;
  }[];
}

export const PaymentsPage: React.FC = () => {
  const {
    filteredPayments,
    filteredInvoices,
    isLoading,
    receiptsPage,
    totalReceiptsPages,
    onNextPage,
    onPreviousPage,
  } = usePayments();

  // Selected Finance Record for 360 Workspace
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'invoices' | 'receipts' | 'schedule' | 'razorpay' | 'audit'>('overview');

  // Search & Filters state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterCoordinator, setFilterCoordinator] = useState('all');

  // Interactive local actions list
  const [financeLogs, setFinanceLogs] = useState([
    'Invoice INV-1025 dispatched to client email address.',
    'Razorpay payment attempt verified for ₹1,50,000 via UPI.',
    'Municipal clearance NOC fees logged to construction expense sheet.',
  ]);

  // Extended finance dataset mapper from hooks
  const financeRecords: FinanceRecord[] = useMemo(() => {
    // We map both filteredPayments and filteredInvoices together
    return filteredPayments.map((p, idx): FinanceRecord => {
      const coordinators = ['Arun Kumar', 'Meera Nair', 'Suresh Gowda'];
      const projects = ['GoodEarth Malhar', 'GoodEarth Orchard', 'GoodEarth Footprints'];
      const villas = ['Villa 14', 'Villa 15', 'Villa 16'];
      const months = ['July 2026', 'June 2026', 'May 2026'];

      const associatedInvoices = filteredInvoices.map((inv, invIdx) => ({
        id: inv.zohoInvoiceId || `INV-${1020 + invIdx}`,
        remarks: inv.remarks || 'Construction Milestone Electrical draw',
        amount: Number(inv.amount) || 150000,
        dueDate: inv.dueDate || '20 Jul 2026',
        status: (inv.status || 'sent') as 'sent' | 'paid' | 'overdue' | 'void',
      }));

      return {
        id: p.id || `fin-${idx}`,
        buyerName: p.buyerName || 'Jayanth S Raj',
        projectName: projects[idx % projects.length],
        unitName: villas[idx % villas.length],
        outstandingAmount: idx === 0 ? 150000 : 0,
        paidAmount: idx === 0 ? 7500000 : 4500000,
        upcomingAmount: 250000,
        lastPaymentAmount: Number(p.amount) || 150000,
        lastPaymentDate: '12 Jul 2026',
        nextDueDate: '20 Jul 2026',
        invoiceStatus: idx === 0 ? 'Sent' : 'Paid',
        collectionStatus: idx === 0 ? 'Pending' : 'Cleared',
        coordinatorName: coordinators[idx % coordinators.length],
        collectionMonth: months[idx % months.length],
        invoices: associatedInvoices,
        receipts: [
          { id: `REC-${3000 + idx}`, amount: Number(p.amount) || 150000, date: '12 Jul 2026', method: p.transactionId || 'Razorpay (UPI)', status: p.status || 'captured' },
        ],
        paymentSchedule: [
          { milestone: 'Booking Validation', amount: 500000, status: 'Paid' },
          { milestone: 'Agreement Signing', amount: 1500000, status: 'Paid' },
          { milestone: 'Foundation Slab Casting', amount: 2500000, status: 'Paid' },
          { milestone: 'Flooring Finish Selections', amount: 150000, status: 'Current' },
          { milestone: 'Handover & Possession', amount: 500000, status: 'Upcoming' },
        ],
        razorpayAttempts: [
          { transactionId: p.transactionId || `pay_Nz${100 + idx}`, amount: Number(p.amount) || 150000, method: 'UPI', status: 'Captured', timestamp: '12 Jul 2026, 04:30 PM', failures: 0, retries: 0 },
        ],
      };
    });
  }, [filteredPayments, filteredInvoices]);

  // Client search and filters logic
  const filteredFinanceRecords = useMemo(() => {
    return financeRecords.filter((rec) => {
      const matchesSearch =
        rec.buyerName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        rec.projectName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        rec.unitName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        rec.id.toLowerCase().includes(globalSearch.toLowerCase());

      const matchesProject = filterProject === 'all' || rec.projectName === filterProject;
      const matchesPayment = filterPaymentStatus === 'all' || rec.collectionStatus === filterPaymentStatus;
      const matchesInvoice = filterInvoiceStatus === 'all' || rec.invoiceStatus === filterInvoiceStatus;
      const matchesMonth = filterMonth === 'all' || rec.collectionMonth === filterMonth;
      const matchesCoordinator = filterCoordinator === 'all' || rec.coordinatorName === filterCoordinator;

      return (
        matchesSearch &&
        matchesProject &&
        matchesPayment &&
        matchesInvoice &&
        matchesMonth &&
        matchesCoordinator
      );
    });
  }, [financeRecords, globalSearch, filterProject, filterPaymentStatus, filterInvoiceStatus, filterMonth, filterCoordinator]);

  const activeRecord = useMemo(() => {
    return financeRecords.find((rec) => rec.id === selectedRecordId);
  }, [financeRecords, selectedRecordId]);

  // Simulation of CRM finance triggers
  const triggerQuickAction = (action: string) => {
    alert(`CRM Finance Operations: Action [${action}] executed successfully.`);
    const newLog = `Action: ${action} executed by finance supervisor.`;
    setFinanceLogs([newLog, ...financeLogs]);
  };

  const handleNext = () => {
    onNextPage('receipts');
  };

  const handlePrevious = () => {
    onPreviousPage('receipts');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 360° WORKSPACE OR MAIN LIST VIEW */}
      {activeRecord ? (
        /* ================= 360° FINANCE WORKSPACE ================= */
        <div className="space-y-6">
          {/* Header back navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedRecordId(null)}
              className="rounded-xl border border-brand-200 hover:bg-brand-50 p-2 text-brand-800 dark:bg-brand-900 dark:border-brand-850 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold font-serif text-brand-900 dark:text-white">Finance 360° Control Center</h2>
              <p className="text-xs text-brand-450">Administrative operations center to reconcile Razorpay webhook attempts, export ledgers, and manage invoices</p>
            </div>
          </div>

          {/* Finance Summary Header */}
          <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-md dark:border-brand-850 dark:bg-brand-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-serif font-bold text-brand-900 dark:text-white">{activeRecord.buyerName}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-450 mt-1.5 font-semibold">
                  <span>Project Name: {activeRecord.projectName}</span>
                  <span>•</span>
                  <span>Villa Unit: {activeRecord.unitName}</span>
                  <span>•</span>
                  <span>Coordinator: {activeRecord.coordinatorName}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => triggerQuickAction('Export Buyer Ledger PDF')} className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors">
                  Export Ledger
                </button>
                <button onClick={() => triggerQuickAction('Send Payment Reminder SMS')} className="rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 dark:text-white px-4 py-2 text-xs font-semibold transition-colors">
                  Send Reminder
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mt-6 pt-6 border-t border-brand-100 dark:border-brand-850 text-xs font-semibold text-brand-500">
              <div>
                <span>Outstanding Balance</span>
                <p className="text-sm font-bold text-red-650 mt-1">₹{activeRecord.outstandingAmount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span>Total Paid Collections</span>
                <p className="text-sm font-bold text-green-750 mt-1">₹{activeRecord.paidAmount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span>Upcoming Milestones draw</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">₹{activeRecord.upcomingAmount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span>Last Payment Received</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">₹{activeRecord.lastPaymentAmount.toLocaleString('en-IN')} ({activeRecord.lastPaymentDate})</p>
              </div>
              <div>
                <span>Collection Status</span>
                <div className="mt-1">
                  <StatusBadge label={activeRecord.collectionStatus} type={activeRecord.collectionStatus === 'Cleared' ? 'success' : 'warning'} />
                </div>
              </div>
            </div>
          </div>

          {/* Main workspace layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left side Workspace Menu and Quick Actions */}
            <div className="space-y-6">
              <Card title="Workspace Tabs" subtitle="Finance module categories">
                <div className="flex flex-col gap-1 text-xs font-bold text-left">
                  {([
                    { id: 'overview', label: 'Overview Metrics' },
                    { id: 'invoices', label: 'Milestone Invoices' },
                    { id: 'receipts', label: 'Transaction Receipts' },
                    { id: 'schedule', label: 'Payment Journey Schedule' },
                    { id: 'razorpay', label: 'Razorpay Gateway Logs' },
                    { id: 'audit', label: 'Audit Trail Logs' },
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setWorkspaceTab(tab.id)}
                      className={`w-full rounded-xl px-4 py-2.5 text-left transition-all ${
                        workspaceTab === tab.id
                          ? 'bg-brand-700 text-white'
                          : 'bg-white hover:bg-brand-50 text-brand-750 dark:bg-brand-900 dark:text-brand-300 dark:hover:bg-brand-850'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Sidebar Quick Actions */}
              <Card title="Quick Actions" subtitle="Reconciliation dispatchers">
                <div className="flex flex-col gap-2 text-xs font-bold text-left">
                  <button onClick={() => triggerQuickAction('Generate Invoice')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-800 dark:text-white">
                    <span>Generate Invoice</span>
                    <Plus className="h-3.5 w-3.5 text-brand-500" />
                  </button>
                  <button onClick={() => triggerQuickAction('Record Manual Payment')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-800 dark:text-white">
                    <span>Record Payment</span>
                    <CreditCard className="h-3.5 w-3.5 text-brand-500" />
                  </button>
                  <button onClick={() => triggerQuickAction('Issue Receipt')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-800 dark:text-white">
                    <span>Issue Receipt</span>
                    <Check className="h-3.5 w-3.5 text-brand-500" />
                  </button>
                </div>
              </Card>
            </div>

            {/* Central Workspace Tab panel */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TAB 1: Overview */}
              {workspaceTab === 'overview' && (
                <Card title="Overview Statistics" subtitle="Reconciliation progress breakdown">
                  <div className="space-y-4 pt-2 text-xs font-semibold">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-2xl bg-brand-50/20 border border-brand-100">
                        <span className="text-[10px] text-brand-450 block uppercase font-mono">Outstanding collections</span>
                        <p className="text-base font-bold text-red-650 mt-1">₹{activeRecord.outstandingAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-brand-50/20 border border-brand-100">
                        <span className="text-[10px] text-brand-450 block uppercase font-mono">Total paid collections</span>
                        <p className="text-base font-bold text-green-750 mt-1">₹{activeRecord.paidAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-brand-100 space-y-3 shadow-sm">
                      <h4 className="font-bold text-brand-900">Collection progress efficiency</h4>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">98.5%</span>
                        <div className="flex-1 h-2.5 bg-brand-100 rounded-full overflow-hidden">
                          <div className="h-2.5 bg-green-700 rounded-full" style={{ width: '98.5%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* TAB 2: Invoices */}
              {workspaceTab === 'invoices' && (
                <Card title="Milestone Invoices" subtitle="Zoho-mastered milestone invoices">
                  <div className="space-y-3.5 pt-2">
                    {activeRecord.invoices.map((inv, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-brand-100 flex items-center justify-between text-xs font-semibold shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-900">{inv.id}</span>
                            <StatusBadge label={inv.status} type={inv.status === 'paid' ? 'success' : 'warning'} />
                          </div>
                          <p className="text-[10px] text-brand-450 mt-0.5">{inv.remarks} | Due: {inv.dueDate}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => triggerQuickAction('Download Invoice PDF')} className="text-brand-500 hover:text-brand-850">
                            <Download className="h-4.5 w-4.5" />
                          </button>
                          <button onClick={() => triggerQuickAction('Email Invoice notification')} className="text-brand-500 hover:text-brand-850">
                            <Mail className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 3: Receipts */}
              {workspaceTab === 'receipts' && (
                <Card title="Reconciled Payment Receipts" subtitle="Milestone transaction receipt history">
                  <div className="space-y-3.5 pt-2">
                    {activeRecord.receipts.map((rec, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-brand-100 flex items-center justify-between text-xs font-semibold shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-900">{rec.id}</span>
                            <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">{rec.status}</span>
                          </div>
                          <p className="text-[10px] text-brand-450 mt-0.5">Method: {rec.method} | Paid: {rec.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-brand-900">₹{rec.amount.toLocaleString('en-IN')}</span>
                          <button onClick={() => triggerQuickAction('Download Receipt PDF')} className="text-brand-500 hover:text-brand-850">
                            <Download className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 4: Payment Schedule */}
              {workspaceTab === 'schedule' && (
                <Card title="Milestone Payment Schedule" subtitle="Development stages payment journey checkpoints">
                  <div className="relative pl-6 ml-2 border-l border-brand-200 dark:border-brand-850 space-y-6 py-2 text-xs">
                    {activeRecord.paymentSchedule.map((step, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className={`absolute left-[-31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-white flex items-center justify-center ${
                          step.status === 'Paid' ? 'bg-green-600' : step.status === 'Current' ? 'bg-yellow-500' : 'bg-brand-100'
                        }`} />
                        <div className="flex items-baseline justify-between gap-4 font-semibold">
                          <span className="text-brand-900 dark:text-white">{step.milestone}</span>
                          <span className="text-[10px] text-brand-900 dark:text-white font-mono">₹{step.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-[10px] text-brand-450 mt-1">Status: {step.status}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 5: Razorpay attempts */}
              {workspaceTab === 'razorpay' && (
                <Card title="Razorpay Gateway Transactions Logs" subtitle="Webhook payload attempts and correlation IDs">
                  <div className="space-y-3.5 pt-2 text-xs font-semibold">
                    {activeRecord.razorpayAttempts.map((attempt, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-brand-100 space-y-2 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-brand-900">Transaction: {attempt.transactionId}</span>
                          <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">{attempt.status}</span>
                        </div>
                        <div className="text-[10px] text-brand-450 space-y-0.5">
                          <p>Gateway Method: {attempt.method}</p>
                          <p>Captured Time: {attempt.timestamp}</p>
                          <p className="font-mono">Failures / Retries: {attempt.failures} / {attempt.retries}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 6: Audit Log */}
              {workspaceTab === 'audit' && (
                <Card title="Finance History Audit Logs" subtitle="Complete chronological ledger audit trail">
                  <div className="relative pl-4 border-l border-brand-200 space-y-4 py-2 ml-2 text-xs font-semibold">
                    {financeLogs.map((log, idx) => (
                      <div key={idx} className="relative pl-4">
                        <div className="absolute left-[-21px] top-1.5 h-2 w-2 rounded-full bg-brand-700" />
                        <span className="text-brand-900 dark:text-white">{log}</span>
                        <p className="text-[9px] text-brand-400 mt-0.5">Logged on: 13 July 2026, 04:00 PM</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            </div>

            {/* Right side activity feed logs */}
            <div className="space-y-6">
              <Card title="Audit Activity logs" subtitle="Chronological events timeline">
                <div className="relative border-l border-brand-200 pl-4 space-y-5 py-2 ml-2 text-xs">
                  {financeLogs.map((log, index) => (
                    <div key={index} className="relative pl-4">
                      <div className="absolute left-[-21px] top-1.5 h-2 w-2 rounded-full bg-accent-600" />
                      <p className="font-semibold text-brand-850 dark:text-brand-200 leading-normal">{log}</p>
                      <span className="text-[9px] text-brand-400 block mt-0.5">Today at {10 + index}:45 AM</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

          </div>
        </div>
      ) : (
        /* ================= MAIN FINANCE MODULE LIST VIEW ================= */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-left">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
                Finance Operations Center
              </h1>
              <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
                Razorpay gateway integrations reconciliation, Zoho invoice automation, and collections tracking.
              </p>
            </div>
          </div>

          {/* 1. TOP KPI Dashboard */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-8">
            <StatCard
              title="Total Collections"
              value="₹12.0Cr"
              icon={TrendingUp}
              badge={<StatusBadge label="Efficiency" type="success" />}
            />
            <StatCard
              title="Outstanding Amount"
              value="₹1.5L"
              icon={AlertTriangle}
              badge={<StatusBadge label="Due Claims" type="warning" />}
            />
            <StatCard
              title="Overdue Payments"
              value="₹0"
              icon={ShieldAlert}
              badge={<StatusBadge label="Clean Ledger" type="success" />}
            />
            <StatCard
              title="Upcoming Collections"
              value="₹2.5L"
              icon={CreditCard}
              badge={<StatusBadge label="Forecast" type="info" />}
            />
            <StatCard
              title="Invoices Generated"
              value="4"
              icon={FileText}
              badge={<StatusBadge label="Active Zoho" type="info" />}
            />
            <StatCard
              title="Receipts Issued"
              value="3"
              icon={CheckCircle}
              badge={<StatusBadge label="Cleared" type="success" />}
            />
            <StatCard
              title="Refunds Claims"
              value="0"
              icon={X}
              badge={<StatusBadge label="Zero Debts" type="success" />}
            />
            <StatCard
              title="Efficiency Rate"
              value="98.5%"
              icon={BarChart3}
              badge={<StatusBadge label="Standard SLA" type="success" />}
            />
          </div>

          {/* Reports Panel */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-[10px] font-bold text-center">
            <button onClick={() => triggerQuickAction('Generate Collections Report')} className="p-3.5 rounded-2xl bg-brand-50/20 hover:bg-brand-50 border border-brand-100 flex items-center justify-center gap-2 dark:bg-brand-900 dark:border-brand-800 dark:text-white">
              <FileSpreadsheet className="h-4 w-4 text-brand-650" />
              <span>Collections Report</span>
            </button>
            <button onClick={() => triggerQuickAction('Generate Outstanding Report')} className="p-3.5 rounded-2xl bg-brand-50/20 hover:bg-brand-50 border border-brand-100 flex items-center justify-center gap-2 dark:bg-brand-900 dark:border-brand-800 dark:text-white">
              <FileSpreadsheet className="h-4 w-4 text-brand-650" />
              <span>Outstanding Report</span>
            </button>
            <button onClick={() => triggerQuickAction('Generate Monthly Revenue Report')} className="p-3.5 rounded-2xl bg-brand-50/20 hover:bg-brand-50 border border-brand-100 flex items-center justify-center gap-2 dark:bg-brand-900 dark:border-brand-800 dark:text-white">
              <FileSpreadsheet className="h-4 w-4 text-brand-650" />
              <span>Monthly Revenue</span>
            </button>
            <button onClick={() => triggerQuickAction('Generate Project Collections Report')} className="p-3.5 rounded-2xl bg-brand-50/20 hover:bg-brand-50 border border-brand-100 flex items-center justify-center gap-2 dark:bg-brand-900 dark:border-brand-800 dark:text-white">
              <FileSpreadsheet className="h-4 w-4 text-brand-650" />
              <span>Project Collections</span>
            </button>
            <button onClick={() => triggerQuickAction('Generate Buyer Ledger Report')} className="p-3.5 rounded-2xl bg-brand-50/20 hover:bg-brand-50 border border-brand-100 flex items-center justify-center gap-2 dark:bg-brand-900 dark:border-brand-800 dark:text-white">
              <FileSpreadsheet className="h-4 w-4 text-brand-650" />
              <span>Buyer Ledger</span>
            </button>
          </div>

          {/* 2 & 3. Search and Filters */}
          <Card title="Filter & Search Finance Ledgers" subtitle="Advanced filter parameters to query payment milestones">
            <div className="space-y-4 mt-2">
              {/* Global search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="Search buyer name, project name, villa plot unit, invoice number, or receipt number..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/20 pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              {/* Advanced filter panels */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-[10px] font-bold">
                
                {/* Project Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Project</label>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Projects</option>
                    <option value="GoodEarth Malhar">GoodEarth Malhar</option>
                    <option value="GoodEarth Orchard">GoodEarth Orchard</option>
                    <option value="GoodEarth Footprints">GoodEarth Footprints</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Payment Status</label>
                  <select
                    value={filterPaymentStatus}
                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending Clearance</option>
                    <option value="Cleared">Cleared</option>
                  </select>
                </div>

                {/* Invoice Status */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Invoice Status</label>
                  <select
                    value={filterInvoiceStatus}
                    onChange={(e) => setFilterInvoiceStatus(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                {/* Collection Month */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Collection Month</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Months</option>
                    <option value="July 2026">July 2026</option>
                    <option value="June 2026">June 2026</option>
                  </select>
                </div>

                {/* Coordinator Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">CRM Coordinator</label>
                  <select
                    value={filterCoordinator}
                    onChange={(e) => setFilterCoordinator(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Staff</option>
                    <option value="Arun Kumar">Arun Kumar</option>
                    <option value="Meera Nair">Meera Nair</option>
                    <option value="Suresh Gowda">Suresh Gowda</option>
                  </select>
                </div>

              </div>
            </div>
          </Card>

          {/* 4. Finance Table */}
          <Card title="Finance Operations Directory" subtitle="Master list of buyer ledger details and billing checkpoints">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-brand-550 font-bold uppercase tracking-wider font-mono">
                Querying Finance Ledgers...
              </div>
            ) : filteredFinanceRecords.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
                  <thead className="bg-brand-50/50 dark:bg-brand-950/30">
                    <tr className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
                      <th scope="col" className="px-4 py-3 text-left">Buyer</th>
                      <th scope="col" className="px-4 py-3 text-left">Project</th>
                      <th scope="col" className="px-4 py-3 text-left">Villa unit</th>
                      <th scope="col" className="px-4 py-3 text-left">Outstanding</th>
                      <th scope="col" className="px-4 py-3 text-left">Last Payment</th>
                      <th scope="col" className="px-4 py-3 text-left">Next Due</th>
                      <th scope="col" className="px-4 py-3 text-left">Invoice Status</th>
                      <th scope="col" className="px-4 py-3 text-left">Collection Status</th>
                      <th scope="col" className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-850/40 text-xs text-brand-800 dark:text-brand-200 font-semibold">
                    {filteredFinanceRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-950/10">
                        <td className="px-4 py-3 text-left font-bold text-brand-900 dark:text-white">{rec.buyerName}</td>
                        <td className="px-4 py-3 text-left">{rec.projectName}</td>
                        <td className="px-4 py-3 text-left">{rec.unitName}</td>
                        <td className="px-4 py-3 text-left font-bold text-red-650">₹{rec.outstandingAmount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-left">₹{rec.lastPaymentAmount.toLocaleString('en-IN')} ({rec.lastPaymentDate})</td>
                        <td className="px-4 py-3 text-left">{rec.nextDueDate}</td>
                        <td className="px-4 py-3 text-left">
                          <StatusBadge label={rec.invoiceStatus.toUpperCase()} type={rec.invoiceStatus === 'Paid' ? 'success' : 'warning'} />
                        </td>
                        <td className="px-4 py-3 text-left">
                          <StatusBadge label={rec.collectionStatus.toUpperCase()} type={rec.collectionStatus === 'Cleared' ? 'success' : 'warning'} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedRecordId(rec.id);
                                setWorkspaceTab('overview');
                              }}
                              className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900"
                              title="Finance 360 Workspace"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4">
                  <Pagination
                    currentPage={receiptsPage}
                    totalPages={totalReceiptsPages}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                  />
                </div>
              </div>
            ) : (
              <EmptyState
                title="No finance records matching filters"
                description="Adjust search tags or filter choices to query ledgers."
                icon={FolderOpen}
              />
            )}
          </Card>
        </div>
      )}

    </div>
  );
};

export default PaymentsPage;
