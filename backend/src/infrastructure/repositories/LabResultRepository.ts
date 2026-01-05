import { pool } from '../database/config';
import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
import { LabResult, CreateLabResultInput, UpdateLabResultInput } from '../../domain/entities/LabResult';

export class LabResultRepository implements ILabResultRepository {
  async findById(id: string): Promise<LabResult | null> {
    const result = await pool.query('SELECT * FROM lab_results WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByPatientId(patientId: string, doctorId: string): Promise<LabResult[]> {
    const result = await pool.query(
      `SELECT * FROM lab_results
       WHERE patient_id = $1 AND doctor_id = $2
       ORDER BY test_date DESC, created_at DESC`,
      [patientId, doctorId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByDateRange(patientId: string, doctorId: string, startDate: Date, endDate: Date): Promise<LabResult[]> {
    const result = await pool.query(
      `SELECT * FROM lab_results
       WHERE patient_id = $1 AND doctor_id = $2 AND test_date >= $3 AND test_date <= $4
       ORDER BY test_date DESC, created_at DESC`,
      [patientId, doctorId, startDate, endDate]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data: CreateLabResultInput): Promise<LabResult> {
    const result = await pool.query(
      `INSERT INTO lab_results (patient_id, doctor_id, category, test_name, result_value, unit, reference_range, is_abnormal, test_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.patientId,
        data.doctorId,
        data.category,
        data.testName,
        data.resultValue,
        data.unit || null,
        data.referenceRange || null,
        data.isAbnormal || false,
        data.testDate,
        data.notes || null
      ]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async update(id: string, doctorId: string, data: UpdateLabResultInput): Promise<LabResult | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.testName !== undefined) {
      fields.push(`test_name = $${paramIndex++}`);
      values.push(data.testName);
    }
    if (data.resultValue !== undefined) {
      fields.push(`result_value = $${paramIndex++}`);
      values.push(data.resultValue);
    }
    if (data.unit !== undefined) {
      fields.push(`unit = $${paramIndex++}`);
      values.push(data.unit);
    }
    if (data.referenceRange !== undefined) {
      fields.push(`reference_range = $${paramIndex++}`);
      values.push(data.referenceRange);
    }
    if (data.isAbnormal !== undefined) {
      fields.push(`is_abnormal = $${paramIndex++}`);
      values.push(data.isAbnormal);
    }
    if (data.testDate !== undefined) {
      fields.push(`test_date = $${paramIndex++}`);
      values.push(data.testDate);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, doctorId);

    const result = await pool.query(
      `UPDATE lab_results SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND doctor_id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async delete(id: string, doctorId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM lab_results WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  private mapToEntity(row: Record<string, unknown>): LabResult {
    return {
      id: row.id as string,
      patientId: row.patient_id as string,
      doctorId: row.doctor_id as string,
      category: row.category as LabResult['category'],
      testName: row.test_name as string,
      resultValue: row.result_value as string,
      unit: row.unit as string | null,
      referenceRange: row.reference_range as string | null,
      isAbnormal: row.is_abnormal as boolean,
      testDate: new Date(row.test_date as string),
      notes: row.notes as string | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
