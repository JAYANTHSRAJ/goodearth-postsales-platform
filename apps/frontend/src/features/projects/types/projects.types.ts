export interface Project {
  id: string;
  name: string;
  code: string;
  location: string;
  totalUnits: number;
  activeWorkflows: number;
  status: 'active' | 'planning' | 'completed';
  commencementDate: string;
}
