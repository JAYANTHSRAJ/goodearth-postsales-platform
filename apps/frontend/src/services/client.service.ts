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
  attachmentId?: string;
  fileName: string;
  version: number;
  mimeType: string;
  fileType?: string;
  previewUrl: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedTime?: string;
  uploadedAt: string;
  fileSize?: number;
}

export interface ClientAttachment {
  id: string;
  attachmentId: string;
  fileName: string;
  category: string;
  version: number;
  mimeType: string;
  fileType: string;
  fileSize: number;
  isPreviewable: boolean;
  previewUrl: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedTime?: string;
  uploadedAt: string;
  revisions?: ClientAttachment[];
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
  unitNumber?: string;
  block?: string;
  unitType?: string;
  floor?: string;
  area?: string;
  carpetArea?: string;
  facing?: string;
  plot?: string;
  bedrooms?: string;
  bathrooms?: string;
  parking?: string;
  registrationStatus?: string;
  projectImageUrl?: string;
  purchaseDate?: string;
  expectedHandover?: string;
  possessionDate?: string;
  primaryBuyer?: string;
  primaryBuyerEmail?: string;
  coOwner?: string;
  constructionStatus?: string;
  completionPercent?: number;
}

export interface ClientFloorPlans {
  latestDrawing?: ClientDrawingSummary;
  previewUrl?: string;
  downloadUrl?: string;
  allPreviousVersions?: ClientDrawingSummary[];
  revisionHistory?: ClientDrawingSummary[];
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
  role?: string;
  status?: string;
  invitationStatus?: string;
  createdDate?: string;
  lastLogin?: string;
  notes?: string;
  permissions?: string[];
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
    const url = workflowId ? `/client/my-home?workflowId=${workflowId}` : '/client/my-home';
    return api.get<ClientHomeDetails>(url);
  },

  getFloorPlans(): Promise<ClientFloorPlans> {
    return api.get<ClientFloorPlans>('/client/floor-plans');
  },

  getFloorPlanById(attachmentId: string): Promise<ClientDrawingSummary> {
    return api.get<ClientDrawingSummary>(`/client/floor-plans/${attachmentId}`);
  },

  getAttachments(category?: string, search?: string, sort?: string): Promise<ClientAttachment[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return api.get<ClientAttachment[]>(`/client/attachments${queryStr}`);
  },

  getAttachmentById(attachmentId: string): Promise<ClientAttachment> {
    return api.get<ClientAttachment>(`/client/attachments/${attachmentId}`);
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
    return api.get<FamilyMember[]>('/client/family-members');
  },

  addFamilyMember(member: FamilyMember): Promise<FamilyMember> {
    return api.post<FamilyMember>('/client/family-members', member);
  },

  updateFamilyMember(id: string, member: FamilyMember): Promise<FamilyMember> {
    return api.put<FamilyMember>(`/client/family-members/${id}`, member);
  },

  removeFamilyMember(id: string): Promise<string> {
    return api.delete<string>(`/client/family-members/${id}`);
  },

  sendInvitation(id: string): Promise<FamilyMember> {
    return api.post<FamilyMember>(`/client/family-members/${id}/invite`, {});
  },

  getPermissions(id: string): Promise<string[]> {
    return api.get<string[]>(`/client/family-members/${id}/permissions`);
  },

  updatePermissions(id: string, permissions: string[]): Promise<FamilyMember> {
    return api.put<FamilyMember>(`/client/family-members/${id}/permissions`, permissions);
  },

  getProfile(): Promise<any> {
    return api.get<any>('/client/profile');
  },

  updateProfile(profile: any): Promise<any> {
    return api.put<any>('/client/profile', profile);
  },
};

export default clientService;
