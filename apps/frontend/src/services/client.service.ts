import { api } from './api';
import { ClientUnit } from '../store/unitStore';

export interface ClientBuyerSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface ClientProjectSummary {
  id: string;
  projectName: string;
  projectCode: string;
  location: string;
}

export interface ClientWorkflowSummary {
  id: string;
  status: string;
  startedAt: string;
}

export interface ClientStageSummary {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface ClientDrawingSummary {
  id: string;
  fileName: string;
  version: number;
  mimeType: string;
  previewUrl: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ClientChangeRequestSummary {
  id: string;
  annotationId: string;
  status: string;
  priority: string;
  estimatedCost: number;
  estimatedCompletionDate: string;
  remarks: string;
  createdAt: string;
}

export interface ClientNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface ClientDashboardData {
  buyer: ClientBuyerSummary;
  project: ClientProjectSummary;
  workflow: ClientWorkflowSummary;
  currentStage?: ClientStageSummary;
  completionPercent?: number;
  latestDrawing?: ClientDrawingSummary;
  pendingChangeRequests?: ClientChangeRequestSummary[];
  outstandingBalance?: number;
  recentNotifications?: ClientNotification[];
}

export interface ClientHomeDetails {
  project: string;
  villa: string;
  area: string;
  facing: string;
  plot: string;
  constructionStatus: string;
  completionPercent: number;
  expectedHandover: string;
}

export interface ClientFloorPlans {
  latestDrawing: ClientDrawingSummary;
  previewUrl: string;
  downloadUrl: string;
  allPreviousVersions: ClientDrawingSummary[];
  revisionHistory: ClientDrawingSummary[];
}

export interface ClientDocumentSummary {
  id: string;
  fileName: string;
  documentType: string;
  uploadedAt: string;
  fileSize: number;
  uploadedBy: string;
  status: string;
}

export interface ClientDocumentsGrouped {
  agreement: ClientDocumentSummary[];
  legal: ClientDocumentSummary[];
  design: ClientDocumentSummary[];
  invoice: ClientDocumentSummary[];
  receipt: ClientDocumentSummary[];
  other: ClientDocumentSummary[];
}

export interface ClientProjectUpdate {
  date: string;
  caption: string;
  imageUrl: string;
}

export interface ClientFinance {
  quotes: any[];
  invoices: any[];
  receipts: any[];
  outstandingBalance: number;
}

export interface ClientTimelineEvent {
  timestamp: string;
  category: string;
  title: string;
  description: string;
  status: string;
}

export interface FamilyMember {
  id?: string;
  name: string;
  relation: string;
  email?: string;
  phone?: string;
}

export interface DocumentMetadata {
  id: string;
  applicantType: string;
  documentType: string;
  fileName: string;
  filePath?: string;
  version: number;
  mimeType: string;
  sizeBytes: number;
}

export const clientService = {
  getOwnedUnits(): Promise<ClientUnit[]> {
    return api.get<ClientUnit[]>('/client/units');
  },

  setActiveUnit(buyerId: string): Promise<any> {
    return api.post<any>(`/client/units/active?buyerId=${buyerId}`, {});
  },

  getDashboard(workflowId?: string | null): Promise<ClientDashboardData> {
    const url = workflowId ? `/client/dashboard?workflowId=${workflowId}` : '/client/dashboard';
    return api.get<ClientDashboardData>(url);
  },

  getHomeDetails(workflowId?: string | null): Promise<ClientHomeDetails> {
    const url = workflowId ? `/client/home?workflowId=${workflowId}` : '/client/home';
    return api.get<ClientHomeDetails>(url);
  },

  getFloorPlans(): Promise<ClientFloorPlans> {
    return api.get<ClientFloorPlans>('/client/floorplans');
  },

  getDocuments(): Promise<ClientDocumentsGrouped> {
    return api.get<ClientDocumentsGrouped>('/client/documents');
  },

  getUpdates(): Promise<ClientProjectUpdate[]> {
    return api.get<ClientProjectUpdate[]>('/client/updates');
  },

  getFinanceSummary(): Promise<ClientFinance> {
    return api.get<ClientFinance>('/client/finance');
  },

  getTimeline(): Promise<ClientTimelineEvent[]> {
    return api.get<ClientTimelineEvent[]>('/client/timeline');
  },

  getFamilyMembers(): Promise<FamilyMember[]> {
    return api.get<FamilyMember[]>('/client/family');
  },

  addFamilyMember(member: FamilyMember): Promise<FamilyMember> {
    return api.post<FamilyMember>('/client/family', member);
  },

  removeFamilyMember(id: string): Promise<string> {
    return api.delete<string>(`/client/family/${id}`);
  },

  getProfile(): Promise<any> {
    return api.get<any>('/client/profile');
  },

  updateProfile(profile: any): Promise<any> {
    return api.put<any>('/client/profile', profile);
  },

  getKyc(workflowId?: string | null): Promise<any> {
    if (!workflowId) {
      return Promise.reject(new Error('workflowId parameter is required for getKyc'));
    }
    return api.get<any>(`/kyc?workflowId=${workflowId}`);
  },

  getKycById(kycId: string): Promise<any> {
    return api.get<any>(`/kyc/${kycId}`);
  },

  saveKycDraft(data: any, workflowId?: string | null): Promise<any> {
    const url = `/kyc/draft`;
    return api.post<any>(url, { ...data, workflowId });
  },

  submitKyc(data: any, workflowId?: string | null): Promise<any> {
    const url = workflowId ? `/kyc/${workflowId}/submit` : '/kyc/submit';
    return api.post<any>(url, data);
  },

  reuseKyc(workflowId: string, sourceKycId: string): Promise<any> {
    return api.post<any>(`/client/kyc/reuse?workflowId=${workflowId}&sourceKycId=${sourceKycId}`, {});
  },

  requestKycModification(workflowId: string, reason: string): Promise<any> {
    return api.post<any>(`/client/kyc/request-modification?workflowId=${workflowId}`, { reason });
  },

  // Document Vault APIs
  uploadKycDocument(workflowId: string, applicantType: string, documentType: string, file: File): Promise<DocumentMetadata> {
    const formData = new FormData();
    formData.append('workflowId', workflowId);
    formData.append('applicantType', applicantType);
    formData.append('documentType', documentType);
    formData.append('file', file);
    return api.post<DocumentMetadata>('/kyc/documents/upload', formData);
  },

  replaceKycDocument(documentId: string, file: File): Promise<DocumentMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    return api.put<DocumentMetadata>(`/kyc/documents/${documentId}/replace`, formData);
  },

  listKycDocuments(workflowId: string): Promise<DocumentMetadata[]> {
    return api.get<DocumentMetadata[]>(`/kyc/documents?workflowId=${workflowId}`);
  },

  deleteKycDocument(documentId: string): Promise<string> {
    return api.delete<string>(`/kyc/documents/${documentId}`);
  },

  getDocumentVersionHistory(documentId: string): Promise<DocumentMetadata[]> {
    return api.get<DocumentMetadata[]>(`/kyc/documents/${documentId}/versions`);
  },

  // Admin Review Portal APIs
  getAdminAllKycApplications(): Promise<any[]> {
    return api.get<any[]>('/kyc/admin/all');
  },

  adminReviewKyc(kycId: string, action: string, comments?: string): Promise<any> {
    return api.post<any>(`/kyc/${kycId}/admin-review`, { action, comments });
  },

  getKycAuditLogs(kycId: string): Promise<any[]> {
    return api.get<any[]>(`/kyc/${kycId}/audit`);
  },

  getCrmSyncLogs(kycId: string): Promise<any[]> {
    return api.get<any[]>(`/admin/kyc/sync/logs?kycId=${kycId}`);
  },

  retryCrmSync(syncLogId: string): Promise<any> {
    return api.post<any>(`/admin/kyc/sync/${syncLogId}/retry`, {});
  },

  getWorkDriveSyncLogs(kycId: string): Promise<any[]> {
    return api.get<any[]>(`/admin/kyc/workdrive/logs?kycId=${kycId}`);
  },

  retryWorkDriveSync(syncLogId: string): Promise<any> {
    return api.post<any>(`/admin/kyc/workdrive/${syncLogId}/retry`, {});
  },
};

export default clientService;
