import { pool } from '../database/config';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { Expense, CreateExpenseInput, UpdateExpenseInput } from '../../domain/entities/Expense';

export class ExpenseRepository implements IExpenseRepository {
  async findById(id: string): Promise<Expense | null> {
    const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByDoctorId(doctorId: string): Promise<Expense[]> {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE doctor_id = $1 ORDER BY expense_date DESC',
      [doctorId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    const result = await pool.query(
      `SELECT * FROM expenses
       WHERE doctor_id = $1 AND expense_date >= $2 AND expense_date <= $3
       ORDER BY expense_date DESC`,
      [doctorId, startDate, endDate]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data: CreateExpenseInput): Promise<Expense> {
    const result = await pool.query(
      `INSERT INTO expenses (doctor_id, amount, category, description, expense_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.doctorId, data.amount, data.category, data.description, data.expenseDate]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async update(id: string, data: UpdateExpenseInput): Promise<Expense> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      values.push(data.amount);
    }
    if (data.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.expenseDate !== undefined) {
      fields.push(`expense_date = $${paramIndex++}`);
      values.push(data.expenseDate);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
  }

  private mapToEntity(row: Record<string, unknown>): Expense {
    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      amount: parseFloat(row.amount as string),
      category: row.category as Expense['category'],
      description: row.description as string,
      expenseDate: new Date(row.expense_date as string),
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
