import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { updater } from '../../infrastructure/updater/Updater';

export class UpdateController {
  async getInfo(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(updater.getState());
    } catch (error) {
      next(error);
    }
  }

  async check(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const state = await updater.checkForUpdates();
      res.json(state);
    } catch (error) {
      next(error);
    }
  }

  async install(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const state = await updater.downloadUpdate();
      res.json(state);
    } catch (error) {
      next(error);
    }
  }

  async restart(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const state = updater.getState();
      if (state.downloadStatus.state !== 'downloaded') {
        return res.status(400).json({
          error: 'No downloaded update available to apply',
        });
      }
      res.json({ status: 'restarting' });
      updater.scheduleRestart();
    } catch (error) {
      next(error);
    }
  }
}
