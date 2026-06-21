import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { DrugRepository } from '../../infrastructure/repositories/DrugRepository';

const drugRepository = new DrugRepository();

export class DrugController {
  // GET /api/drugs?q=<term>&limit=<n>
  // Read-only search over the Egyptian drug database. Empty/short queries
  // return [] so the client can debounce without hammering the server.
  async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : NaN;
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 30;

      if (q.trim().length < 2) {
        return res.json([]);
      }

      const drugs = drugRepository.search(q, limit);
      res.json(drugs);
    } catch (error) {
      next(error);
    }
  }
}
