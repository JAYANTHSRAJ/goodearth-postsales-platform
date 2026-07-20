import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';

export interface WebhookEvent {
  id: string;
  provider: string;
  eventType: string;
  eventId: string;
  status: 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'RETRYING';
  retryCount: number;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  payload?: string;
  errorMessage?: string;
}

export interface WebhookStats {
  pendingQueue: number;
  retryQueue: number;
  processedToday: number;
  failedToday: number;
  averageProcessingTimeMs: number;
}

export const useWebhookMonitor = () => {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading: isEventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['webhookEvents'],
    queryFn: () => api.get<WebhookEvent[]>('/webhooks/events'),
    staleTime: 10 * 1000, // 10 seconds refresh stale limit
  });

  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['webhookStats'],
    queryFn: () => api.get<WebhookStats>('/webhooks/statistics'),
    staleTime: 15 * 1000,
  });

  const replayMutation = useMutation({
    mutationFn: (id: string) => api.post<string>(`/webhooks/replay/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhookEvents'] });
      queryClient.invalidateQueries({ queryKey: ['webhookStats'] });
    },
  });

  return {
    events,
    stats,
    isLoading: isEventsLoading || isStatsLoading,
    refetch: () => {
      refetchEvents();
      refetchStats();
    },
    replayEvent: replayMutation.mutateAsync,
    isReplaying: replayMutation.isPending,
  };
};

export default useWebhookMonitor;
