export interface Notification {
  id: string;
  title: string;
  type: 'email' | 'sms' | 'push' | 'system';
  status: 'sent' | 'pending' | 'failed';
  recipient: string;
  sentAt: string;
}
