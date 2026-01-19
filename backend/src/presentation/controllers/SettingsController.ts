import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { SettingsRepository } from '../../infrastructure/repositories/SettingsRepository';

const settingsRepository = new SettingsRepository();

export class SettingsController {
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const settings = await settingsRepository.findByDoctorId(doctorId);

      if (!settings) {
        // Return default settings if none exist
        return res.json({
          doctorId,
          newVisitPrice: 0,
          followupVisitPrice: 0,
        });
      }

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const { newVisitPrice, followupVisitPrice } = req.body;

      const settings = await settingsRepository.upsert({
        doctorId,
        newVisitPrice: newVisitPrice ?? 0,
        followupVisitPrice: followupVisitPrice ?? 0,
      });

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }
}
