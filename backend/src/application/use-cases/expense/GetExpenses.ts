import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import { Expense } from '../../../domain/entities/Expense';

export class GetExpenses {
  constructor(private expenseRepository: IExpenseRepository) {}

  async execute(doctorId: string): Promise<Expense[]> {
    return this.expenseRepository.findByDoctorId(doctorId);
  }

  async executeByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    return this.expenseRepository.findByDateRange(doctorId, startDate, endDate);
  }
}
