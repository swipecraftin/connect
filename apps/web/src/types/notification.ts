export type NotificationType = 'booking' | 'reminder' | 'credit' | 'system' | 'strike' | 'cancellation';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  type: NotificationType;
  actionTab?: 'marketplace' | 'my-sessions' | 'profile';
  slotId?: string;
}
