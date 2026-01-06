import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();
const controller = new NotificationController();

// All routes require authentication
router.use(authMiddleware);

// GET /notifications - Get all notifications for logged-in user's doctor
router.get('/', controller.getAll.bind(controller));

// GET /notifications/unread - Get unread count
router.get('/unread', controller.getUnreadCount.bind(controller));

// PUT /notifications/:id/read - Mark single notification as read
router.put('/:id/read', controller.markAsRead.bind(controller));

// PUT /notifications/read-all - Mark all notifications as read
router.put('/read-all', controller.markAllAsRead.bind(controller));

// DELETE /notifications/:id - Delete a single notification
router.delete('/:id', controller.delete.bind(controller));

// DELETE /notifications - Delete all notifications
router.delete('/', controller.deleteAll.bind(controller));

export default router;
