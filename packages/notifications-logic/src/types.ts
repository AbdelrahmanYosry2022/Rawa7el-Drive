import type { Notification, NotificationType, Platform } from '@rawa7el/database';

// ==================== Input Types ====================

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  senderId?: string;
  receiverId: string;
  platform?: Platform;
}

export interface BroadcastNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  senderId?: string;
  platform?: Platform;
  receiverIds: string[];
}

export interface BroadcastToRoleInput {
  title: string;
  message: string;
  type?: NotificationType;
  senderId?: string;
  platform?: Platform;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';
}

// ==================== Output Types ====================

export interface NotificationWithSender extends Notification {
  sender?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<NotificationType, number>;
}

// ==================== Filter Types ====================

export interface NotificationFilters {
  receiverId?: string;
  senderId?: string;
  isRead?: boolean;
  type?: NotificationType;
  platform?: Platform;
}

// ==================== Re-exports ====================

export type { Notification, NotificationType, Platform };
