import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import { Expense, UpdateExpenseInput } from '../../../domain/entities/Expense';

export class UpdateExpense {
  constructor(private expenseRepository: IExpenseRepository) {}

  async execute(id: string, doctorId: string, input: UpdateExpenseInput): Promise<Expense> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    if (expense.doctorId !== doctorId) {
      throw new Error('Unauthorized access to expense');
    }
    return this.expenseRepository.update(id, input);
  }
}
