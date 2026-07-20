import { api } from './api';
import { Stage } from '../features/stages/types/stages.types';

export const stageService = {
  getStages(): Promise<Stage[]> {
    return api.get<Stage[]>('/stages');
  },

  getStageById(id: string): Promise<Stage> {
    return api.get<Stage>(`/stages/${id}`);
  },

  createStage(stage: Omit<Stage, 'id'>): Promise<Stage> {
    return api.post<Stage>('/stages', stage);
  },

  updateStage(id: string, stage: Partial<Stage>): Promise<Stage> {
    return api.patch<Stage>(`/stages/${id}`, stage);
  },

  deleteStage(id: string): Promise<void> {
    return api.delete<void>(`/stages/${id}`);
  },
};

export default stageService;
