import { api } from './api';

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

export const clientService = {
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

  getKyc(): Promise<any> {
    return api.get<any>('/client/kyc');
  },

  saveKycDraft(data: any): Promise<any> {
    return api.post<any>('/client/kyc/draft', data);
  },

  submitKyc(data: any): Promise<any> {
    return api.post<any>('/client/kyc/submit', data);
  },

  uploadKycFile(file: File): Promise<{ fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ fileUrl: string }>('/client/kyc/upload', formData);
  },

  simulatePayment(paymentDetails: any): Promise<any> {
    return api.post<any>('/client/payment/simulate', paymentDetails);
  },
};

export default clientService;
