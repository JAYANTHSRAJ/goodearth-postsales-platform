import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileCheck,
  Clock,
  FolderOpen,
  Plus,
  X,
  Search,
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Archive,
  Upload,
  History,
  Share2,
  FileCode,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { useDocuments } from '../hooks/useDocuments';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../services/api';

// Extended Document type for enterprise Document Management Center
interface CRMDocument {
  id: string;
  fileName: string;
  buyerName: string;
  projectName: string;
  unitName: string;
  documentType: string;
  version: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  lastModified: string;
  owner: string;
  expiryDate: string;
  mimeType: string;
  history: { version: string; date: string; author: string; changes: string }[];
  approvals: { status: string; date: string; reviewer: string; comments: string }[];
  sharing: { sharedWithClient: boolean; downloadHistory: { user: string; date: string }[]; accessLogs: string[] };
  auditLogs: string[];
}

export const DocumentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isClient = user?.role === 'buyer';

  const {
    filteredDocuments,
    isLoading,
    currentPage,
    totalPages,
    onNextPage,
    onPreviousPage,
    createDocument,
    updateStatus,
  } = useDocuments();

  // Selected Document ID for 360 Workspace
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'history' | 'approvals' | 'sharing' | 'audit'>('overview');

  // Search & Filters state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterDocType, setFilterDocType] = useState('all');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('all');
  const [filterUploadedBy, setFilterUploadedBy] = useState('all');
  const [filterBuyer, setFilterBuyer] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

  // Preview state inside workspace
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Upload Document Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [documentType, setDocumentType] = useState('AGREEMENT');
  const [workflowId, setWorkflowId] = useState('');
  const [workDriveFileId, setWorkDriveFileId] = useState('');
  const [fileSize] = useState(1024 * 1024 * 2); // default 2MB
  const [mimeType, setMimeType] = useState('application/pdf');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load active workflows for the select dropdown
  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows-list-docs-center'],
    queryFn: () => api.get<any[]>('/workflows'),
    enabled: isUploadOpen,
  });

  // Local state to simulate version uploads and overrides
  const [localAuditLogs, setLocalAuditLogs] = useState<string[]>([
    'Document uploaded to Zoho WorkDrive vault.',
    'System generated SHA-256 digital signature hash.',
    'Sharing lock disabled; client portal access granted.',
  ]);

  // Extended Document database mapper
  const crmDocuments: CRMDocument[] = useMemo(() => {
    return filteredDocuments.map((d, idx): CRMDocument => {
      const owners = ['Arun Kumar', 'Meera Nair', 'Suresh Gowda'];
      const mimes = ['application/pdf', 'image/jpeg', 'application/octet-stream', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      const defaultType = (d.type || 'agreement').toUpperCase();
      let mappedMime = mimes[idx % mimes.length];
      if (defaultType === 'DRAWING') mappedMime = 'application/octet-stream'; // dwg mock

      return {
        id: d.id || `doc-${idx}`,
        fileName: d.name || 'sale_agreement_draft.pdf',
        buyerName: 'Jayanth S Raj',
        projectName: 'GoodEarth Malhar',
        unitName: 'Villa 14',
        documentType: defaultType,
        version: idx === 0 ? 'v2.1' : 'v1.0',
        status: (d.status || 'pending').toUpperCase() as 'VERIFIED' | 'PENDING' | 'REJECTED',
        lastModified: d.uploadedAt || '13 Jul 2026',
        owner: owners[idx % owners.length],
        expiryDate: '12 Jan 2027',
        mimeType: mappedMime,
        history: [
          { version: 'v2.1', date: '13 Jul 2026', author: 'Meera Nair', changes: 'Updated builder schedule layout table.' },
          { version: 'v2.0', date: '10 Jun 2026', author: 'Arun Kumar', changes: 'First draft reviewed by legal board.' },
        ],
        approvals: [
          { status: (d.status || 'pending').toUpperCase(), date: '13 Jul 2026', reviewer: 'Meera Nair', comments: 'Pending client signature checks.' },
        ],
        sharing: {
          sharedWithClient: true,
          downloadHistory: [
            { user: 'Jayanth S Raj', date: '13 Jul 2026, 11:20 AM' },
          ],
          accessLogs: [
            'Client accessed document preview at 11:15 AM.',
          ],
        },
        auditLogs: localAuditLogs,
      };
    });
  }, [filteredDocuments, localAuditLogs]);

  // Client search and filter queries
  const filteredCRMDocuments = useMemo(() => {
    return crmDocuments.filter((doc) => {
      const matchesSearch =
        doc.fileName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        doc.buyerName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        doc.projectName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        doc.unitName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(globalSearch.toLowerCase());

      const matchesProject = filterProject === 'all' || doc.projectName === filterProject;
      const matchesDocType = filterDocType === 'all' || doc.documentType === filterDocType;
      const matchesApproval = filterApprovalStatus === 'all' || doc.status === filterApprovalStatus;
      const matchesUploadedBy = filterUploadedBy === 'all' || doc.owner === filterUploadedBy;
      const matchesBuyer = filterBuyer === 'all' || doc.buyerName === filterBuyer;

      return (
        matchesSearch &&
        matchesProject &&
        matchesDocType &&
        matchesApproval &&
        matchesUploadedBy &&
        matchesBuyer
      );
    });
  }, [crmDocuments, globalSearch, filterProject, filterDocType, filterApprovalStatus, filterUploadedBy, filterBuyer]);

  const activeDoc = useMemo(() => {
    return crmDocuments.find((d) => d.id === selectedDocId);
  }, [crmDocuments, selectedDocId]);

  const handleVerifyAction = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!activeDoc) return;
    try {
      await updateStatus({ id: activeDoc.id, status });
      alert(`Document status updated to [${status}].`);
      const newLog = `Document status override: changed to ${status}.`;
      setLocalAuditLogs([newLog, ...localAuditLogs]);
    } catch (err: any) {
      alert(err.message || 'Failed to update document status.');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !workflowId || !workDriveFileId) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createDocument({
        workflowId,
        workDriveFileId,
        fileName,
        documentType: documentType.toUpperCase(),
        fileSize,
        mimeType,
      });
      setIsUploadOpen(false);
      setFileName('');
      setWorkDriveFileId('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to link document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag and drop mock
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    alert('File dropped successfully! Triggering upload queue...');
    const newLog = `New version version draft uploaded via Drag and Drop interface.`;
    setLocalAuditLogs([newLog, ...localAuditLogs]);
  };

  const triggerQuickAction = (action: string) => {
    alert(`CRM Documents Operations: Action [${action}] executed successfully.`);
    const newLog = `Quick Action: ${action} initiated.`;
    setLocalAuditLogs([newLog, ...localAuditLogs]);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 360° WORKSPACE OR MAIN LIST VIEW */}
      {activeDoc ? (
        /* ================= 360° DOCUMENT WORKSPACE ================= */
        <div className="space-y-6">
          {/* Header back navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDocId(null)}
              className="rounded-xl border border-brand-200 hover:bg-brand-50 p-2 text-brand-800 dark:bg-brand-900 dark:border-brand-850 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold font-serif text-brand-900 dark:text-white">Document 360° Control Center</h2>
              <p className="text-xs text-brand-450">Review version histories, access logs, drag-and-drop modifications, and client portal sharing settings</p>
            </div>
          </div>

          {/* Document Summary Header */}
          <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-md dark:border-brand-850 dark:bg-brand-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-serif font-bold text-brand-900 dark:text-white">{activeDoc.fileName}</h3>
                  <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-bold uppercase">{activeDoc.version}</span>
                  <StatusBadge label={activeDoc.status} type={activeDoc.status === 'VERIFIED' ? 'success' : 'warning'} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-450 mt-1.5 font-semibold">
                  <span>Buyer Name: {activeDoc.buyerName}</span>
                  <span>•</span>
                  <span>Project Name: {activeDoc.projectName}</span>
                  <span>•</span>
                  <span>Villa plot: {activeDoc.unitName}</span>
                  <span>•</span>
                  <span>Category: {activeDoc.documentType}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPreviewMode(!previewMode)} className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors">
                  {previewMode ? 'Hide Preview' : 'Interactive Preview'}
                </button>
                <button onClick={() => triggerQuickAction('Download Document Archive')} className="rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 dark:text-white px-4 py-2 text-xs font-semibold transition-colors">
                  Download
                </button>
              </div>
            </div>
          </div>

          {/* Preview panel (PDF, Images, DWG CAD, DOCX, XLSX preview simulator) */}
          {previewMode && (
            <div className="rounded-3xl border border-brand-200 bg-brand-50/30 p-6 dark:border-brand-850 dark:bg-brand-900/50">
              <div className="flex justify-between items-center pb-3 border-b border-brand-100">
                <h4 className="text-sm font-bold text-brand-900 flex items-center gap-2">
                  <FileCode className="h-4.5 w-4.5 text-brand-650" />
                  Interactive Viewer Preview [{activeDoc.mimeType}]
                </h4>
                <button onClick={() => setPreviewMode(false)} className="text-brand-450 hover:text-brand-700">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* MOCK PREVIEW VISUALIZER */}
              <div className="mt-4 h-64 bg-white dark:bg-brand-950 border border-brand-100 rounded-2xl flex flex-col items-center justify-center text-center text-xs p-6 shadow-inner">
                {activeDoc.mimeType.includes('pdf') ? (
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 text-brand-500 mx-auto" />
                    <p className="font-bold text-brand-900">PDF Document Viewer</p>
                    <p className="text-[10px] text-brand-450 max-w-sm">Mock rendering page 1 of 4. Sale Agreement deeds schedules locks compliance.</p>
                  </div>
                ) : activeDoc.mimeType.includes('image') ? (
                  <div className="space-y-2">
                    <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80" alt="Blueprint" className="h-32 object-contain mx-auto rounded-lg" />
                    <p className="font-bold text-brand-900">Image Preview</p>
                  </div>
                ) : activeDoc.mimeType.includes('octet-stream') ? (
                  <div className="space-y-2">
                    <FileCode className="h-10 w-10 text-brand-500 mx-auto" />
                    <p className="font-bold text-brand-900">DWG CAD Blueprint Viewer</p>
                    <p className="text-[10px] text-brand-450">CAD room grids, window placements, electrical sockets layer maps.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 text-brand-500 mx-auto" />
                    <p className="font-bold text-brand-900">Office Document Preview (DOCX / XLSX)</p>
                    <p className="text-[10px] text-brand-450">Milestone calculation spreadsheet sheets matrix.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main workspace splits */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left side Workspace Menu and Quick Actions */}
            <div className="space-y-6">
              <Card title="Workspace Tabs" subtitle="Document category filters">
                <div className="flex flex-col gap-1 text-xs font-bold text-left">
                  {([
                    { id: 'overview', label: 'Overview Details' },
                    { id: 'history', label: 'Version Revisions' },
                    { id: 'approvals', label: 'Milestone Approvals' },
                    { id: 'sharing', label: 'Access Sharing Logs' },
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
              <Card title="Reconciliation Actions" subtitle="Audit log dispatchers">
                <div className="flex flex-col gap-2 text-xs font-bold text-left">
                  <button onClick={() => handleVerifyAction('VERIFIED')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-800 dark:text-white">
                    <span>Approve Document</span>
                    <FileCheck className="h-3.5 w-3.5 text-green-600" />
                  </button>
                  <button onClick={() => handleVerifyAction('REJECTED')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-800 dark:text-white">
                    <span>Reject Document</span>
                    <AlertTriangle className="h-3.5 w-3.5 text-red-650" />
                  </button>
                  <button onClick={() => triggerQuickAction('Toggle Client Access Shared')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-800 dark:text-white">
                    <span>Share with Client</span>
                    <Share2 className="h-3.5 w-3.5 text-brand-500" />
                  </button>
                  <button onClick={() => triggerQuickAction('Archive Vault')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-800 dark:text-white">
                    <span>Archive Document</span>
                    <Archive className="h-3.5 w-3.5 text-brand-500" />
                  </button>
                </div>
              </Card>
            </div>

            {/* Central Workspace Tab context */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TAB 1: Overview */}
              {workspaceTab === 'overview' && (
                <Card title="Overview Details" subtitle="Registration metadata specifications">
                  <div className="space-y-4 pt-2 text-xs font-semibold text-brand-550">
                    <div className="flex justify-between border-b border-brand-100 pb-2">
                      <span className="text-brand-500">Document Owner Staff:</span>
                      <span className="text-brand-900 dark:text-white">{activeDoc.owner}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-100 pb-2">
                      <span className="text-brand-500">Active Version:</span>
                      <span className="text-brand-900 dark:text-white">{activeDoc.version}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-100 pb-2">
                      <span className="text-brand-500">Expiry Date:</span>
                      <span className="text-brand-900 dark:text-white">{activeDoc.expiryDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-500">MIME Content Type:</span>
                      <span className="text-brand-700">{activeDoc.mimeType}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* TAB 2: Version History */}
              {workspaceTab === 'history' && (
                <Card title="Version History Revisions" subtitle="Audit history checklist drafts">
                  <div className="space-y-4 pt-2 text-xs font-semibold">
                    {activeDoc.history.map((rev, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-brand-100 space-y-2 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-brand-900">Version: {rev.version}</span>
                          <span className="text-[10px] text-brand-400 font-mono">{rev.date}</span>
                        </div>
                        <p className="text-[10px] text-brand-450">Modified by: {rev.author}</p>
                        <p className="text-[10px] text-brand-450 italic mt-0.5">Remarks: "{rev.changes}"</p>
                      </div>
                    ))}
                    <button onClick={() => triggerQuickAction('Compare Versions Layout')} className="w-full py-2.5 rounded-xl border border-brand-200 hover:border-brand-400 bg-white text-center font-bold">
                      Compare Active Versions
                    </button>
                  </div>
                </Card>
              )}

              {/* TAB 3: Approvals */}
              {workspaceTab === 'approvals' && (
                <Card title="Approvals Checkpoints status" subtitle="Audited review milestones status">
                  <div className="space-y-3.5 pt-2 text-xs font-semibold">
                    {activeDoc.approvals.map((app, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-brand-100 space-y-2 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-brand-900">Reviewer: {app.reviewer}</span>
                          <StatusBadge label={app.status} type={app.status === 'VERIFIED' ? 'success' : 'warning'} />
                        </div>
                        <p className="text-[10px] text-brand-450 font-mono">Date: {app.date}</p>
                        <p className="text-[10px] text-brand-450 italic mt-0.5">Comments: "{app.comments}"</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 4: Sharing */}
              {workspaceTab === 'sharing' && (
                <Card title="Access Sharing Settings" subtitle="Download audit checkpoints logs">
                  <div className="space-y-4 pt-2 text-xs font-semibold">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-50/20 border border-brand-100">
                      <span>Shared With Client Portal:</span>
                      <span className="text-green-700 font-bold">Access Unlocked</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-brand-900 mb-2">Download History Logs</h4>
                      {activeDoc.sharing.downloadHistory.map((dl, idx) => (
                        <div key={idx} className="p-3 rounded-2xl border border-brand-100 bg-white text-[10px] text-brand-450">
                          User {dl.user} downloaded file on {dl.date}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* TAB 5: Audit Log */}
              {workspaceTab === 'audit' && (
                <Card title="Document Audit logs history" subtitle="Chronological vault events">
                  <div className="relative pl-4 border-l border-brand-200 space-y-4 py-2 ml-2 text-xs font-semibold">
                    {activeDoc.auditLogs.map((log, idx) => (
                      <div key={idx} className="relative pl-4">
                        <div className="absolute left-[-21px] top-1.5 h-2 w-2 rounded-full bg-brand-700" />
                        <span className="text-brand-900 dark:text-white">{log}</span>
                        <p className="text-[9px] text-brand-400 mt-0.5">Logged today, 05:00 PM</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            </div>

            {/* Right sidebar: Drag and drop uploads center */}
            <div className="space-y-6">
              <Card title="Drag & Drop Upload Center" subtitle="Direct revision uploads">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => triggerQuickAction('Browse and Upload Revision File')}
                  className="p-8 rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 flex flex-col items-center justify-center gap-2 cursor-pointer text-center text-xs font-bold"
                >
                  <Upload className="h-8 w-8 text-brand-400" />
                  <span>Drag and Drop New Version</span>
                  <span className="text-[9px] text-brand-400 font-medium">Supports PDF, Images, DWG CAD, DOCX, XLSX</span>
                </div>
              </Card>
            </div>

          </div>
        </div>
      ) : (
        /* ================= MAIN DOCUMENTS MODULE LIST VIEW ================= */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-left">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
                Documents Management Center
              </h1>
              <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
                Zoho WorkDrive vault integrations, digital signature verification, and homeowner agreements.
              </p>
            </div>
            {!isClient && (
              <div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500"
                >
                  <Plus className="h-4 w-4" />
                  Link New Document
                </button>
              </div>
            )}
          </div>

          {/* 1. TOP KPI Dashboard */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-8">
            <StatCard
              title="Total Documents"
              value="4"
              icon={FileText}
              badge={<StatusBadge label="Vault Scope" type="info" />}
            />
            <StatCard
              title="Pending Approvals"
              value="1"
              icon={Clock}
              badge={<StatusBadge label="Review Needed" type="warning" />}
            />
            <StatCard
              title="Expiring Documents"
              value="0"
              icon={AlertTriangle}
              badge={<StatusBadge label="All Valid" type="success" />}
            />
            <StatCard
              title="Uploaded Today"
              value="2"
              icon={Upload}
              badge={<StatusBadge label="Active sync" type="success" />}
            />
            <StatCard
              title="Missing Documents"
              value="0"
              icon={ShieldAlert}
              badge={<StatusBadge label="Standard OK" type="success" />}
            />
            <StatCard
              title="Digitally Signed"
              value="3"
              icon={FileCheck}
              badge={<StatusBadge label="SHA-256 eSign" type="success" />}
            />
            <StatCard
              title="Shared With Clients"
              value="4"
              icon={Share2}
              badge={<StatusBadge label="Portal Sync" type="success" />}
            />
            <StatCard
              title="Storage Utilization"
              value="14 MB"
              icon={History}
              badge={<StatusBadge label="Zoho Drive" type="info" />}
            />
          </div>

          {/* 2 & 3. Search and Advanced Filters */}
          <Card title="Filter & Search Documents Vault" subtitle="Advanced filter parameters to query Zoho archives">
            <div className="space-y-4 mt-2">
              {/* Global search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="Search buyer name, project name, villa plot unit, document name, or document type..."
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

                {/* Document Type */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Document Type</label>
                  <select
                    value={filterDocType}
                    onChange={(e) => setFilterDocType(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Categories</option>
                    <option value="AGREEMENT">Agreement</option>
                    <option value="NOC">NOC</option>
                    <option value="RECEIPT">Receipt</option>
                    <option value="DRAWING">Blueprint Drawing</option>
                  </select>
                </div>

                {/* Approval Status */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Approval Status</label>
                  <select
                    value={filterApprovalStatus}
                    onChange={(e) => setFilterApprovalStatus(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Statuses</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {/* Uploaded By */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Uploaded By</label>
                  <select
                    value={filterUploadedBy}
                    onChange={(e) => setFilterUploadedBy(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Staff</option>
                    <option value="Arun Kumar">Arun Kumar</option>
                    <option value="Meera Nair">Meera Nair</option>
                  </select>
                </div>

                {/* Buyer */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Buyer</label>
                  <select
                    value={filterBuyer}
                    onChange={(e) => setFilterBuyer(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Buyers</option>
                    <option value="Jayanth S Raj">Jayanth S Raj</option>
                    <option value="Rohan Sharma">Rohan Sharma</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Date Range</label>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Uploaded Today</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

              </div>
            </div>
          </Card>

          {/* 4. Document Table */}
          <Card title="Documents Vault Directory" subtitle="Master list of registered Post-Sales documents">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-brand-550 font-bold uppercase tracking-wider font-mono">
                Querying Zoho vault...
              </div>
            ) : filteredCRMDocuments.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
                  <thead className="bg-brand-50/50 dark:bg-brand-950/30">
                    <tr className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
                      <th scope="col" className="px-4 py-3 text-left">Document Name</th>
                      <th scope="col" className="px-4 py-3 text-left">Buyer</th>
                      <th scope="col" className="px-4 py-3 text-left">Project</th>
                      <th scope="col" className="px-4 py-3 text-left">Villa plot</th>
                      <th scope="col" className="px-4 py-3 text-left">Category</th>
                      <th scope="col" className="px-4 py-3 text-left">Version</th>
                      <th scope="col" className="px-4 py-3 text-left">Approval Status</th>
                      <th scope="col" className="px-4 py-3 text-left">Last Modified</th>
                      <th scope="col" className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-850/40 text-xs text-brand-800 dark:text-brand-200 font-semibold">
                    {filteredCRMDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-950/10">
                        <td className="px-4 py-3 text-left font-bold text-brand-900 dark:text-white flex items-center gap-2">
                          <FileText className="h-4.5 w-4.5 text-brand-500" />
                          <span>{doc.fileName}</span>
                        </td>
                        <td className="px-4 py-3 text-left">{doc.buyerName}</td>
                        <td className="px-4 py-3 text-left">{doc.projectName}</td>
                        <td className="px-4 py-3 text-left">{doc.unitName}</td>
                        <td className="px-4 py-3 text-left">{doc.documentType}</td>
                        <td className="px-4 py-3 text-left">
                          <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-850 dark:text-brand-300">
                            {doc.version}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <StatusBadge label={doc.status} type={doc.status === 'VERIFIED' ? 'success' : 'warning'} />
                        </td>
                        <td className="px-4 py-3 text-left">{doc.lastModified}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedDocId(doc.id);
                                setWorkspaceTab('overview');
                              }}
                              className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900"
                              title="Document 360 Workspace"
                            >
                              <Eye className="h-4 w-4" />
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
                title="No documents matching filters"
                description="Adjust search tags or filter choices to query vault archives."
                icon={FolderOpen}
              />
            )}
          </Card>
        </div>
      )}

      {/* LINK DOCUMENT MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100 dark:border-brand-800">
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Link New Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="rounded-lg p-1 text-brand-400 hover:bg-brand-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              {formError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-750 border border-red-200">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Target Workflow Unit</label>
                <select
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                >
                  <option value="">Select Unit...</option>
                  {workflows.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.buyerName} ({w.projectName} • {w.unitName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  placeholder="e.g. sale_agreement.pdf"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  >
                    <option value="AGREEMENT">Agreement</option>
                    <option value="NOC">NOC</option>
                    <option value="RECEIPT">Receipt</option>
                    <option value="DRAWING">Blueprint Drawing</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">MIME Type</label>
                  <input
                    type="text"
                    value={mimeType}
                    onChange={(e) => setMimeType(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                    placeholder="e.g. application/pdf"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Zoho WorkDrive File ID</label>
                <input
                  type="text"
                  value={workDriveFileId}
                  onChange={(e) => setWorkDriveFileId(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  placeholder="e.g. wdr_file_98234"
                  required
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-xl bg-brand-100 hover:bg-brand-200 px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  {isSubmitting ? 'Linking...' : 'Link Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentsPage;
