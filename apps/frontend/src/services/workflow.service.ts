import { api } from './api';
import { Workflow } from '../features/workflows/types/workflows.types';

export const workflowService = {
  getWorkflows(): Promise<Workflow[]> {
    return api.get<Workflow[]>('/workflows');
  },

  getWorkflowById(id: string): Promise<Workflow> {
    return api.get<Workflow>(`/workflows/${id}`);
  },

  createWorkflow(workflow: Omit<Workflow, 'id'>): Promise<Workflow> {
    return api.post<Workflow>('/workflows', workflow);
  },

  updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    return api.patch<Workflow>(`/workflows/${id}`, workflow);
  },

  updateWorkflowStatus(id: string, status: string): Promise<any> {
    return api.patch<any>(`/workflows/${id}/status`, { status });
  },

  deleteWorkflow(id: string): Promise<void> {
    return api.delete<void>(`/workflows/${id}`);
  },
};

export default workflowService;
