import { api } from './api';
import { Notification } from '../features/notifications/types/notifications.types';

export const notificationService = {
  getNotifications(): Promise<Notification[]> {
    return api.get<Notification[]>('/notifications');
  },

  getNotificationById(id: string): Promise<Notification> {
    return api.get<Notification>(`/notifications/${id}`);
  },

  createNotification(notification: Omit<Notification, 'id'>): Promise<Notification> {
    return api.post<Notification>('/notifications', notification);
  },

  updateNotification(id: string, notification: Partial<Notification>): Promise<Notification> {
    return api.patch<Notification>(`/notifications/${id}`, notification);
  },

  deleteNotification(id: string): Promise<void> {
    return api.delete<void>(`/notifications/${id}`);
  },
};

export default notificationService;
