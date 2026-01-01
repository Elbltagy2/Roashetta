import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ExpenseRepository } from '../../infrastructure/repositories/ExpenseRepository';
import { CreateExpense } from '../../application/use-cases/expense/CreateExpense';
import { GetExpenses } from '../../application/use-cases/expense/GetExpenses';
import { UpdateExpense } from '../../application/use-cases/expense/UpdateExpense';
import { DeleteExpense } from '../../application/use-cases/expense/DeleteExpense';

export class ExpenseController {
  async getExpenses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expenseRepository = new ExpenseRepository();
      const getExpenses = new GetExpenses(expenseRepository);

      const { startDate, endDate } = req.query;
      let expenses;

      if (startDate && endDate) {
        expenses = await getExpenses.executeByDateRange(
          req.doctorId!,
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        expenses = await getExpenses.execute(req.doctorId!);
      }

      res.json(expenses);
    } catch (error) {
      next(error);
    }
  }

  async createExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expenseRepository = new ExpenseRepository();
      const createExpense = new CreateExpense(expenseRepository);

      const expense = await createExpense.execute({
        doctorId: req.doctorId!,
        amount: req.body.amount,
        category: req.body.category,
        description: req.body.description || '',
        expenseDate: new Date(req.body.expenseDate),
      });

      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expenseRepository = new ExpenseRepository();
      const updateExpense = new UpdateExpense(expenseRepository);

      const expense = await updateExpense.execute(
        req.params.id,
        req.doctorId!,
        {
          amount: req.body.amount,
          category: req.body.category,
          description: req.body.description,
          expenseDate: req.body.expenseDate ? new Date(req.body.expenseDate) : undefined,
        }
      );

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expenseRepository = new ExpenseRepository();
      const deleteExpense = new DeleteExpense(expenseRepository);

      await deleteExpense.execute(req.params.id, req.doctorId!);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
