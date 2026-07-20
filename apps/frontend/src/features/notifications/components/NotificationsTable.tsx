import React from 'react';
import { Notification } from '../types/notifications.types';
import { NotificationRow } from './NotificationRow';

interface NotificationsTableProps {
  notifications: Notification[];
}

export const NotificationsTable: React.FC<NotificationsTableProps> = ({ notifications }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-800">
        <thead className="bg-brand-50/50 dark:bg-brand-950/30">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Notification Title
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Recipient
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Sent At
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-800/40">
          {notifications.map((notif) => (
            <NotificationRow key={notif.id} notification={notif} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default NotificationsTable;
