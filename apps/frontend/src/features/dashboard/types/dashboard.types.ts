import { TimelineStep } from '../../../components/ui/Timeline';

export interface DashboardData {
  customer: {
    name: string;
    projectName: string;
    unitName: string;
  };
  unit: {
    block: string;
    layout: string;
    area: string;
    status: string;
  };
  stage: {
    name: string;
    progressPercent: number;
    estHandoff: string;
  };
  payment: {
    paid: string;
    paidPercent: string;
    outstanding: string;
    dueDate: string;
  };
  upgrade: {
    title: string;
    description: string;
    deadline: string;
  };
  decisions: Array<{ id: string; title: string; daysLeft: number }>;
  activities: Array<{ id: string; description: string; date: string }>;
  timelineSteps: TimelineStep[];
}
