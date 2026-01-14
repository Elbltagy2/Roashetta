import { db } from '../database/config';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { Expense, CreateExpenseInput, UpdateExpenseInput } from '../../domain/entities/Expense';
import { v4 as uuidv4 } from 'uuid';

export class ExpenseRepository implements IExpenseRepository {
  findById(id: string): Promise<Expense | null> {
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByDoctorId(doctorId: string): Promise<Expense[]> {
    const rows = db.prepare('SELECT * FROM expenses WHERE doctor_id = ? ORDER BY expense_date DESC').all(doctorId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  findByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    const rows = db.prepare(
      `SELECT * FROM expenses
       WHERE doctor_id = ? AND expense_date >= ? AND expense_date <= ?
       ORDER BY expense_date DESC`
    ).all(doctorId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  create(data: CreateExpenseInput): Promise<Expense> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const expenseDate = data.expenseDate instanceof Date
      ? data.expenseDate.toISOString().split('T')[0]
      : data.expenseDate;

    db.prepare(
      `INSERT INTO expenses (id, doctor_id, amount, category, description, expense_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.doctorId, data.amount, data.category, data.description, expenseDate, now, now);

    return this.findById(id) as Promise<Expense>;
  }

  update(id: string, data: UpdateExpenseInput): Promise<Expense> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.amount !== undefined) {
      fields.push('amount = ?');
      values.push(data.amount);
    }
    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.expenseDate !== undefined) {
      fields.push('expense_date = ?');
      const expenseDate = data.expenseDate instanceof Date
        ? data.expenseDate.toISOString().split('T')[0]
        : data.expenseDate;
      values.push(expenseDate);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id) as Promise<Expense>;
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    return Promise.resolve();
  }

  private mapToEntity(row: Record<string, unknown>): Expense {
    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      amount: typeof row.amount === 'string' ? parseFloat(row.amount) : (row.amount as number),
      category: row.category as Expense['category'],
      description: row.description as string,
      expenseDate: new Date(row.expense_date as string),
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
