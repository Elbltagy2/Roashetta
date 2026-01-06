import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';

const notificationRepository = new NotificationRepository();

export class NotificationController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationRepository.findByDoctorId(
        req.doctorId!,
        50 // Default limit
      );

      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await notificationRepository.findUnreadCount(req.doctorId!);

      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationRepository.markAsRead(req.params.id);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationRepository.markAllAsRead(req.doctorId!);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationRepository.delete(req.params.id);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async deleteAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationRepository.deleteAll(req.doctorId!);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
