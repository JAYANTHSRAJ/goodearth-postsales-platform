import { DashboardData } from '../types/dashboard.types';

export const DASHBOARD_DATA: DashboardData = {
  customer: {
    name: '',
    projectName: '',
    unitName: '',
  },
  unit: {
    block: '',
    layout: '',
    area: '',
    status: '',
  },
  stage: {
    name: '',
    progressPercent: 0,
    estHandoff: '',
  },
  payment: {
    paid: '',
    paidPercent: '',
    outstanding: '',
    dueDate: '',
  },
  upgrade: {
    title: '',
    description: '',
    deadline: '',
  },
  decisions: [],
  activities: [],
  timelineSteps: [],
};
