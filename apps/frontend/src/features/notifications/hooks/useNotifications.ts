import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../../services/notification.service';
import { Notification } from '../types/notifications.types';

export const useNotifications = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: pageResult, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    staleTime: 5 * 60 * 1000, // 5 minutes stale threshold
  });

  const notifications: Notification[] = useMemo(() => {
    const content = Array.isArray(pageResult)
      ? pageResult
      : (pageResult as any)?.content || [];

    return content.map((n: any): Notification => {
      const mapType = (t: string): 'email' | 'sms' | 'push' | 'system' => {
        switch (t?.toLowerCase()) {
          case 'email':
            return 'email';
          case 'sms':
            return 'sms';
          case 'push':
            return 'push';
          case 'system':
            return 'system';
          default:
            return 'system';
        }
      };

      return {
        id: n.id || '',
        title: n.title || n.message || 'Notification',
        type: mapType(n.notificationType),
        status: n.isRead ? 'sent' : 'pending',
        recipient: n.targetRole || 'Client',
        sentAt: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN') : '',
      };
    });
  }, [pageResult]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchesSearch =
        notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.recipient?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || notif.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [notifications, searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const totalNotifications = notifications.length;
    const sentCount = notifications.filter((n) => n.status === 'sent').length;
    const pendingCount = notifications.filter((n) => n.status === 'pending').length;

    return {
      totalNotifications,
      sentCount,
      pendingCount,
    };
  }, [notifications]);

  return {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    filteredNotifications,
    isLoading,
    stats,
  };
};

export default useNotifications;
