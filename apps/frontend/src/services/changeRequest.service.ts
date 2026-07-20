import { api } from './api';

export interface ChangeRequest {
  id: string;
  workflowId: string;
  documentId: string;
  annotationId: string;
  requestedBy: string;
  priority: string;
  remarks: string;
  status: string;
  estimatedCost?: number;
  estimatedCompletionDate?: string;
  createdAt: string;
}

export const changeRequestService = {
  createRequest(data: {
    workflowId: string;
    documentId: string;
    annotationId: string;
    requestedBy: string;
    priority: string;
    remarks: string;
  }): Promise<ChangeRequest> {
    return api.post<ChangeRequest>('/change-requests', data);
  },

  listRequests(): Promise<ChangeRequest[]> {
    return api.get<ChangeRequest[]>('/change-requests');
  },

  getRequestById(id: string): Promise<ChangeRequest> {
    return api.get<ChangeRequest>(`/change-requests/${id}`);
  },

  submitDecision(id: string, decision: 'APPROVED' | 'REJECTED', remarks: string, actor: string): Promise<ChangeRequest> {
    return api.post<ChangeRequest>(`/change-requests/${id}/decision`, {
      decision,
      remarks,
      actor,
    });
  },
};

export default changeRequestService;
