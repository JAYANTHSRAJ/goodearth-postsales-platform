import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  CreditCard,
  Clock,
  FileSpreadsheet,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/common/LoadingScreen';
import { clientService } from '../../../services/client.service';
import { useAuthStore } from '../../../store/authStore';

// Load Razorpay script dynamically
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const ClientFinancePage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  // Queries
  const { data: dashboard } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: () => clientService.getDashboard(),
  });

  const { data: finance, isLoading } = useQuery({
    queryKey: ['clientFinance'],
    queryFn: () => clientService.getFinanceSummary(),
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!finance) {
    return (
      <EmptyState
        title="Finance Details Offline"
        description="We are unable to retrieve your payment schedule summaries at this time."
        icon={AlertTriangle}
      />
    );
  }

  const paidSum = (finance.receipts || []).reduce((acc: number, r: any) => acc + (r.amount || 0), 0);
  const outstandingBal = finance.outstandingBalance || 0;
  const contractVal = paidSum + outstandingBal;

  // Calculate payment progress percentage
  const progressPercent = contractVal > 0 ? Math.round((paidSum / contractVal) * 100) : 0;

  // Get next upcoming due date from unpaid claims
  const unpaidClaims = (finance.invoices || []).filter((inv: any) => inv.status !== 'PAID');
  const nextDueClaim = unpaidClaims.length > 0 ? unpaidClaims[0] : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayNow = async (invoice: any) => {
    setPayingInvoiceId(invoice.id);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Failed to load online payment gateway. Please verify your connection.');
      setPayingInvoiceId(null);
      return;
    }

    const workflowId = dashboard?.workflow?.id || 'workflow_placeholder_uuid';

    const options = {
      key: 'rzp_test_goodearthkey',
      amount: invoice.amount * 100, // Amount in paise
      currency: 'INR',
      name: 'GoodEarth Post-Sales Platform',
      description: `Milestone Claim ${invoice.zohoInvoiceId || 'Upgrade payment'}`,
      image: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=120&auto=format&fit=crop',
      handler: function (response: any) {
        alert(`Payment Capture Successful!\nTransaction ID: ${response.razorpay_payment_id}`);
        queryClient.invalidateQueries({ queryKey: ['clientFinance'] });
        setPayingInvoiceId(null);
      },
      prefill: {
        name: user?.name || 'Homeowner',
        email: user?.email || 'homeowner@goodearth.org',
      },
      notes: {
        workflow_id: workflowId,
        invoice_id: invoice.id,
      },
      theme: {
        color: '#385141',
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleQuickDownload = (docType: string) => {
    alert(`Downloading your homeowner ${docType} copy (PDF)...`);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
          Finance
        </h1>
        <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
          Track your payments, download receipts, and stay updated on your home's payment schedule.
        </p>
      </div>

      {/* 3. Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Outstanding Amount */}
        <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm dark:border-brand-800 dark:bg-brand-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-450 dark:text-brand-400">
              Outstanding Amount
            </span>
            <div className="rounded-xl bg-red-50 p-2 text-red-700 dark:bg-red-950/20 dark:text-red-300">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>
          <h3 className="font-serif text-2xl font-semibold text-brand-900 dark:text-white mt-4">
            {formatCurrency(outstandingBal)}
          </h3>
          <p className="text-[10px] text-brand-450 mt-1">Pending milestone claim draw dues</p>
        </div>

        {/* Total Paid */}
        <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm dark:border-brand-800 dark:bg-brand-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-450 dark:text-brand-400">
              Total Paid
            </span>
            <div className="rounded-xl bg-green-55 p-2 text-green-700 dark:bg-green-950/20 dark:text-green-300">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <h3 className="font-serif text-2xl font-semibold text-brand-900 dark:text-white mt-4">
            {formatCurrency(paidSum)}
          </h3>
          <p className="text-[10px] text-brand-450 mt-1">Cleared post-sales milestone draws</p>
        </div>

        {/* Next Payment */}
        <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm dark:border-brand-800 dark:bg-brand-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-450 dark:text-brand-400">
              Next Payment
            </span>
            <div className="rounded-xl bg-brand-50 p-2 text-brand-700 dark:bg-brand-850/50 dark:text-brand-300">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <h3 className="font-serif text-2xl font-semibold text-brand-900 dark:text-white mt-4">
            {nextDueClaim ? formatCurrency(nextDueClaim.amount) : '₹0.00'}
          </h3>
          <p className="text-[10px] text-brand-450 mt-1">
            {nextDueClaim?.dueDate ? `Due on ${new Date(nextDueClaim.dueDate).toLocaleDateString('en-IN')}` : 'No immediate due claims'}
          </p>
        </div>

        {/* Payment Progress with visual bar */}
        <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm dark:border-brand-800 dark:bg-brand-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-450 dark:text-brand-400">
              Payment Progress
            </span>
            <div className="rounded-xl bg-brand-50 p-2 text-brand-700 dark:bg-brand-850/50 dark:text-brand-300">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <h3 className="font-serif text-2xl font-semibold text-brand-900 dark:text-white">
                {progressPercent}%
              </h3>
              <span className="text-[10px] text-brand-450 font-bold">Of Approved Cost</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-brand-100 dark:bg-brand-800 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-brand-700 dark:bg-brand-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main vertical sequence split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (timeline & schedule) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 8. Pay Outstanding Amount prominent action */}
          {nextDueClaim && (
            <div className="rounded-3xl bg-brand-50/40 border border-brand-100 p-6 dark:bg-brand-950/10 dark:border-brand-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <span className="rounded bg-red-650/10 px-2 py-0.5 text-[9px] font-bold text-red-700 uppercase tracking-wide">Action Required</span>
                <h4 className="text-base font-bold text-brand-900 dark:text-white mt-1.5">
                  Milestone Draw billing currently outstanding
                </h4>
                <p className="text-xs text-brand-500">
                  Submit transaction for {nextDueClaim.zohoInvoiceId} ({formatCurrency(nextDueClaim.amount)}) to keep customizations scheduled.
                </p>
              </div>
              <button
                onClick={() => handlePayNow(nextDueClaim)}
                disabled={payingInvoiceId === nextDueClaim.id}
                className="w-full sm:w-auto shrink-0 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white px-5 py-3 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <CreditCard className="h-4 w-4" />
                {payingInvoiceId === nextDueClaim.id ? 'Processing...' : 'Pay Outstanding Amount'}
              </button>
            </div>
          )}

          {/* 4. Billing Milestone Schedule (Vertical Payment Journey) */}
          <Card title="Billing Milestone Schedule" subtitle="Stages payment timeline progression from booking validation to handoff">
            {finance.invoices && finance.invoices.length > 0 ? (
              <div className="relative pl-6 ml-2 border-l border-brand-200 dark:border-brand-800 space-y-6 py-2">
                {finance.invoices.map((inv: any, idx: number) => {
                  const isPaid = inv.status === 'PAID';
                  const isCurrent = !isPaid && idx === unpaidClaims.length - 1;

                  return (
                    <div key={inv.id} className="relative pl-6 group">
                      {/* Timeline dot */}
                      <div className={`absolute left-[-31px] top-1 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isPaid
                          ? 'bg-green-600 border-green-600 text-white'
                          : isCurrent
                            ? 'bg-white border-brand-700 dark:bg-brand-900'
                            : 'bg-brand-50 border-brand-200 dark:bg-brand-850 dark:border-brand-800'
                      }`}>
                        {isPaid ? (
                          <CheckCircle className="h-3 w-3 text-white" />
                        ) : (
                          <div className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-brand-700 animate-ping' : 'bg-brand-300'}`} />
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-100/50 dark:border-brand-850/40 pb-4">
                        <div>
                          <h4 className="text-xs font-bold text-brand-900 dark:text-white flex items-center gap-2">
                            <span>Milestone {inv.zohoInvoiceId || 'Draw Item'}</span>
                            <StatusBadge label={isPaid ? 'Cleared' : inv.status} type={isPaid ? 'success' : 'warning'} />
                          </h4>
                          <div className="flex items-center gap-x-3 text-[10px] text-brand-450 mt-1 font-semibold">
                            <span>Due Date: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</span>
                            <span>•</span>
                            <span>SLA: Draw Clearance</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                          <span className="text-sm font-bold text-brand-900 dark:text-white">
                            {formatCurrency(inv.amount)}
                          </span>
                          {!isPaid && (
                            <button
                              onClick={() => handlePayNow(inv)}
                              disabled={payingInvoiceId === inv.id}
                              className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-3 py-1.5 text-[10px] font-bold shadow-sm transition-colors"
                            >
                              {payingInvoiceId === inv.id ? 'Syncing...' : 'Pay'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No billing milestones scheduled"
                description="Your upcoming custom selections draw milestones will list here as civil work advances."
                icon={FileText}
              />
            )}
          </Card>

          {/* 7. Payment Breakdown Section */}
          <Card title="Payment Breakdown" subtitle="Audit matrix of billing items and custom upgrades clearances">
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-brand-50/20 dark:bg-brand-900/40 border border-brand-100 dark:border-brand-850 text-xs">
                <div className="flex items-start gap-2.5">
                  <Layers className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-brand-900 dark:text-white">Booking Advance Fee</h5>
                    <p className="text-[10px] text-brand-450 mt-0.5">Initial residence unit blocking draw</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-brand-900 dark:text-white">₹1,00,000</span>
                  <span className="text-[9px] font-bold text-green-700 block mt-0.5 uppercase tracking-wide font-mono">Cleared</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-brand-50/20 dark:bg-brand-900/40 border border-brand-100 dark:border-brand-850 text-xs">
                <div className="flex items-start gap-2.5">
                  <FileText className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-brand-900 dark:text-white">Homeowner Agreement Draw</h5>
                    <p className="text-[10px] text-brand-450 mt-0.5">Sale agreement execution clearance</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-brand-900 dark:text-white">₹5,00,000</span>
                  <span className="text-[9px] font-bold text-green-700 block mt-0.5 uppercase tracking-wide font-mono">Cleared</span>
                </div>
              </div>

              {nextDueClaim && (
                <div className="flex justify-between items-center p-3 rounded-2xl bg-brand-50/20 dark:bg-brand-900/40 border border-brand-100 dark:border-brand-850 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Activity className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-bold text-brand-900 dark:text-white">{nextDueClaim.zohoInvoiceId || 'Custom Upgrades Claim'}</h5>
                      <p className="text-[10px] text-brand-450 mt-0.5">Structural civil milestone draw</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-brand-900 dark:text-white">{formatCurrency(nextDueClaim.amount)}</span>
                    <span className="text-[9px] font-bold text-yellow-600 block mt-0.5 uppercase tracking-wide font-mono">Outstanding</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (receipts & history) */}
        <div className="space-y-6">
          
          {/* 9. Quick Downloads Panel */}
          <Card title="Quick Downloads" subtitle="Access verified ledger statements and tax copies">
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => handleQuickDownload('Statement of Account')}
                className="p-3 rounded-xl border border-brand-150 bg-white hover:border-brand-350 dark:bg-brand-900 dark:border-brand-800 text-center transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="h-5 w-5 text-brand-650" />
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-300">Statement</span>
              </button>

              <button
                onClick={() => handleQuickDownload('Milestone Receipt')}
                className="p-3 rounded-xl border border-brand-150 bg-white hover:border-brand-350 dark:bg-brand-900 dark:border-brand-800 text-center transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="h-5 w-5 text-brand-650" />
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-300">Receipt</span>
              </button>

              <button
                onClick={() => handleQuickDownload('Tax Invoice')}
                className="p-3 rounded-xl border border-brand-150 bg-white hover:border-brand-350 dark:bg-brand-900 dark:border-brand-800 text-center transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm"
              >
                <FileText className="h-5 w-5 text-brand-650" />
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-300">Tax Invoice</span>
              </button>

              <button
                onClick={() => handleQuickDownload('Home Ledger')}
                className="p-3 rounded-xl border border-brand-150 bg-white hover:border-brand-350 dark:bg-brand-900 dark:border-brand-800 text-center transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm"
              >
                <Layers className="h-5 w-5 text-brand-650" />
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-300">Ledger</span>
              </button>
            </div>
          </Card>

          {/* 5. Modern Verification Receipts Cards */}
          <Card title="Verification Receipts" subtitle="Cleared milestone draws history">
            {finance.receipts && finance.receipts.length > 0 ? (
              <div className="space-y-4 pr-1 mt-2">
                {finance.receipts.map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl border border-brand-150 bg-white hover:border-brand-300 dark:border-brand-850 dark:bg-brand-900 transition-all flex flex-col gap-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-brand-100 dark:border-brand-850 pb-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-brand-400 block tracking-wider font-mono">Date Paid</span>
                        <span className="text-[10px] font-bold text-brand-900 dark:text-white">
                          {rec.paidDate ? new Date(rec.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                      <StatusBadge label="Cleared" type="success" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-brand-400 block tracking-wider font-mono">Amount Paid</span>
                        <h4 className="text-base font-bold text-brand-900 dark:text-white mt-0.5">
                          {formatCurrency(rec.amount)}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-brand-400 block tracking-wider font-mono">Payment Mode</span>
                        <span className="text-[10px] font-bold text-brand-800 dark:text-brand-300 mt-0.5 block">
                          {rec.paymentMode || 'Net Banking'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuickDownload(`Receipt_${rec.id}`)}
                      className="w-full rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-850 dark:hover:bg-brand-800 py-2 text-[10px] font-bold text-brand-700 dark:text-white transition-all flex items-center justify-center gap-1.5 border border-brand-200 dark:border-brand-750"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Receipt
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No draw receipts logged"
                description="Verified milestone draw clearances and payment receipts will list here once transactions clear."
                icon={CheckCircle}
              />
            )}
          </Card>

          {/* 6. Payment History Timeline */}
          <Card title="Payment History" subtitle="Chronological ledger updates">
            {finance.receipts && finance.receipts.length > 0 ? (
              <div className="relative pl-4 border-l border-brand-200 dark:border-brand-800 space-y-4 pt-1 ml-2 text-xs">
                {finance.receipts.slice(0, 3).map((rec: any) => (
                  <div key={rec.id} className="relative pl-4">
                    <div className="absolute left-[-21px] top-1.5 h-2 w-2 rounded-full bg-green-600" />
                    <div className="flex justify-between items-baseline gap-2 font-semibold">
                      <span className="text-brand-900 dark:text-white">{formatCurrency(rec.amount)} Cleared</span>
                      <span className="text-[9px] text-brand-400 font-mono">{rec.paidDate ? new Date(rec.paidDate).toLocaleDateString('en-IN') : '—'}</span>
                    </div>
                    <p className="text-[10px] text-brand-500 mt-0.5">Cleared via {rec.paymentMode || 'Bank Transfer'}. Remarks: {rec.remarks || 'Cleared milestone draw.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No transactions logged"
                description="Cleared homeowner draw statements timeline will appear here."
                icon={Clock}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientFinancePage;
