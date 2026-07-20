import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export interface DashboardItem {
  id: string;
  title: string;
  subtitle: string;
  extra?: string;
}

export interface AdminStats {
  totalBuyers: number;
  activeWorkflows: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  webhookPendingCount: number;
  webhookFailedToday: number;
  stageCounts: Record<string, number>;
  projectWorkloads: Record<string, number>;
  pendingReviews: DashboardItem[];
  overduePayments: DashboardItem[];
  projectDelays: DashboardItem[];
  openTickets: DashboardItem[];
  recentActivity: DashboardItem[];
}

export const useAdminDashboard = () => {
  return useQuery<AdminStats>({
    queryKey: ['adminDashboardStats'],
    queryFn: () => api.get<AdminStats>('/admin/dashboard/stats'),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export default useAdminDashboard;
