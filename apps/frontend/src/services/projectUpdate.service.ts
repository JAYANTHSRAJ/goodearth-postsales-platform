import { api } from './api';

export interface ProjectUpdateInput {
  workflowId: string;
  stageId: string;
  title: string;
  description: string;
  updateType: string;
  progressPercentage: number;
  location: string;
}

export const projectUpdateService = {
  getWorkflowUpdates(workflowId: string): Promise<any[]> {
    return api.get<any[]>(`/project-updates/${workflowId}`);
  },

  createUpdate(data: ProjectUpdateInput): Promise<any> {
    return api.post<any>('/project-updates', data);
  },

  publishUpdate(id: string): Promise<any> {
    return api.post<any>(`/project-updates/${id}/publish`, {});
  },

  deleteUpdate(id: string): Promise<void> {
    return api.delete<void>(`/project-updates/${id}`);
  },
};

export default projectUpdateService;
