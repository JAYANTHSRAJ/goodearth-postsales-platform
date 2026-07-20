import React from 'react';
import { Notification } from '../types/notifications.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

interface NotificationRowProps {
  notification: Notification;
}

export const NotificationRow: React.FC<NotificationRowProps> = ({ notification }) => {
  const getBadgeType = (status: Notification['status']) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'pending':
        return 'neutral';
      case 'failed':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <tr className="border-b border-brand-100 hover:bg-brand-50/30 dark:border-brand-800/40 dark:hover:bg-brand-950/10 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-semibold text-brand-900 dark:text-white">
        {notification.title || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800 dark:text-brand-200 text-left capitalize">
        {notification.type || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800 dark:text-brand-200 text-left">
        {notification.recipient || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <StatusBadge label={notification.status?.toUpperCase() || '—'} type={getBadgeType(notification.status)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500 dark:text-brand-400 text-left">
        {notification.sentAt || '—'}
      </td>
    </tr>
  );
};
export default NotificationRow;
