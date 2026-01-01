export type ExpenseCategory = 'rent' | 'utilities' | 'supplies' | 'equipment' | 'maintenance' | 'other';

export interface Expense {
  id: string;
  doctorId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'doctorId' | 'createdAt' | 'updatedAt'>>;
