import { Router } from 'express';
import { ExpenseController } from '../controllers/ExpenseController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const expenseController = new ExpenseController();

// All expense routes require authentication
router.use(authMiddleware);

router.get('/', expenseController.getExpenses.bind(expenseController));
router.post('/', expenseController.createExpense.bind(expenseController));
router.put('/:id', expenseController.updateExpense.bind(expenseController));
router.delete('/:id', expenseController.deleteExpense.bind(expenseController));

export default router;
