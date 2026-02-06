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

      // For end date, set time to end of day (23:59:59.999) to include all visits on that day
      let end: Date;
      if (endDate) {
        const endDateParsed = new Date(endDate as string);
        end = new Date(endDateParsed.getFullYear(), endDateParsed.getMonth(), endDateParsed.getDate(), 23, 59, 59, 999);
      } else {
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

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
