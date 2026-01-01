import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';

export class DeleteExpense {
  constructor(private expenseRepository: IExpenseRepository) {}

  async execute(id: string, doctorId: string): Promise<void> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    if (expense.doctorId !== doctorId) {
      throw new Error('Unauthorized access to expense');
    }
    await this.expenseRepository.delete(id);
  }
}
