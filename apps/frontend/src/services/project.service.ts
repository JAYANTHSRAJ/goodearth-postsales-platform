import { api } from './api';
import { Project } from '../features/projects/types/projects.types';

export const projectService = {
  getProjects(): Promise<Project[]> {
    return api.get<Project[]>('/projects');
  },

  getProjectById(id: string): Promise<Project> {
    return api.get<Project>(`/projects/${id}`);
  },

  createProject(project: Omit<Project, 'id'>): Promise<Project> {
    return api.post<Project>('/projects', project);
  },

  updateProject(id: string, project: Partial<Project>): Promise<Project> {
    return api.patch<Project>(`/projects/${id}`, project);
  },

  deleteProject(id: string): Promise<void> {
    return api.delete<void>(`/projects/${id}`);
  },
};

export default projectService;
