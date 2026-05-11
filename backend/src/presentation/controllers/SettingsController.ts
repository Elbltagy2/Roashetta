import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { SettingsRepository } from '../../infrastructure/repositories/SettingsRepository';
import { cache, cacheKeys } from '../../infrastructure/cache/MemoryCache';

const settingsRepository = new SettingsRepository();

export class SettingsController {
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;

      const cacheKey = cacheKeys.settings(doctorId);
      const cached = cache.get<unknown>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const settings = await settingsRepository.findByDoctorId(doctorId);

      const payload = settings ?? {
        doctorId,
        newVisitPrice: 0,
        followupVisitPrice: 0,
        lastScannerUrl: '',
        lastScannerName: '',
      };

      cache.set(cacheKey, payload);
      res.json(payload);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const { newVisitPrice, followupVisitPrice, lastScannerUrl, lastScannerName } = req.body;

      const existing = await settingsRepository.findByDoctorId(doctorId);

      const settings = await settingsRepository.upsert({
        doctorId,
        newVisitPrice: newVisitPrice ?? existing?.newVisitPrice ?? 0,
        followupVisitPrice: followupVisitPrice ?? existing?.followupVisitPrice ?? 0,
        lastScannerUrl: lastScannerUrl ?? existing?.lastScannerUrl ?? '',
        lastScannerName: lastScannerName ?? existing?.lastScannerName ?? '',
      });

      cache.delete(cacheKeys.settings(doctorId));

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }
}
