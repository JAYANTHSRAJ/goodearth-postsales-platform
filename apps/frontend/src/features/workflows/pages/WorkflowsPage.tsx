import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  AlertCircle,
  FolderOpen,
  X,
  Layers,
  Search,
  ArrowLeft,
  DollarSign,
  Sparkles,
  MessageSquare,
  Eye,
  Edit2,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  Terminal,
  Activity,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { useWorkflows } from '../hooks/useWorkflows';
import { Workflow } from '../types/workflows.types';

// Extended Workflow type for CRM Workflow Control Center
interface CRMWorkflow extends Workflow {
  outstandingAmount: number;
  designRequests: number;
  supportTickets: number;
  lastUpdated: string;
  coordinator: string;
  stages: {
    name: 'Booking' | 'Agreement' | 'Design Layout' | 'Electrical' | 'Flooring' | 'Construction' | 'Handover' | 'Registration' | 'Interior Services';
    status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED';
    comments: string;
  }[];
  approvals: {
    item: string;
    status: 'Approved' | 'Pending Review' | 'Rejected';
    reason: string;
    reviewer: string;
    date: string;
  }[];
  dependencies: {
    name: string;
    category: 'Payment' | 'Document' | 'Design' | 'Support' | 'Construction';
    status: 'Pending' | 'Resolved';
  }[];
  automations: {
    trigger: string;
    action: string;
    timestamp: string;
  }[];
}

export const WorkflowsPage: React.FC = () => {
  const {
    filteredWorkflows,
    isLoading,
    currentPage,
    totalPages,
    onNextPage,
    onPreviousPage,
    updateWorkflowStatus,
  } = useWorkflows();

  // Workflow 360 Workspace state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'journey' | 'approvals' | 'dependencies' | 'automation' | 'audit'>('journey');

  // Search & Filter state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCoordinator, setFilterCoordinator] = useState('all');
  const [filterConstruction, setFilterConstruction] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  // Form states for stage override comments
  const [stageComments, setStageComments] = useState<Record<string, string>>({});
  const [activeWorkflowForEdit, setActiveWorkflowForEdit] = useState<Workflow | null>(null);
  const [formStatus, setFormStatus] = useState<string>('draft');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial audit log events
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'Workflow created. Booking stage unlocked by Zoho webhook sync.',
    'Milestone agreement documents verified by legal coordinator.',
    'Flooring selections submitted by client; moved status to Under Review.',
    'Invoice generated for electrical stage draw clearances.',
  ]);



  // Extended workflow database mapper
  const crmWorkflows: CRMWorkflow[] = useMemo(() => {
    return filteredWorkflows.map((w, idx): CRMWorkflow => {
      const coordinators = ['Arun Kumar', 'Meera Nair', 'Suresh Gowda'];
      const stagesOrder: CRMWorkflow['stages'][number]['name'][] = [
        'Booking',
        'Agreement',
        'Design Layout',
        'Electrical',
        'Flooring',
        'Construction',
        'Handover',
        'Registration',
        'Interior Services',
      ];

      // Map progress to statuses
      const mappedStages = stagesOrder.map((name, sIdx) => {
        let status: CRMWorkflow['stages'][number]['status'] = 'LOCKED';
        if (sIdx * 10 < w.progressPercent) {
          status = 'COMPLETED';
        } else if (sIdx * 10 === w.progressPercent) {
          status = 'UNDER_REVIEW';
        } else if (sIdx * 10 - 10 === w.progressPercent) {
          status = 'IN_PROGRESS';
        } else if (sIdx * 10 - 20 === w.progressPercent) {
          status = 'AVAILABLE';
        }
        return {
          name,
          status,
          comments: `Stage verified by civil auditor during site log validation.`,
        };
      });

      return {
        ...w,
        outstandingAmount: idx === 0 ? 150000 : 0,
        designRequests: idx === 0 ? 2 : 0,
        supportTickets: idx === 0 ? 1 : 0,
        lastUpdated: '12 Jul 2026',
        coordinator: coordinators[idx % coordinators.length],
        stages: mappedStages,
        approvals: [
          { item: 'Master Bedroom Flooring choice', status: 'Approved', reason: 'European White Oak fits design constraints', reviewer: 'Meera Nair', date: '10 Jun 2026' },
          { item: 'Dining socket shift drawing', status: 'Pending Review', reason: 'Awaiting structural approval', reviewer: 'Arun Kumar', date: '12 Jun 2026' },
        ],
        dependencies: [
          { name: 'Electrical conduits layout drawing approvals', category: 'Design', status: 'Pending' },
          { name: 'Slab structural drawing Government clearance', category: 'Document', status: 'Pending' },
          { name: 'Stage 3 payment collections draw', category: 'Payment', status: 'Pending' },
        ],
        automations: [
          { trigger: 'Booking cleared', action: 'Notification Sent & Invoice Generated', timestamp: '12 May 2026' },
          { trigger: 'Design layout submitted', action: 'Design Review Alert Dispatched', timestamp: '10 Jun 2026' },
        ],
      };
    });
  }, [filteredWorkflows]);

  // Global search & Advanced filters
  const filteredCRMWorkflows = useMemo(() => {
    return crmWorkflows.filter((w) => {
      const matchesSearch =
        w.buyerName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        w.projectName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        w.unitName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        w.coordinator?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        w.id?.toLowerCase().includes(globalSearch.toLowerCase());

      const matchesProject = filterProject === 'all' || w.projectName === filterProject;
      const matchesPhase = filterPhase === 'all' || w.currentStage === filterPhase;
      const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
      const matchesCoordinator = filterCoordinator === 'all' || w.coordinator === filterCoordinator;
      
      const matchesConstruction = filterConstruction === 'all' || 
        (filterConstruction === 'active' && w.progressPercent < 90);

      const matchesPayment = filterPayment === 'all' || 
        (filterPayment === 'outstanding' && w.outstandingAmount > 0) ||
        (filterPayment === 'cleared' && w.outstandingAmount === 0);

      return (
        matchesSearch &&
        matchesProject &&
        matchesPhase &&
        matchesStatus &&
        matchesCoordinator &&
        matchesConstruction &&
        matchesPayment
      );
    });
  }, [crmWorkflows, globalSearch, filterProject, filterPhase, filterStatus, filterCoordinator, filterConstruction, filterPayment]);

  const activeWorkflow = useMemo(() => {
    return crmWorkflows.find((w) => w.id === selectedWorkflowId);
  }, [crmWorkflows, selectedWorkflowId]);

  // State Transition form submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkflowForEdit) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await updateWorkflowStatus({
        id: activeWorkflowForEdit.id,
        status: formStatus,
      });
      setActiveWorkflowForEdit(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update workflow status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage status override actions
  const handleStageAction = (stageName: string, action: string) => {
    alert(`CRM override: ${stageName} status changed to [${action}].`);
    const newLog = `Stage: ${stageName} override action [${action}] triggered. Comment: ${stageComments[stageName] || 'None'}`;
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Quick actions simulation
  const triggerQuickAction = (action: string) => {
    alert(`CRM Workflow Action: [${action}] dispatched.`);
    const newLog = `Quick Action: ${action} executed by coordinator.`;
    setAuditLogs([newLog, ...auditLogs]);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 360° WORKSPACE VIEW OR MAIN LIST VIEW */}
      {activeWorkflow ? (
        /* ================= 360° WORKFLOW WORKSPACE ================= */
        <div className="space-y-6">
          {/* Header back navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedWorkflowId(null)}
              className="rounded-xl border border-brand-200 hover:bg-brand-50 p-2 text-brand-800 dark:bg-brand-900 dark:border-brand-850 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold font-serif text-brand-900 dark:text-white">Workflow 360° Control Center</h2>
              <p className="text-xs text-brand-450">Administrative portal to override stages locks, milestones, and audit trails</p>
            </div>
          </div>

          {/* 6. Workflow Header Summary Block */}
          <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-md dark:border-brand-850 dark:bg-brand-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-serif font-bold text-brand-900 dark:text-white">{activeWorkflow.buyerName}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-450 mt-1.5 font-semibold">
                  <span>Project Name: {activeWorkflow.projectName}</span>
                  <span>•</span>
                  <span>Villa Plot: {activeWorkflow.unitName}</span>
                  <span>•</span>
                  <span>Workflow ID: {activeWorkflow.id}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <button onClick={() => triggerQuickAction('Move to Next Phase')} className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 transition-colors">
                  Move to Next Phase
                </button>
                <button onClick={() => triggerQuickAction('Generate Draw Invoice')} className="rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 dark:text-white px-4 py-2 transition-colors">
                  Generate Invoice
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-6 mt-6 pt-6 border-t border-brand-100 dark:border-brand-850 text-xs font-semibold text-brand-500">
              <div>
                <span>Current Phase</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">{activeWorkflow.currentStage}</p>
              </div>
              <div>
                <span>Completion Percentage</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-brand-900 dark:text-white">{activeWorkflow.progressPercent}%</span>
                  <div className="flex-1 h-1.5 bg-brand-100 rounded-full overflow-hidden">
                    <div className="h-1.5 bg-brand-700 rounded-full" style={{ width: `${activeWorkflow.progressPercent}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <span>Assigned Coordinator</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">{activeWorkflow.coordinator}</p>
              </div>
              <div>
                <span>Outstanding Amount</span>
                <p className="text-sm font-bold text-red-650 mt-1">₹{activeWorkflow.outstandingAmount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span>Open Design Requests</span>
                <p className="text-sm font-bold text-amber-600 mt-1">{activeWorkflow.designRequests} Requests</p>
              </div>
              <div>
                <span>Support Tickets</span>
                <p className="text-sm font-bold text-red-650 mt-1">{activeWorkflow.supportTickets} Tickets</p>
              </div>
            </div>
          </div>

          {/* Main workspace split */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Workspace Menu and Quick Actions */}
            <div className="space-y-6">
              <Card title="Workspace Tabs" subtitle="Workflow category filters">
                <div className="flex flex-col gap-1 text-xs font-bold text-left">
                  {([
                    { id: 'journey', label: 'Homeowner Journey' },
                    { id: 'approvals', label: 'Milestone Approvals' },
                    { id: 'dependencies', label: 'Active Dependencies' },
                    { id: 'automation', label: 'Automated Rules' },
                    { id: 'audit', label: 'Audit Log Timeline' },
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

              {/* Quick Actions */}
              <Card title="Administrative Actions" subtitle="Override client workflow events">
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                  <button onClick={() => triggerQuickAction('Upload Document')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Upload Doc
                  </button>
                  <button onClick={() => triggerQuickAction('Send Notification')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Send Notice
                  </button>
                  <button onClick={() => triggerQuickAction('Assign Coordinator')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Assign Coordinator
                  </button>
                  <button onClick={() => triggerQuickAction('Create Task')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Create Task
                  </button>
                </div>
              </Card>
            </div>

            {/* Central Workspace Tab Context */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TAB 1: Homeowner Journey */}
              {workspaceTab === 'journey' && (
                <Card title="Journey Timeline Stage Management" subtitle="Expand stages to override status locks and approve finishes choice">
                  <div className="space-y-4 pt-2">
                    {activeWorkflow.stages.map((stage) => {
                      const isLocked = stage.status === 'LOCKED';
                      
                      return (
                        <div key={stage.name} className="p-4 rounded-2xl bg-brand-50/20 border border-brand-100 dark:border-brand-850 dark:bg-brand-900/40 text-xs text-left space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-brand-900 dark:text-white flex items-center gap-1.5">
                              {isLocked ? <Lock className="h-3.5 w-3.5 text-brand-400" /> : <Unlock className="h-3.5 w-3.5 text-brand-700" />}
                              {stage.name}
                            </h4>
                            <StatusBadge label={stage.status} type={stage.status === 'COMPLETED' ? 'success' : stage.status === 'UNDER_REVIEW' ? 'warning' : 'neutral'} />
                          </div>

                          <p className="text-[11px] text-brand-500 font-medium leading-relaxed">
                            {stage.comments}
                          </p>

                          <div className="pt-2 border-t border-brand-100/50 dark:border-brand-850/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <input
                              type="text"
                              placeholder="Add stage action remarks/comments..."
                              value={stageComments[stage.name] || ''}
                              onChange={(e) => setStageComments({ ...stageComments, [stage.name]: e.target.value })}
                              className="flex-1 rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-[10px] outline-none dark:border-brand-800 dark:bg-brand-950/20"
                            />
                            <div className="flex gap-1.5 justify-end">
                              <button onClick={() => handleStageAction(stage.name, 'Unlock')} className="rounded-lg bg-brand-700 hover:bg-brand-800 text-white px-2 py-1.5 text-[10px] font-bold">
                                Unlock
                              </button>
                              <button onClick={() => handleStageAction(stage.name, 'Approve')} className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 text-[10px] font-bold">
                                Approve
                              </button>
                              <button onClick={() => handleStageAction(stage.name, 'Reject')} className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 text-[10px] font-bold">
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* TAB 2: Approvals */}
              {workspaceTab === 'approvals' && (
                <Card title="Approvals log" subtitle="Audit matrix of requested customization overrides">
                  <div className="space-y-3.5 pt-2">
                    {activeWorkflow.approvals.map((app, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-brand-100 dark:border-brand-850 text-xs font-semibold space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-brand-900 dark:text-white">{app.item}</span>
                          <StatusBadge label={app.status} type={app.status === 'Approved' ? 'success' : 'warning'} />
                        </div>
                        <div className="text-[10px] text-brand-450 space-y-0.5">
                          <p>Reviewer: {app.reviewer}</p>
                          <p>Date: {app.date}</p>
                          <p className="italic">Remarks: "{app.reason}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 3: Dependencies */}
              {workspaceTab === 'dependencies' && (
                <Card title="Outstanding Dependencies Tracker" subtitle="Critical workflow dependencies blocking progress transitions">
                  <div className="space-y-3 pt-2">
                    {activeWorkflow.dependencies.map((dep, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-brand-50/20 border border-brand-100 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="h-4.5 w-4.5 text-yellow-600 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-brand-900 dark:text-white">{dep.name}</h5>
                            <span className="text-[9px] text-brand-400 block mt-0.5">Category: {dep.category}</span>
                          </div>
                        </div>
                        <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-[9px] font-bold text-yellow-600 uppercase tracking-wide">
                          {dep.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 4: Automation */}
              {workspaceTab === 'automation' && (
                <Card title="Automated Event Triggers" subtitle="Recent action events triggered automatically by business rules">
                  <div className="space-y-3.5 pt-2 text-xs font-semibold">
                    {activeWorkflow.automations.map((aut, idx) => (
                      <div key={idx} className="p-3 rounded-2xl border border-brand-100 bg-white flex justify-between items-center">
                        <div className="flex items-start gap-2.5">
                          <Terminal className="h-4.5 w-4.5 text-brand-650 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-brand-900 dark:text-white">Trigger: {aut.trigger}</h5>
                            <p className="text-[10px] text-brand-450 mt-0.5">Action executed: {aut.action}</p>
                          </div>
                        </div>
                        <span className="text-[9px] text-brand-400 font-mono">{aut.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 5: Audit Log */}
              {workspaceTab === 'audit' && (
                <Card title="Audit Trail logs" subtitle="Complete chronological system actions records">
                  <div className="relative pl-4 border-l border-brand-200 dark:border-brand-850 space-y-4 py-2 ml-2 text-xs font-semibold">
                    {auditLogs.map((log, idx) => (
                      <div key={idx} className="relative pl-4">
                        <div className="absolute left-[-21px] top-1.5 h-2 w-2 rounded-full bg-brand-700" />
                        <span className="text-brand-900 dark:text-white">{log}</span>
                        <p className="text-[9px] text-brand-400 mt-0.5">Logged on: 13 July 2026, 12:30 PM</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            </div>

            {/* Right sidebar: Upcoming Actions feed */}
            <div className="space-y-6">
              <Card title="Upcoming Actions" subtitle="Action items suggested by workflow stages lockouts">
                <div className="space-y-3 pt-2 text-xs font-bold text-left">
                  <button onClick={() => triggerQuickAction('Unlock Flooring Stage')} className="w-full p-3 rounded-2xl border border-brand-150 hover:border-brand-350 bg-white text-brand-800 dark:bg-brand-900 dark:border-brand-800 flex items-center justify-between">
                    <span>Unlock Flooring</span>
                    <Unlock className="h-3.5 w-3.5 text-brand-500" />
                  </button>

                  <button onClick={() => triggerQuickAction('Generate Draw Invoice')} className="w-full p-3 rounded-2xl border border-brand-150 hover:border-brand-350 bg-white text-brand-800 dark:bg-brand-900 dark:border-brand-800 flex items-center justify-between">
                    <span>Generate Draw Invoice</span>
                    <DollarSign className="h-3.5 w-3.5 text-brand-500" />
                  </button>

                  <button onClick={() => triggerQuickAction('Send Selection Reminder')} className="w-full p-3 rounded-2xl border border-brand-150 hover:border-brand-350 bg-white text-brand-800 dark:bg-brand-900 dark:border-brand-800 flex items-center justify-between">
                    <span>Send Selections Reminder</span>
                    <Clock className="h-3.5 w-3.5 text-brand-500" />
                  </button>

                  <button onClick={() => triggerQuickAction('Approve Dining socket drawings')} className="w-full p-3 rounded-2xl border border-brand-150 hover:border-brand-350 bg-white text-brand-800 dark:bg-brand-900 dark:border-brand-800 flex items-center justify-between">
                    <span>Approve Drawing</span>
                    <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                  </button>
                </div>
              </Card>
            </div>

          </div>
        </div>
      ) : (
        /* ================= MAIN WORKFLOWS LIST VIEW ================= */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-left">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
                Post-Sales Workflows
              </h1>
              <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
                Master stage automation structures, task allocations, and progress states.
              </p>
            </div>
          </div>

          {/* 1. Top KPI Dashboard */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-8">
            <StatCard
              title="Active Workflows"
              value="3"
              icon={GitBranch}
              badge={<StatusBadge label="Running" type="success" />}
            />
            <StatCard
              title="Awaiting Approval"
              value="1"
              icon={Clock}
              badge={<StatusBadge label="CRM Action" type="warning" />}
            />
            <StatCard
              title="Phase Distribution"
              value="2 Flooring"
              icon={Layers}
              badge={<StatusBadge label="Top Category" type="info" />}
            />
            <StatCard
              title="Delayed Journeys"
              value="0"
              icon={AlertCircle}
              badge={<StatusBadge label="On Track" type="success" />}
            />
            <StatCard
              title="Upcoming Stage Trans"
              value="1"
              icon={Activity}
              badge={<StatusBadge label="SLA Standard" type="success" />}
            />
            <StatCard
              title="Pending Reviews"
              value="2"
              icon={Sparkles}
              badge={<StatusBadge label="Design Review" type="warning" />}
            />
            <StatCard
              title="Pending Payments"
              value="1"
              icon={DollarSign}
              badge={<StatusBadge label="Due Claims" type="warning" />}
            />
            <StatCard
              title="Support Dues"
              value="1"
              icon={MessageSquare}
              badge={<StatusBadge label="Snags Logged" type="warning" />}
            />
          </div>

          {/* 2 & 3. Search and Advanced Filters */}
          <Card title="Filter & Search Workflows Directory" subtitle="Advanced filter parameters to query workflow journeys">
            <div className="space-y-4 mt-2">
              {/* Global search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="Search buyer name, project name, villa plot, workflow ID, or coordinator..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/20 pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              {/* Advanced filter panels */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 text-[10px] font-bold">
                
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

                {/* Current Phase */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Current Phase</label>
                  <select
                    value={filterPhase}
                    onChange={(e) => setFilterPhase(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Phases</option>
                    <option value="Flooring">Flooring</option>
                    <option value="Construction">Construction</option>
                    <option value="Agreement">Agreement</option>
                  </select>
                </div>

                {/* Workflow Status */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Workflow Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Coordinator */}
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
                  </select>
                </div>

                {/* Construction Stage */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Construction Stage</label>
                  <select
                    value={filterConstruction}
                    onChange={(e) => setFilterConstruction(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Stages</option>
                    <option value="active">Under Construction</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Payment Status</label>
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Payments</option>
                    <option value="outstanding">Outstanding Amount Dues</option>
                    <option value="cleared">Cleared Dues</option>
                  </select>
                </div>

              </div>
            </div>
          </Card>

          {/* 4. Workflow List Table */}
          <Card title="Workflows Timeline Directory" subtitle="Master list of active stage engines">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-brand-550 font-bold uppercase tracking-wider font-mono">
                Querying Workflow Engines...
              </div>
            ) : filteredCRMWorkflows.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
                  <thead className="bg-brand-50/50 dark:bg-brand-950/30">
                    <tr className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
                      <th scope="col" className="px-4 py-3 text-left">Workflow ID</th>
                      <th scope="col" className="px-4 py-3 text-left">Buyer Details</th>
                      <th scope="col" className="px-4 py-3 text-left">Project & Unit</th>
                      <th scope="col" className="px-4 py-3 text-left">Current Phase</th>
                      <th scope="col" className="px-4 py-3 text-left">Completion %</th>
                      <th scope="col" className="px-4 py-3 text-left">Assigned Staff</th>
                      <th scope="col" className="px-4 py-3 text-left">Last Updated</th>
                      <th scope="col" className="px-4 py-3 text-left">Status</th>
                      <th scope="col" className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-850/40 text-xs text-brand-800 dark:text-brand-200 font-semibold">
                    {filteredCRMWorkflows.map((w) => (
                      <tr key={w.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-950/10">
                        <td className="px-4 py-3 text-left font-mono text-[10px] text-brand-450">{w.id}</td>
                        <td className="px-4 py-3 text-left font-bold text-brand-900 dark:text-white">{w.buyerName}</td>
                        <td className="px-4 py-3 text-left">
                          <div className="font-bold">{w.projectName}</div>
                          <div className="text-[10px] text-brand-450 mt-0.5">{w.unitName}</div>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-850 dark:text-brand-300">
                            {w.currentStage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2 max-w-[125px]">
                            <span className="font-bold shrink-0">{w.progressPercent}%</span>
                            <div className="flex-1 h-1 bg-brand-100 rounded-full overflow-hidden">
                              <div className="h-1 bg-brand-700 rounded-full" style={{ width: `${w.progressPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left">{w.coordinator}</td>
                        <td className="px-4 py-3 text-left">{w.lastUpdated}</td>
                        <td className="px-4 py-3 text-left">
                          <StatusBadge label={w.status?.toUpperCase()} type={w.status === 'completed' ? 'success' : w.status === 'active' ? 'info' : 'warning'} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedWorkflowId(w.id);
                                setWorkspaceTab('journey');
                              }}
                              className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900"
                              title="Workflow 360 Workspace"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFormStatus(w.status || 'draft');
                                setFormError(null);
                                setActiveWorkflowForEdit(w);
                              }}
                              className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900"
                              title="Edit status"
                            >
                              <Edit2 className="h-4 w-4" />
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
                title="No workflows matching filters"
                description="Adjust search tags or filter choices to query workflow engines."
                icon={FolderOpen}
              />
            )}
          </Card>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {activeWorkflowForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100 dark:border-brand-800">
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Transition Workflow Status</h3>
              <button onClick={() => setActiveWorkflowForEdit(null)} className="rounded-lg p-1 text-brand-400 hover:bg-brand-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {formError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-750 border border-red-200">
                  {formError}
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider">Target Unit</span>
                <p className="text-sm font-semibold text-brand-900 dark:text-white mt-0.5">
                  {activeWorkflowForEdit.buyerName} ({activeWorkflowForEdit.projectName} • {activeWorkflowForEdit.unitName})
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">State Transition</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active (In Progress)</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveWorkflowForEdit(null)}
                  className="rounded-xl bg-brand-100 hover:bg-brand-200 px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  {isSubmitting ? 'Transitioning...' : 'Transition Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkflowsPage;
