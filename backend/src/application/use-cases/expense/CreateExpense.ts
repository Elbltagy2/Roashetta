import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import { Expense, CreateExpenseInput } from '../../../domain/entities/Expense';

export class CreateExpense {
  constructor(private expenseRepository: IExpenseRepository) {}

  async execute(input: CreateExpenseInput): Promise<Expense> {
    return this.expenseRepository.create(input);
  }
}
