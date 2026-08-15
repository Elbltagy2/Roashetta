import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { VisitRepository } from '../../infrastructure/repositories/VisitRepository';
import { ExpenseRepository } from '../../infrastructure/repositories/ExpenseRepository';
import { QueueRepository } from '../../infrastructure/repositories/QueueRepository';
import { SettingsRepository } from '../../infrastructure/repositories/SettingsRepository';
import { QUEUE_VISIT_TYPES, priceForVisitType } from '../../domain/entities/QueueEntry';

const visitRepository = new VisitRepository();
const expenseRepository = new ExpenseRepository();
const queueRepository = new QueueRepository();
const settingsRepository = new SettingsRepository();

const toDateKey = (d: Date) => d.toISOString().split('T')[0];

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

      // Revenue comes from the queue: each entry's visit type priced from the
      // doctor's settings. The price stored on the visit record is ignored here
      // on purpose — the queue is what the day's takings are billed from.
      const settings = await settingsRepository.findByDoctorId(doctorId);
      const prices = {
        newVisitPrice: settings?.newVisitPrice ?? 0,
        followupVisitPrice: settings?.followupVisitPrice ?? 0,
        consultationPrice: settings?.consultationPrice ?? 0,
      };

      const breakdown = await queueRepository.getTypeBreakdown(doctorId, toDateKey(start), toDateKey(end));

      const revenueByType: Record<string, number> = {};
      const countsByType: Record<string, number> = {};
      let queueRevenue = 0;
      let queueVisits = 0;

      for (const type of QUEUE_VISIT_TYPES) {
        const count = breakdown.totals[type] ?? 0;
        const revenue = count * priceForVisitType(type, prices);
        countsByType[type] = count;
        revenueByType[type] = revenue;
        queueVisits += count;
        queueRevenue += revenue;
      }

      const queueDaily = breakdown.daily.map(day => {
        const revenue = QUEUE_VISIT_TYPES.reduce(
          (sum, type) => sum + (day.counts[type] ?? 0) * priceForVisitType(type, prices),
          0
        );
        return {
          date: day.date,
          totalVisits: QUEUE_VISIT_TYPES.reduce((sum, type) => sum + (day.counts[type] ?? 0), 0),
          countsByType: day.counts,
          revenue,
        };
      });

      res.json({
        ...visitAnalytics,
        // Queue-derived figures — what the doctor's revenue analysis uses.
        totalRevenue: queueRevenue,
        queueVisits,
        countsByType,
        revenueByType,
        queueDaily,
        prices,
        // Kept for reference: revenue as recorded on the visits themselves.
        visitRecordedRevenue: visitAnalytics.totalRevenue,
        totalExpenses,
        netProfit: queueRevenue - totalExpenses,
      });
    } catch (error) {
      next(error);
    }
  }
}
