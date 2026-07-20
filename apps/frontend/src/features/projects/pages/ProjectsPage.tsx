import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  X,
  FolderOpen,
  AlertTriangle,
  Search,
  ArrowLeft,
  Hammer,
  FileText,
  Eye,
  Edit2,
  Trash2,
  Download,
  ShieldAlert,
  Briefcase,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { useProjects } from '../hooks/useProjects';
import { Project } from '../types/projects.types';

// Extended Project type for enterprise Project 360 Control Center
interface CRMProject extends Project {
  projectManager: string;
  crmCoordinator: string;
  designArchitect: string;
  financeExecutive: string;
  siteEngineer: string;
  legalCoordinator: string;
  unitsSold: number;
  unitsAvailable: number;
  delayedUnits: number;
  completionPercent: number;
  revenueSummary: { collections: number; outstanding: number };
  villas: {
    id: string;
    unitName: string;
    buyerName: string;
    stage: string;
    outstanding: number;
    tickets: number;
    designRequests: number;
  }[];
  milestones: {
    name: string;
    date: string;
    status: 'Completed' | 'In Progress' | 'Delayed' | 'Upcoming';
  }[];
  documents: {
    name: string;
    category: 'Approvals' | 'Drawings' | 'Govt' | 'NOC' | 'Certificates';
    date: string;
  }[];
}

export const ProjectsPage: React.FC = () => {
  const {
    filteredProjects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    currentPage,
    totalPages,
    onNextPage,
    onPreviousPage,
  } = useProjects();

  // Project 360° Workspace View state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'units' | 'construction' | 'finance' | 'team' | 'documents' | 'risks' | 'timeline'>('overview');

  // Search & Filters state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterManager, setFilterManager] = useState('all');
  const [filterCoordinator, setFilterCoordinator] = useState('all');
  const [filterHandover, setFilterHandover] = useState('all');

  // Edit / Create Form states
  const [activeProjectForEdit, setActiveProjectForEdit] = useState<CRMProject | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'planning' | 'completed'>('planning');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chronological project activity timeline logs
  const [projectLogs, setProjectLogs] = useState<string[]>([
    'Civil Inspector validated Stage 3 structural slab curing.',
    'Master structural drawings uploaded to government approvals portal.',
    'Sewerage board NOC copy received and archived.',
    'Site team scheduled plumbing conduits groove cutting for 18 July.',
  ]);

  // Extended project properties database mapping
  const crmProjects: CRMProject[] = useMemo(() => {
    return filteredProjects.map((p, idx): CRMProject => {
      const managers = ['Suresh Gowda', 'Meera Nair', 'Amit Roy'];
      const coordinators = ['Arun Kumar', 'Meera Nair', 'Suresh Gowda'];

      return {
        ...p,
        projectManager: managers[idx % managers.length],
        crmCoordinator: coordinators[idx % coordinators.length],
        designArchitect: 'Karan Grover & Associates',
        financeExecutive: 'Rajesh Shah',
        siteEngineer: 'Prasad Hegde',
        legalCoordinator: 'Venu Gopal & Co',
        unitsSold: idx === 0 ? 15 : 8,
        unitsAvailable: idx === 0 ? 5 : 4,
        delayedUnits: idx === 0 ? 1 : 0,
        completionPercent: idx === 0 ? 75 : 45,
        revenueSummary: {
          collections: idx === 0 ? 75000000 : 38000000,
          outstanding: idx === 0 ? 12000000 : 8500000,
        },
        villas: [
          { id: 'v1', unitName: 'Villa 14', buyerName: 'Jayanth S Raj', stage: 'Flooring', outstanding: 150000, tickets: 0, designRequests: 1 },
          { id: 'v2', unitName: 'Villa 15', buyerName: 'Rohan Sharma', stage: 'Construction', outstanding: 450000, tickets: 1, designRequests: 0 },
          { id: 'v3', unitName: 'Villa 16', buyerName: 'Anjali Menon', stage: 'Agreement', outstanding: 0, tickets: 0, designRequests: 2 },
        ],
        milestones: [
          { name: 'Excavation & Footings', date: '10 Feb 2026', status: 'Completed' },
          { name: 'Foundation Slab Casting', date: '25 Mar 2026', status: 'Completed' },
          { name: 'Superstructure Brickwork', date: '30 May 2026', status: 'Completed' },
          { name: 'Electrical & Plumbing', date: '18 Jul 2026', status: 'In Progress' },
          { name: 'Flooring & Painting', date: '10 Sep 2026', status: 'Upcoming' },
        ],
        documents: [
          { name: 'Plan_Sanction_Order_2026.pdf', category: 'Approvals', date: '15 Jan 2026' },
          { name: 'Master_Layout_Blueprint_Drawings.dwg', category: 'Drawings', date: '22 Feb 2026' },
          { name: 'Local_Fire_Safety_NOC.pdf', category: 'NOC', date: '10 Mar 2026' },
          { name: 'Municipal_Clearance_Certificate.pdf', category: 'Certificates', date: '08 Apr 2026' },
        ],
      };
    });
  }, [filteredProjects]);

  // Filters and Global search
  const filteredCRMProjects = useMemo(() => {
    return crmProjects.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.code?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.location?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.projectManager?.toLowerCase().includes(globalSearch.toLowerCase());

      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesManager = filterManager === 'all' || p.projectManager === filterManager;

      // Dummy stage/handover matches for mock context
      const matchesStage = filterStage === 'all' || (filterStage === 'construction' && p.completionPercent < 90);
      const matchesHandover = filterHandover === 'all' || (filterHandover === 'delayed' && p.delayedUnits > 0);

      return matchesSearch && matchesStatus && matchesManager && matchesStage && matchesHandover;
    });
  }, [crmProjects, globalSearch, filterStatus, filterManager, filterStage, filterHandover]);

  const activeProject = useMemo(() => {
    return crmProjects.find((p) => p.id === selectedProjectId);
  }, [crmProjects, selectedProjectId]);

  const handleOpenEdit = (project: CRMProject) => {
    setFormName(project.name || '');
    setFormCode(project.code || '');
    setFormLocation(project.location || '');
    setFormStatus(project.status || 'planning');
    setFormError(null);
    setActiveProjectForEdit(project);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode || !formLocation) {
      setFormError('Please fill in all the required fields.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createProject({
        name: formName,
        code: formCode,
        location: formLocation,
        status: formStatus,
      });
      setIsCreateOpen(false);
      setFormName('');
      setFormCode('');
      setFormLocation('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectForEdit) return;
    if (!formName || !formCode || !formLocation) {
      setFormError('Please fill in all the required fields.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await updateProject({
        id: activeProjectForEdit.id,
        data: {
          name: formName,
          code: formCode,
          location: formLocation,
          status: formStatus,
        },
      });
      setActiveProjectForEdit(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete);
      setProjectToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  const triggerQuickAction = (action: string) => {
    alert(`CRM Trigger: Quick Action [${action}] executed successfully.`);
    const newLog = `Quick Action: ${action} initiated by CRM coordinator.`;
    setProjectLogs([newLog, ...projectLogs]);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 360° WORKSPACE VIEW OR MAIN LIST VIEW */}
      {activeProject ? (
        /* ================= 360° PROJECT WORKSPACE ================= */
        <div className="space-y-6">
          {/* Header back navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedProjectId(null)}
              className="rounded-xl border border-brand-200 hover:bg-brand-50 p-2 text-brand-800 dark:bg-brand-900 dark:border-brand-850 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold font-serif text-brand-900 dark:text-white">Project 360° Control Center</h2>
              <p className="text-xs text-brand-450">Comprehensive enterprise project statistics, timeline checkpoints, and portfolios</p>
            </div>
          </div>

          {/* Project Summary Header Block */}
          <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-md dark:border-brand-850 dark:bg-brand-900 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-serif font-bold text-brand-900 dark:text-white">{activeProject.name}</h3>
                  <StatusBadge label={activeProject.status?.toUpperCase()} type={activeProject.status === 'completed' ? 'success' : 'info'} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-450 mt-1.5 font-semibold">
                  <span>Project Code: {activeProject.code}</span>
                  <span>•</span>
                  <span>Location: {activeProject.location}</span>
                  <span>•</span>
                  <span>Manager: {activeProject.projectManager}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => triggerQuickAction('Generate Project Report')} className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors">
                  Generate Report
                </button>
                <button onClick={() => triggerQuickAction('Send Notification to All Buyers')} className="rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-white px-4 py-2 text-xs font-semibold transition-colors">
                  Send Notice
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mt-6 pt-6 border-t border-brand-100 dark:border-brand-850 text-xs font-semibold text-brand-500">
              <div>
                <span>Total Project Units</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">{activeProject.totalUnits} Units</p>
              </div>
              <div>
                <span>Sold / Available</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">{activeProject.unitsSold} Sold / {activeProject.unitsAvailable} Avail</p>
              </div>
              <div>
                <span>Completion progress</span>
                <p className="text-sm font-bold text-brand-950 mt-1 dark:text-brand-200">{activeProject.completionPercent}% Completed</p>
              </div>
              <div>
                <span>Outstanding Collections</span>
                <p className="text-sm font-bold text-amber-650 mt-1">₹{activeProject.revenueSummary.outstanding.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span>Delayed Units / Risks</span>
                <p className="text-sm font-bold text-red-650 mt-1">{activeProject.delayedUnits} Delayed Units</p>
              </div>
            </div>
          </div>

          {/* Main workspace layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left side Workspace Menu and Quick Actions */}
            <div className="space-y-6">
              <Card title="Workspace Modules" subtitle="Project control navigation">
                <div className="flex flex-col gap-1 text-xs font-bold text-left">
                  {([
                    { id: 'overview', label: 'Overview' },
                    { id: 'units', label: 'Units & Buyers' },
                    { id: 'construction', label: 'Construction Progress' },
                    { id: 'finance', label: 'Finance Details' },
                    { id: 'team', label: 'Project Team' },
                    { id: 'documents', label: 'Documents & NOCs' },
                    { id: 'risks', label: 'Risk Analysis' },
                    { id: 'timeline', label: 'Timeline log' },
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

              {/* CRM Actions */}
              <Card title="Quick Actions" subtitle="Enterprise project events">
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                  <button onClick={() => triggerQuickAction('Assign Manager')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Assign Manager
                  </button>
                  <button onClick={() => triggerQuickAction('Upload Government NOC')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Upload Doc
                  </button>
                  <button onClick={() => triggerQuickAction('Generate Finance Sheet')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Finance Ledger
                  </button>
                  <button onClick={() => triggerQuickAction('View Buyer List')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    View Buyer List
                  </button>
                </div>
              </Card>
            </div>

            {/* Central details panel */}
            <div className="lg:col-span-2 space-y-6">
              
              {workspaceTab === 'overview' && (
                <Card title="Overview" subtitle="General project information and master plan outline">
                  <div className="space-y-4 pt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Master Plan Outline</span>
                      <p className="font-semibold text-brand-900 mt-1 dark:text-white leading-relaxed">
                        GoodEarth eco-sensitive residential layout featuring native landscaped central parks, community organic farms, rain-water harvesting recharge channels, and sustainable clay hollow brick villas.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-brand-100 dark:border-brand-850">
                      <div>
                        <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Commencement Date</span>
                        <p className="font-semibold text-brand-900 mt-1 dark:text-white">{activeProject.commencementDate || '01 January 2026'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Active Workflows</span>
                        <p className="font-semibold text-brand-900 mt-1 dark:text-white">{activeProject.activeWorkflows} Active</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'units' && (
                <Card title="Units & Villa Directory" subtitle="Status of individual villa plots">
                  <div className="space-y-3.5 pt-2">
                    {activeProject.villas.map((villa) => (
                      <div key={villa.id} className="p-3 rounded-2xl bg-brand-50/20 border border-brand-100 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <h4 className="font-bold text-brand-900 dark:text-white">{villa.unitName} — {villa.buyerName}</h4>
                          <div className="flex gap-3 text-[10px] text-brand-450 mt-1">
                            <span>Stage: {villa.stage}</span>
                            <span>•</span>
                            <span>Outstanding: ₹{villa.outstanding.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {villa.tickets > 0 && <span className="bg-red-500/10 text-red-700 px-2 py-0.5 rounded text-[9px] font-bold">{villa.tickets} Open Snags</span>}
                          {villa.designRequests > 0 && <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-[9px] font-bold">{villa.designRequests} Upgrades</span>}
                          <button
                            onClick={() => {
                              alert(`Navigating to buyer profile copy of ${villa.buyerName}...`);
                            }}
                            className="rounded-lg bg-brand-700 hover:bg-brand-800 text-white px-2.5 py-1 text-[9px] font-bold"
                          >
                            View 360°
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {workspaceTab === 'construction' && (
                <Card title="Construction Milestones Checklist" subtitle="Chronological progress checks">
                  <div className="relative pl-6 ml-2 border-l border-brand-200 dark:border-brand-850 space-y-6 py-2 text-xs">
                    {activeProject.milestones.map((milestone, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className={`absolute left-[-31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-white flex items-center justify-center ${
                          milestone.status === 'Completed'
                            ? 'bg-green-600'
                            : milestone.status === 'In Progress'
                              ? 'bg-yellow-500'
                              : 'bg-brand-100'
                        }`}>
                          {milestone.status === 'Completed' && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex items-baseline justify-between gap-4 font-semibold">
                          <span className="text-brand-900 dark:text-white">{milestone.name}</span>
                          <span className="text-[9px] text-brand-400 font-mono">{milestone.date}</span>
                        </div>
                        <p className="text-[10px] text-brand-450 mt-1">Status: {milestone.status}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {workspaceTab === 'finance' && (
                <Card title="Revenue & Finance Summary" subtitle="Collections statement metrics">
                  <div className="space-y-4 pt-2 text-xs font-semibold">
                    <div className="flex justify-between border-b border-brand-100 pb-2">
                      <span className="text-brand-500">Total Bookings Value:</span>
                      <span className="text-brand-900 dark:text-white">₹{activeProject.revenueSummary.collections.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-100 pb-2">
                      <span className="text-brand-500">Outstanding milestone collection:</span>
                      <span className="text-brand-900 dark:text-white">₹{activeProject.revenueSummary.outstanding.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-500">Total Invoiced Amount:</span>
                      <span className="text-brand-700">₹{(activeProject.revenueSummary.collections + activeProject.revenueSummary.outstanding).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'team' && (
                <Card title="Project Portfolios Team" subtitle="Staff allocated to active project workflows">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs font-semibold">
                    <div className="p-3 rounded-2xl bg-brand-50/20 border border-brand-100">
                      <span className="text-[9px] text-brand-400 uppercase tracking-wider block font-mono">Project Manager</span>
                      <h4 className="text-sm font-bold text-brand-900 mt-1">{activeProject.projectManager}</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-50/20 border border-brand-100">
                      <span className="text-[9px] text-brand-400 uppercase tracking-wider block font-mono">CRM Coordinator</span>
                      <h4 className="text-sm font-bold text-brand-900 mt-1">{activeProject.crmCoordinator}</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-50/20 border border-brand-100">
                      <span className="text-[9px] text-brand-400 uppercase tracking-wider block font-mono">Design Architect</span>
                      <h4 className="text-sm font-bold text-brand-900 mt-1">{activeProject.designArchitect}</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-50/20 border border-brand-100">
                      <span className="text-[9px] text-brand-400 uppercase tracking-wider block font-mono">Site Engineer</span>
                      <h4 className="text-sm font-bold text-brand-900 mt-1">{activeProject.siteEngineer}</h4>
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'documents' && (
                <Card title="Government Approvals & Master Drawings" subtitle="Clearances NOC files list">
                  <div className="space-y-3 pt-2">
                    {activeProject.documents.map((doc, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white border border-brand-100 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4.5 w-4.5 text-brand-500" />
                          <div>
                            <h4 className="font-bold text-brand-900">{doc.name}</h4>
                            <span className="text-[9px] text-brand-400 block mt-0.5">Category: {doc.category} | Created: {doc.date}</span>
                          </div>
                        </div>
                        <button onClick={() => triggerQuickAction('Download document')} className="text-brand-500 hover:text-brand-850">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {workspaceTab === 'risks' && (
                <Card title="Risk Analysis & Mitigation Plan" subtitle="Active risks and delays tracker">
                  <div className="space-y-3 pt-2">
                    {activeProject.delayedUnits > 0 && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs">
                        <AlertTriangle className="h-5 w-5 text-red-650 shrink-0" />
                        <div>
                          <h5 className="font-bold text-red-900">Construction reschedules logged</h5>
                          <p className="text-[10px] text-red-750 mt-1">1 unit currently delayed due to late finishes choices lock-in. Material Procurement is on hold.</p>
                        </div>
                      </div>
                    )}
                    <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-250 flex items-start gap-3 text-xs">
                      <ShieldAlert className="h-5 w-5 text-yellow-650 shrink-0" />
                      <div>
                        <h5 className="font-bold text-yellow-900">Pending payment invoices warning</h5>
                        <p className="text-[10px] text-yellow-750 mt-1">₹{activeProject.revenueSummary.outstanding.toLocaleString('en-IN')} outstanding draw clearance is overdue.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {workspaceTab === 'timeline' && (
                <Card title="Detailed Activity History Logs" subtitle="System records audit trail">
                  <div className="relative pl-4 border-l border-brand-200 mt-2 text-xs font-semibold space-y-4">
                    <div className="relative pl-4">
                      <div className="absolute left-[-21px] top-1.5 h-2 w-2 rounded-full bg-brand-700" />
                      <span>Project code {activeProject.code} registered under Post-Sales system.</span>
                    </div>
                  </div>
                </Card>
              )}

            </div>

            {/* Right side activity feed */}
            <div className="space-y-6">
              <Card title="Recent Activity Feed" subtitle="Enterprise chronological events tracker">
                <div className="relative border-l border-brand-200 pl-4 space-y-5 py-2 ml-2 text-xs">
                  {projectLogs.map((log, index) => (
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
        /* ================= MAIN PROJECTS LIST VIEW ================= */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
                Projects Management
              </h1>
              <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
                CRM-mastered project structures and villa unit configurations.
              </p>
            </div>
            <div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                <Plus className="h-4 w-4" />
                Add Project
              </button>
            </div>
          </div>

          {/* 1. Dashboard KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-7">
            <StatCard
              title="Total Projects"
              value="3"
              icon={Building}
              badge={<StatusBadge label="Synced" type="info" />}
            />
            <StatCard
              title="Total Units"
              value="60"
              icon={Building}
              badge={<StatusBadge label="All Villa plots" type="success" />}
            />
            <StatCard
              title="Units Sold"
              value="48"
              icon={UserCheck}
              badge={<StatusBadge label="Cleared" type="success" />}
            />
            <StatCard
              title="Units Available"
              value="12"
              icon={FolderOpen}
              badge={<StatusBadge label="Open Booking" type="info" />}
            />
            <StatCard
              title="Under Construction"
              value="35"
              icon={Hammer}
              badge={<StatusBadge label="Active Build" type="warning" />}
            />
            <StatCard
              title="Delayed Units"
              value="1"
              icon={AlertTriangle}
              badge={<StatusBadge label="Critical Risk" type="warning" />}
            />
            <StatCard
              title="Upcoming Handovers"
              value="8"
              icon={Briefcase}
              badge={<StatusBadge label="Target 2026" type="success" />}
            />
          </div>

          {/* 2 & 3. Search and Advanced Filters */}
          <Card title="Filter & Search Projects Directory" subtitle="Advanced filter parameters to query project portfolios">
            <div className="space-y-4 mt-2">
              {/* Global search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="Search project name, location, villa number, buyer name, or project manager..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/20 pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              {/* Advanced filter panels */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-[10px] font-bold">
                
                {/* Project Status */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Project Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Construction Stage */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Construction Stage</label>
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Stages</option>
                    <option value="construction">Under Construction</option>
                    <option value="finished">Finishing Completed</option>
                  </select>
                </div>

                {/* Project Manager */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Project Manager</label>
                  <select
                    value={filterManager}
                    onChange={(e) => setFilterManager(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Managers</option>
                    <option value="Suresh Gowda">Suresh Gowda</option>
                    <option value="Meera Nair">Meera Nair</option>
                    <option value="Amit Roy">Amit Roy</option>
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
                    <option value="all">All Coordinators</option>
                    <option value="Arun Kumar">Arun Kumar</option>
                    <option value="Meera Nair">Meera Nair</option>
                  </select>
                </div>

                {/* Handover Status */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Handover Status</label>
                  <select
                    value={filterHandover}
                    onChange={(e) => setFilterHandover(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Handovers</option>
                    <option value="delayed">Delayed Units Only</option>
                    <option value="ontrack">On Track</option>
                  </select>
                </div>

              </div>
            </div>
          </Card>

          {/* 4. Project List table */}
          <Card title="Project Portfolios Directory" subtitle="Master list of registered developer projects">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-brand-550 font-bold uppercase tracking-wider font-mono">
                Querying Projects...
              </div>
            ) : filteredCRMProjects.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
                  <thead className="bg-brand-50/50 dark:bg-brand-950/30">
                    <tr className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
                      <th scope="col" className="px-4 py-3 text-left">Project Details</th>
                      <th scope="col" className="px-4 py-3 text-left">Progress completion</th>
                      <th scope="col" className="px-4 py-3 text-left">Total Units</th>
                      <th scope="col" className="px-4 py-3 text-left">Sold / Available</th>
                      <th scope="col" className="px-4 py-3 text-left">Delayed</th>
                      <th scope="col" className="px-4 py-3 text-left">Project Manager</th>
                      <th scope="col" className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-850/40 text-xs text-brand-800 dark:text-brand-200 font-semibold">
                    {filteredCRMProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-950/10">
                        <td className="px-4 py-3 text-left">
                          <div className="font-bold text-brand-900 dark:text-white">{p.name}</div>
                          <div className="text-[10px] text-brand-450 mt-0.5">Code: {p.code} | Location: {p.location}</div>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2 max-w-[125px]">
                            <span className="font-bold shrink-0">{p.completionPercent}%</span>
                            <div className="flex-1 h-1 bg-brand-100 rounded-full overflow-hidden">
                              <div className="h-1 bg-brand-700 rounded-full" style={{ width: `${p.completionPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left">{p.totalUnits} Units</td>
                        <td className="px-4 py-3 text-left">{p.unitsSold} Sold / {p.unitsAvailable} Available</td>
                        <td className="px-4 py-3 text-left">
                          {p.delayedUnits > 0 ? (
                            <span className="text-red-650 font-bold">{p.delayedUnits} Delayed</span>
                          ) : (
                            <span className="text-green-700 font-bold">On Track</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-left">{p.projectManager}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedProjectId(p.id);
                                setWorkspaceTab('overview');
                              }}
                              className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900"
                              title="Project 360 Workspace"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleOpenEdit(p)} className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900" title="Edit details">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setProjectToDelete(p.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-750" title="Remove project">
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
                title="No projects matching filters"
                description="Adjust search tags or filter choices to query project accounts."
                icon={FolderOpen}
              />
            )}
          </Card>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100 dark:border-brand-800">
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Add New Project Portfolio</h3>
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
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Project Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                >
                  <option value="planning">Planning</option>
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
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {activeProjectForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100 dark:border-brand-800">
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Modify Project Portfolio</h3>
              <button onClick={() => setActiveProjectForEdit(null)} className="rounded-lg p-1 text-brand-400 hover:bg-brand-100">
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
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Project Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveProjectForEdit(null)}
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
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center gap-3 pb-3 border-b border-brand-100 dark:border-brand-800">
              <AlertTriangle className="h-6 w-6 text-red-650" />
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Delete Project Confirmation</h3>
            </div>
            <p className="mt-4 text-xs text-brand-500">
              Are you sure you want to permanently delete this project? Doing so will invalidate all associated workflows and is irreversible.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="rounded-xl bg-brand-100 hover:bg-brand-200 px-4 py-2.5 text-xs font-semibold"
              >
                No, Keep Project
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm"
              >
                Yes, Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectsPage;
