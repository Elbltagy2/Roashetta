import { Expense, CreateExpenseInput, UpdateExpenseInput } from '../entities/Expense';

export interface IExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  findByDoctorId(doctorId: string): Promise<Expense[]>;
  findByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Expense[]>;
  create(data: CreateExpenseInput): Promise<Expense>;
  update(id: string, data: UpdateExpenseInput): Promise<Expense>;
  delete(id: string): Promise<void>;
}
