import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  FolderOpen,
  Plus,
  X,
  AlertTriangle,
  Search,
  ArrowLeft,
  DollarSign,
  Hammer,
  Sparkles,
  FileText,
  MessageSquare,
  Eye,
  Edit2,
  Trash2,
  Activity,
  Mail,
  Phone,
  User,
  Download,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { useBuyers } from '../hooks/useBuyers';
import { Buyer } from '../types/buyers.types';

// Extended Buyer type for CRM 360 Workspace
interface CRMBuyer extends Buyer {
  phone: string;
  crmCoordinator: string;
  constructionStage: 'Booking' | 'Agreement' | 'Design Layout' | 'Electrical' | 'Flooring' | 'Construction' | 'Handover' | 'Registration' | 'Interior Services';
  paymentStatus: 'Cleared' | 'Outstanding' | 'Overdue';
  designRequests: { total: number; pending: number };
  supportTickets: { total: number; open: number };
  lastActivity: string;
  properties: string[]; // multi unit selector support
}

export const BuyersPage: React.FC = () => {
  const {
    filteredBuyers,
    isLoading,
    totalBuyers,
    activeBuyers,
    pendingBuyers,
    currentPage,
    totalPages,
    onNextPage,
    onPreviousPage,
    createBuyer,
    updateBuyer,
    deleteBuyer,
  } = useBuyers();

  // Selected Buyer 360 Workspace View state (Not a Modal)
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'construction' | 'finance' | 'design' | 'support' | 'documents' | 'activity'>('overview');
  
  // Property selector state
  const [selectedPropertyIdx, setSelectedPropertyIdx] = useState<number>(0);

  // Search & Filter state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterCoordinator, setFilterCoordinator] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDesign, setFilterDesign] = useState('all');
  const [filterSupport, setFilterSupport] = useState('all');
  const [filterProperties, setFilterProperties] = useState('all');

  // Edit / Create Form states
  const [activeBuyerForEdit, setActiveBuyerForEdit] = useState<CRMBuyer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCoApplicantName, setFormCoApplicantName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'completed' | 'pending'>('pending');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock CRM Activity Feed Actions state
  const [crmLogs, setCrmLogs] = useState<string[]>([
    'CRM coordinator Arun Kumar assigned to account.',
    'Milestone invoice for structure construction raised.',
    'Slab curing status marked complete.',
    'Design studio floor plans annotation approved.',
    'Initial registration clearance documents verified.',
  ]);

  // Extended seed properties mapping
  const crmBuyers: CRMBuyer[] = useMemo(() => {
    return filteredBuyers.map((b, idx): CRMBuyer => {
      const coordinators = ['Arun Kumar', 'Meera Nair', 'Suresh Gowda'];
      const stages = ['Booking', 'Agreement', 'Design Layout', 'Electrical', 'Flooring', 'Construction', 'Handover', 'Registration', 'Interior Services'] as const;
      const payStatuses = ['Cleared', 'Outstanding', 'Overdue'] as const;

      return {
        ...b,
        phone: b.phone || (idx === 0 ? '+91 98450 12345' : `+91 99120 ${10000 + idx}`),
        crmCoordinator: coordinators[idx % coordinators.length],
        constructionStage: stages[idx % stages.length],
        paymentStatus: payStatuses[idx % payStatuses.length],
        designRequests: { total: idx % 2 === 0 ? 3 : 1, pending: idx === 0 ? 1 : 0 },
        supportTickets: { total: idx % 2 === 0 ? 2 : 0, open: idx === 0 ? 1 : 0 },
        lastActivity: idx % 2 === 0 ? 'Finishes selection submitted' : 'Receipt file uploaded',
        properties: idx === 0 ? ['Villa 14', 'Villa 42'] : [b.unitName || `Villa ${100 + idx}`],
      };
    });
  }, [filteredBuyers]);

  // Advanced filters & Global Search logic
  const filteredCRMBuyers = useMemo(() => {
    return crmBuyers.filter((b) => {
      const matchesSearch =
        b.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        b.email?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        b.phone?.includes(globalSearch) ||
        b.unitName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        b.projectName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        b.crmCoordinator?.toLowerCase().includes(globalSearch.toLowerCase());

      const matchesProject = filterProject === 'all' || b.projectName === filterProject;
      const matchesCoordinator = filterCoordinator === 'all' || b.crmCoordinator === filterCoordinator;
      const matchesStage = filterStage === 'all' || b.constructionStage === filterStage;
      const matchesPayment = filterPayment === 'all' || b.paymentStatus === filterPayment;
      
      const matchesDesign = filterDesign === 'all' || 
        (filterDesign === 'pending' && b.designRequests.pending > 0) ||
        (filterDesign === 'approved' && b.designRequests.pending === 0);

      const matchesSupport = filterSupport === 'all' || 
        (filterSupport === 'open' && b.supportTickets.open > 0) ||
        (filterSupport === 'resolved' && b.supportTickets.open === 0);

      const matchesProperties = filterProperties === 'all' || 
        (filterProperties === 'multiple' && b.properties.length > 1) ||
        (filterProperties === 'single' && b.properties.length === 1);

      return (
        matchesSearch &&
        matchesProject &&
        matchesCoordinator &&
        matchesStage &&
        matchesPayment &&
        matchesDesign &&
        matchesSupport &&
        matchesProperties
      );
    });
  }, [crmBuyers, globalSearch, filterProject, filterCoordinator, filterStage, filterPayment, filterDesign, filterSupport, filterProperties]);

  const activeBuyer = useMemo(() => {
    return crmBuyers.find((b) => b.id === selectedBuyerId);
  }, [crmBuyers, selectedBuyerId]);

  const handleOpenEdit = (buyer: CRMBuyer) => {
    setFormName(buyer.name || '');
    setFormEmail(buyer.email || '');
    setFormStatus(buyer.status || 'pending');
    setFormCoApplicantName(buyer.coApplicantName || '');
    setFormPhone(buyer.phone || '');
    setFormError(null);
    setActiveBuyerForEdit(buyer);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      setFormError('Please enter both name and email address.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createBuyer({
        name: formName,
        email: formEmail,
        status: formStatus,
        coApplicantName: formCoApplicantName,
        phone: formPhone,
      } as any);
      setIsCreateOpen(false);
      setFormName('');
      setFormEmail('');
      setFormCoApplicantName('');
      setFormPhone('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create buyer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBuyerForEdit) return;
    if (!formName || !formEmail) {
      setFormError('Please enter name and email.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await updateBuyer({
        id: activeBuyerForEdit.id,
        data: {
          name: formName,
          email: formEmail,
          status: formStatus,
          coApplicantName: formCoApplicantName,
          phone: formPhone,
        },
      });
      setActiveBuyerForEdit(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update buyer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!buyerToDelete) return;
    try {
      await deleteBuyer(buyerToDelete);
      setBuyerToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete buyer.');
    }
  };

  // Quick actions simulation
  const triggerQuickAction = (action: string) => {
    alert(`CRM Trigger: Quick Action [${action}] dispatched successfully.`);
    const newLog = `Quick Action: ${action} executed by CRM operator.`;
    setCrmLogs([newLog, ...crmLogs]);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 360° WORKSPACE VIEW OR MAIN LIST VIEW */}
      {activeBuyer ? (
        /* ================= 360° BUYER WORKSPACE ================= */
        <div className="space-y-6">
          {/* Header back navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedBuyerId(null)}
              className="rounded-xl border border-brand-200 hover:bg-brand-50 p-2 text-brand-800 dark:bg-brand-900 dark:border-brand-850 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold font-serif text-brand-900 dark:text-white">Buyer 360° Workspace</h2>
              <p className="text-xs text-brand-450">Comprehensive homeowner profile timeline and workflows clearance</p>
            </div>
          </div>

          {/* 6. Buyer Header Summary Card */}
          <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-md dark:border-brand-850 dark:bg-brand-900 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-serif font-bold text-brand-900 dark:text-white">{activeBuyer.name}</h3>
                  <StatusBadge label={activeBuyer.status?.toUpperCase()} type={activeBuyer.status === 'completed' ? 'success' : 'info'} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-450 mt-1.5 font-semibold">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {activeBuyer.email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {activeBuyer.phone}</span>
                  {activeBuyer.coApplicantName && (
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Co-Applicant: {activeBuyer.coApplicantName}</span>
                  )}
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> CRM coordinator: {activeBuyer.crmCoordinator}</span>
                </div>
              </div>

              {/* 7. Multiple property switcher */}
              {activeBuyer.properties.length > 1 && (
                <div className="bg-brand-50/40 dark:bg-brand-950/20 p-2 rounded-2xl border border-brand-150 dark:border-brand-800 text-xs font-bold shrink-0">
                  <span className="text-[9px] uppercase tracking-wider text-brand-400 block mb-1">Select Active Property</span>
                  <div className="flex gap-1">
                    {activeBuyer.properties.map((prop, idx) => (
                      <button
                        key={prop}
                        onClick={() => setSelectedPropertyIdx(idx)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] uppercase font-bold transition-all ${
                          selectedPropertyIdx === idx
                            ? 'bg-brand-700 text-white'
                            : 'bg-white text-brand-700 dark:bg-brand-800 dark:text-brand-300'
                        }`}
                      >
                        {prop}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sub details block */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mt-6 pt-6 border-t border-brand-100 dark:border-brand-850 text-xs font-semibold text-brand-500">
              <div>
                <span>Selected Property</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">{activeBuyer.properties[selectedPropertyIdx] || activeBuyer.unitName}</p>
              </div>
              <div>
                <span>Project Name</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">{activeBuyer.projectName}</p>
              </div>
              <div>
                <span>Construction Stage</span>
                <p className="text-sm font-bold text-amber-600 mt-1">{activeBuyer.constructionStage}</p>
              </div>
              <div>
                <span>Outstanding Amount</span>
                <p className="text-sm font-bold text-red-650 mt-1">{activeBuyer.outstanding}</p>
              </div>
              <div>
                <span>Design / Support Dues</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">
                  {activeBuyer.designRequests.pending} Pending / {activeBuyer.supportTickets.open} Open
                </p>
              </div>
            </div>
          </div>

          {/* Main workspace splits */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left side Workspace Tabs & Quick Actions */}
            <div className="space-y-6">
              <Card title="Workspace Menu" subtitle="Clear client milestone categories">
                <div className="flex flex-col gap-1 text-xs font-bold text-left">
                  {(['overview', 'construction', 'finance', 'design', 'support', 'documents', 'activity'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setWorkspaceTab(tab)}
                      className={`w-full rounded-xl px-4 py-2.5 text-left transition-all ${
                        workspaceTab === tab
                          ? 'bg-brand-700 text-white'
                          : 'bg-white hover:bg-brand-50 text-brand-750 dark:bg-brand-900 dark:text-brand-300 dark:hover:bg-brand-850'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </Card>

              {/* 8. Quick Actions Panel */}
              <Card title="CRM Quick Actions" subtitle="Perform administrative events">
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                  <button onClick={() => triggerQuickAction('Generate Invoice')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Generate Invoice
                  </button>
                  <button onClick={() => triggerQuickAction('Upload Document')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Upload Doc
                  </button>
                  <button onClick={() => triggerQuickAction('Assign Coordinator')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Assign Coordinator
                  </button>
                  <button onClick={() => triggerQuickAction('Move Stage')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Move Stage
                  </button>
                  <button onClick={() => triggerQuickAction('Send Notification')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Send Notice
                  </button>
                  <button onClick={() => triggerQuickAction('Raise Ticket')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Raise Ticket
                  </button>
                </div>
              </Card>
            </div>

            {/* Central Workspace Context Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {workspaceTab === 'overview' && (
                <Card title="Buyer Overview" subtitle="General CRM metrics and accounts context">
                  <div className="space-y-4 pt-2 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Billing Address</span>
                        <p className="font-semibold text-brand-900 mt-1 dark:text-white">7th Block Koramangala, Bangalore, India</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Allocated Villa Plot</span>
                        <p className="font-semibold text-brand-900 mt-1 dark:text-white">{activeBuyer.properties[selectedPropertyIdx] || activeBuyer.unitName}</p>
                      </div>
                      {activeBuyer.coApplicantName && (
                        <div>
                          <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Co-Applicant Name</span>
                          <p className="font-semibold text-brand-900 mt-1 dark:text-white">{activeBuyer.coApplicantName}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-brand-100 dark:border-brand-850">
                      <div>
                        <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Registration Clearance</span>
                        <p className="font-semibold text-green-700 mt-1">Verified & Approved</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Handover Date Plan</span>
                        <p className="font-semibold text-brand-900 mt-1 dark:text-white">18 December 2026</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'construction' && (
                <Card title="Construction Details" subtitle="Phase validation log">
                  <div className="space-y-4 pt-2 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-50 text-yellow-750 rounded-xl">
                        <Hammer className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">Plot Construction Phase: {activeBuyer.constructionStage}</h4>
                        <p className="text-[10px] text-brand-450">Site curing and superstructure completion validation audit parameters cleared.</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-brand-100 rounded-full overflow-hidden mt-2">
                      <div className="h-1.5 bg-brand-700 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'finance' && (
                <Card title="Financial Account Transactions" subtitle="Payment statements and due invoices">
                  <div className="space-y-4 pt-2 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-brand-100 dark:border-brand-850">
                      <div>
                        <span className="font-bold">Slab cast milestone claim invoice</span>
                        <p className="text-[10px] text-brand-450">Due date: 15 July 2026</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{activeBuyer.outstanding}</span>
                        <StatusBadge label="Outstanding" type="warning" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <span className="font-bold">Booking Advance Cleared</span>
                        <p className="text-[10px] text-brand-450">Date paid: 10 May 2026</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{activeBuyer.totalPaid}</span>
                        <StatusBadge label="Cleared" type="success" />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'design' && (
                <Card title="Design Studio Annotations" subtitle="Custom upgrades and finishes approval">
                  <div className="space-y-4 pt-2 text-xs font-semibold">
                    <div className="p-3 rounded-2xl bg-brand-50/20 border border-brand-150 flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-brand-900">Dining Area switchboard relocation</h5>
                        <p className="text-[10px] text-brand-450 mt-0.5">Electrical conduit customization request</p>
                      </div>
                      <StatusBadge label="Pending Review" type="warning" />
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'support' && (
                <Card title="Open snag ticket logs" subtitle="Homeowner reported query tickets">
                  <div className="space-y-4 pt-2 text-xs font-semibold">
                    <div className="p-3 rounded-2xl bg-brand-50/20 border border-brand-150 flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-brand-900">Fixture finish model selection inquiry</h5>
                        <p className="text-[10px] text-brand-450 mt-0.5">Assigned to: Arun Kumar</p>
                      </div>
                      <StatusBadge label="In Progress" type="warning" />
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'documents' && (
                <Card title="Homeowner Agreement Documents" subtitle="Verified executed deed agreements copies">
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex justify-between items-center p-3 rounded-2xl border border-brand-100 bg-white">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-brand-500" />
                        <span className="font-bold">Executed_Sale_Agreement.pdf</span>
                      </div>
                      <button onClick={() => triggerQuickAction('Download Document')} className="text-brand-500 hover:text-brand-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'activity' && (
                <Card title="Archived CRM Operations Log" subtitle="Complete history log for this account">
                  <div className="space-y-4 pl-4 border-l border-brand-200 mt-2 text-xs font-semibold">
                    <div className="relative pl-4">
                      <div className="absolute left-[-21px] top-1.5 h-2 w-2 rounded-full bg-brand-700" />
                      <span>Account Sync Completed with Zoho CRM</span>
                      <p className="text-[10px] text-brand-400 mt-0.5">Cleared by system worker</p>
                    </div>
                  </div>
                </Card>
              )}

            </div>

            {/* 9. Right-Side Recent Activity panel */}
            <div className="space-y-6">
              <Card title="Recent CRM Logs" subtitle="Chronological timeline of system events">
                <div className="relative border-l border-brand-200 pl-4 space-y-5 py-2 ml-2 text-xs">
                  {crmLogs.map((log, index) => (
                    <div key={index} className="relative pl-4">
                      <div className="absolute left-[-21px] top-1.5 h-2 w-2 rounded-full bg-accent-600" />
                      <p className="font-semibold text-brand-850 dark:text-brand-200 leading-normal">{log}</p>
                      <span className="text-[9px] text-brand-400 block mt-0.5">Today at {10 + index}:30 AM</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

          </div>
        </div>
      ) : (
        /* ================= MAIN BUYERS LIST VIEW ================= */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
                Buyers Management
              </h1>
              <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
                CRM-mastered buyer accounts and associated workflow histories.
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  setFormName('');
                  setFormEmail('');
                  setFormCoApplicantName('');
                  setFormPhone('');
                  setFormStatus('pending');
                  setFormError(null);
                  setIsCreateOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                <Plus className="h-4 w-4" />
                Add Buyer Account
              </button>
            </div>
          </div>

          {/* 1. Top KPI cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatCard
              title="Total Buyers"
              value={String(totalBuyers)}
              icon={Users}
              badge={<StatusBadge label="CRM Synced" type="info" />}
            />
            <StatCard
              title="Active Buyers"
              value={String(activeBuyers)}
              icon={UserCheck}
              badge={<StatusBadge label="Progressing" type="success" />}
            />
            <StatCard
              title="Pending Payments"
              value={String(pendingBuyers)}
              icon={DollarSign}
              badge={<StatusBadge label="Due Claims" type="warning" />}
            />
            <StatCard
              title="Pending Approvals"
              value="3"
              icon={Sparkles}
              badge={<StatusBadge label="Design review" type="warning" />}
            />
            <StatCard
              title="Open Tickets"
              value="2"
              icon={MessageSquare}
              badge={<StatusBadge label="Snags Logged" type="warning" />}
            />
            <StatCard
              title="Delayed Projects"
              value="0"
              icon={Activity}
              badge={<StatusBadge label="On Track" type="success" />}
            />
          </div>

          {/* 2 & 3. Search and Advanced Filters */}
          <Card title="Filter & Search Directory" subtitle="Advanced filter parameters to query the buyer base">
            <div className="space-y-4 mt-2">
              {/* Global search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="Search buyer name, email, phone, villa number, project name, or coordinator..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/20 pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              {/* Advanced filter panels */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7 text-[10px] font-bold">
                
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

                {/* Stage Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Current Stage</label>
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Stages</option>
                    <option value="Booking">Booking</option>
                    <option value="Agreement">Agreement</option>
                    <option value="Design Layout">Design Layout</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Flooring">Flooring</option>
                    <option value="Construction">Construction</option>
                    <option value="Handover">Handover</option>
                  </select>
                </div>

                {/* Payment Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Payment Status</label>
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Payments</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Outstanding">Outstanding</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Design Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Design Requests</label>
                  <select
                    value={filterDesign}
                    onChange={(e) => setFilterDesign(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Upgrades</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved Only</option>
                  </select>
                </div>

                {/* Support Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Support Tickets</label>
                  <select
                    value={filterSupport}
                    onChange={(e) => setFilterSupport(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Tickets</option>
                    <option value="open">Open Snags</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {/* Properties Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Multiple Properties</label>
                  <select
                    value={filterProperties}
                    onChange={(e) => setFilterProperties(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Ownerships</option>
                    <option value="multiple">Multiple Units</option>
                    <option value="single">Single Unit</option>
                  </select>
                </div>

              </div>
            </div>
          </Card>

          {/* 4. Buyer Table Grid */}
          <Card title="Buyer Accounts Directory" subtitle="CRM table records">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-brand-550 font-bold uppercase tracking-wider font-mono">
                Querying CRM Accounts...
              </div>
            ) : filteredCRMBuyers.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
                  <thead className="bg-brand-50/50 dark:bg-brand-950/30">
                    <tr className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
                      <th scope="col" className="px-4 py-3 text-left">Buyer Details</th>
                      <th scope="col" className="px-4 py-3 text-left">Villa & Project</th>
                      <th scope="col" className="px-4 py-3 text-left">CRM Staff</th>
                      <th scope="col" className="px-4 py-3 text-left">Progress Stage</th>
                      <th scope="col" className="px-4 py-3 text-left">Payment Status</th>
                      <th scope="col" className="px-4 py-3 text-left">Design Upgrade</th>
                      <th scope="col" className="px-4 py-3 text-left">Open Snags</th>
                      <th scope="col" className="px-4 py-3 text-left">Last Activity</th>
                      <th scope="col" className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-850/40 text-xs text-brand-800 dark:text-brand-200 font-semibold">
                    {filteredCRMBuyers.map((b) => (
                      <tr key={b.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-950/10">
                        <td className="px-4 py-3 text-left">
                          <div className="font-bold text-brand-900 dark:text-white">{b.name}</div>
                          <div className="text-[10px] text-brand-450 mt-0.5">{b.email}</div>
                          <div className="text-[10px] text-brand-400 mt-0.5">{b.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <div className="font-bold">{b.projectName}</div>
                          <div className="text-[10px] text-brand-450 mt-0.5">
                            {b.properties.length > 1 ? `${b.properties.join(', ')} (${b.properties.length} units)` : b.unitName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left">{b.crmCoordinator}</td>
                        <td className="px-4 py-3 text-left">
                          <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-850 dark:text-brand-300">
                            {b.constructionStage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <StatusBadge
                            label={b.paymentStatus}
                            type={b.paymentStatus === 'Cleared' ? 'success' : b.paymentStatus === 'Outstanding' ? 'neutral' : 'warning'}
                          />
                        </td>
                        <td className="px-4 py-3 text-left">
                          <span>{b.designRequests.total} requests</span>
                          {b.designRequests.pending > 0 && (
                            <span className="ml-1 text-[9px] text-amber-600 block">({b.designRequests.pending} pending)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-left">
                          <span>{b.supportTickets.total} snags</span>
                          {b.supportTickets.open > 0 && (
                            <span className="ml-1 text-[9px] text-red-650 block">({b.supportTickets.open} open)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-left truncate max-w-[120px]">{b.lastActivity}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedBuyerId(b.id);
                                setSelectedPropertyIdx(0);
                                setWorkspaceTab('overview');
                              }}
                              className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900"
                              title="Buyer 360 Workspace"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleOpenEdit(b)} className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900" title="Edit details">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setBuyerToDelete(b.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-750" title="Remove account">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onNext={onNextPage}
                    onPrevious={onPreviousPage}
                  />
                </div>
              </div>
            ) : (
              <EmptyState
                title="No buyers matching filters"
                description="Adjust search tags or filter choices to query buyer accounts."
                icon={FolderOpen}
              />
            )}
          </Card>
        </div>
      )}

      {/* CREATE BUYER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100 dark:border-brand-800">
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Create Buyer Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="rounded-lg p-1 text-brand-400 hover:bg-brand-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {formError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-750 border border-red-200">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Co-Applicant Name</label>
                <input
                  type="text"
                  value={formCoApplicantName}
                  onChange={(e) => setFormCoApplicantName(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl bg-brand-100 hover:bg-brand-200 px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BUYER MODAL */}
      {activeBuyerForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100 dark:border-brand-800">
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Modify Buyer Profile</h3>
              <button onClick={() => setActiveBuyerForEdit(null)} className="rounded-lg p-1 text-brand-400 hover:bg-brand-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {formError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Co-Applicant Name</label>
                <input
                  type="text"
                  value={formCoApplicantName}
                  onChange={(e) => setFormCoApplicantName(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveBuyerForEdit(null)}
                  className="rounded-xl bg-brand-100 hover:bg-brand-200 px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {buyerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center gap-3 pb-3 border-b border-brand-100 dark:border-brand-800">
              <AlertTriangle className="h-6 w-6 text-red-650" />
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Delete Account Confirmation</h3>
            </div>
            <p className="mt-4 text-xs text-brand-500">
              Are you sure you want to permanently delete this buyer account? This action will remove all metadata and is irreversible.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setBuyerToDelete(null)}
                className="rounded-xl bg-brand-100 hover:bg-brand-200 px-4 py-2.5 text-xs font-semibold"
              >
                No, Keep Account
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm"
              >
                Yes, Delete Buyer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BuyersPage;
