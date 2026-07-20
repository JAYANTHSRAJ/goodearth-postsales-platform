export interface Workflow {
  id: string;
  buyerName: string;
  projectName: string;
  unitName: string;
  currentStage: string;
  progressPercent: number;
  status: 'active' | 'on_hold' | 'completed';
  lastUpdated: string;
}
