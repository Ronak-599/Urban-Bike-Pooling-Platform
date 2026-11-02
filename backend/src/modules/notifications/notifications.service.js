import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../errors/app.error.js';
export class NotificationsService {
    async getNotifications(userId, unreadOnly = false) {
        return prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly ? { isRead: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async markAsRead(userId, notificationId) {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification || notification.userId !== userId) {
            throw new NotFoundError('Notification not found');
        }
        return prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllAsRead(userId) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async sendNotification(userId, title, body, type = 'GENERAL', channel = 'IN_APP', metadata = {}) {
        return prisma.notification.create({
            data: {
                userId,
                title,
                body,
                notificationType: type,
                channel,
                metadata,
            },
        });
    }
}
