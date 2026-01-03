import { prisma } from '@rawa7el/database';
import type {
  CreateNotificationInput,
  BroadcastNotificationInput,
  BroadcastToRoleInput,
  NotificationWithSender,
  NotificationStats,
  NotificationFilters,
} from '../types';

export class NotificationService {
  /**
   * Create a single notification
   */
  async create(data: CreateNotificationInput): Promise<NotificationWithSender> {
    return prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type ?? 'INFO',
        senderId: data.senderId,
        receiverId: data.receiverId,
        platform: data.platform ?? 'BEDAYA',
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcast(data: BroadcastNotificationInput): Promise<number> {
    const result = await prisma.notification.createMany({
      data: data.receiverIds.map((receiverId) => ({
        title: data.title,
        message: data.message,
        type: data.type ?? 'ANNOUNCEMENT',
        senderId: data.senderId,
        receiverId,
        platform: data.platform ?? 'BEDAYA',
      })),
    });
    return result.count;
  }

  /**
   * Broadcast notification to all users with a specific role
   */
  async broadcastToRole(data: BroadcastToRoleInput): Promise<number> {
    const users = await prisma.user.findMany({
      where: {
        role: data.role,
        platform: data.platform ?? 'BEDAYA',
        isActive: true,
      },
      select: { id: true },
    });

    if (users.length === 0) return 0;

    const result = await prisma.notification.createMany({
      data: users.map((user) => ({
        title: data.title,
        message: data.message,
        type: data.type ?? 'ANNOUNCEMENT',
        senderId: data.senderId,
        receiverId: user.id,
        platform: data.platform ?? 'BEDAYA',
      })),
    });
    return result.count;
  }

  /**
   * Get notifications for a user
   */
  async getForUser(
    userId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<NotificationWithSender[]> {
    return prisma.notification.findMany({
      where: {
        receiverId: userId,
        ...(options?.unreadOnly && { isRead: false }),
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    });
  }

  /**
   * Get notification by ID
   */
  async getById(id: string): Promise<NotificationWithSender | null> {
    return prisma.notification.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<NotificationWithSender> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
    return result.count;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }

  /**
   * Get notification stats for a user
   */
  async getStats(userId: string): Promise<NotificationStats> {
    const notifications = await prisma.notification.findMany({
      where: { receiverId: userId },
      select: { isRead: true, type: true },
    });

    const byType: Record<string, number> = {
      INFO: 0,
      WARNING: 0,
      SUCCESS: 0,
      ERROR: 0,
      ANNOUNCEMENT: 0,
    };

    let unread = 0;
    for (const n of notifications) {
      if (!n.isRead) unread++;
      byType[n.type] = (byType[n.type] || 0) + 1;
    }

    return {
      total: notifications.length,
      unread,
      read: notifications.length - unread,
      byType: byType as NotificationStats['byType'],
    };
  }

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<void> {
    await prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllForUser(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { receiverId: userId },
    });
    return result.count;
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });
    return result.count;
  }
}

export const notificationService = new NotificationService();
