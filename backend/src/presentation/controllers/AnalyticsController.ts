import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { VisitRepository } from '../../infrastructure/repositories/VisitRepository';
import { ExpenseRepository } from '../../infrastructure/repositories/ExpenseRepository';

const visitRepository = new VisitRepository();
const expenseRepository = new ExpenseRepository();

export class AnalyticsController {
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const { startDate, endDate } = req.query;

      // Parse dates or use defaults (current month)
      const now = new Date();
      const start = startDate
        ? new Date(startDate as string)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate
        ? new Date(endDate as string)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Get visit analytics
      const visitAnalytics = await visitRepository.getAnalytics(doctorId, start, end);

      // Get expenses for the same period
      const expenses = await expenseRepository.findByDateRange(doctorId, start, end);

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      res.json({
        ...visitAnalytics,
        totalExpenses,
        netProfit: visitAnalytics.totalRevenue - totalExpenses,
      });
    } catch (error) {
      next(error);
    }
  }
}
