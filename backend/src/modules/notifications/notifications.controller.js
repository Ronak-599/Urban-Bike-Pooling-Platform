import { NotificationsService } from './notifications.service.js';
import { sendSuccess } from '../../utils/response.util.js';
const notificationsService = new NotificationsService();
export class NotificationsController {
    async getNotifications(req, res, next) {
        try {
            const unreadOnly = req.query.unread === 'true';
            const notifications = await notificationsService.getNotifications(req.user.userId, unreadOnly);
            sendSuccess(res, notifications, 'Notifications retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const notification = await notificationsService.markAsRead(req.user.userId, req.params.id);
            sendSuccess(res, notification, 'Notification marked as read');
        }
        catch (error) {
            next(error);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const result = await notificationsService.markAllAsRead(req.user.userId);
            sendSuccess(res, { updatedCount: result.count }, 'All notifications marked as read');
        }
        catch (error) {
            next(error);
        }
    }
}
