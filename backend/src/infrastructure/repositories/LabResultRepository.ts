import { db } from '../database/config';
import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
import { LabResult, CreateLabResultInput, UpdateLabResultInput } from '../../domain/entities/LabResult';
import { v4 as uuidv4 } from 'uuid';

export class LabResultRepository implements ILabResultRepository {
  findById(id: string): Promise<LabResult | null> {
    const row = db.prepare('SELECT * FROM lab_results WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByPatientId(patientId: string, doctorId: string): Promise<LabResult[]> {
    const rows = db.prepare(
      `SELECT * FROM lab_results
       WHERE patient_id = ? AND doctor_id = ?
       ORDER BY test_date DESC, created_at DESC`
    ).all(patientId, doctorId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  findByDateRange(patientId: string, doctorId: string, startDate: Date, endDate: Date): Promise<LabResult[]> {
    const rows = db.prepare(
      `SELECT * FROM lab_results
       WHERE patient_id = ? AND doctor_id = ? AND test_date >= ? AND test_date <= ?
       ORDER BY test_date DESC, created_at DESC`
    ).all(patientId, doctorId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  create(data: CreateLabResultInput): Promise<LabResult> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const testDate = data.testDate instanceof Date
      ? data.testDate.toISOString().split('T')[0]
      : data.testDate;

    db.prepare(
      `INSERT INTO lab_results (id, patient_id, doctor_id, category, test_name, result_value, unit, reference_range, is_abnormal, test_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.patientId,
      data.doctorId,
      data.category,
      data.testName,
      data.resultValue,
      data.unit || null,
      data.referenceRange || null,
      data.isAbnormal ? 1 : 0,
      testDate,
      data.notes || null,
      now,
      now
    );

    return this.findById(id) as Promise<LabResult>;
  }

  update(id: string, doctorId: string, data: UpdateLabResultInput): Promise<LabResult | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }
    if (data.testName !== undefined) {
      fields.push('test_name = ?');
      values.push(data.testName);
    }
    if (data.resultValue !== undefined) {
      fields.push('result_value = ?');
      values.push(data.resultValue);
    }
    if (data.unit !== undefined) {
      fields.push('unit = ?');
      values.push(data.unit);
    }
    if (data.referenceRange !== undefined) {
      fields.push('reference_range = ?');
      values.push(data.referenceRange);
    }
    if (data.isAbnormal !== undefined) {
      fields.push('is_abnormal = ?');
      values.push(data.isAbnormal ? 1 : 0);
    }
    if (data.testDate !== undefined) {
      fields.push('test_date = ?');
      const testDate = data.testDate instanceof Date
        ? data.testDate.toISOString().split('T')[0]
        : data.testDate;
      values.push(testDate);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id, doctorId);

    const result = db.prepare(`UPDATE lab_results SET ${fields.join(', ')} WHERE id = ? AND doctor_id = ?`).run(...values);

    if (result.changes === 0) {
      return Promise.resolve(null);
    }

    return this.findById(id);
  }

  delete(id: string, doctorId: string): Promise<boolean> {
    const result = db.prepare('DELETE FROM lab_results WHERE id = ? AND doctor_id = ?').run(id, doctorId);
    return Promise.resolve(result.changes > 0);
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
      isAbnormal: Boolean(row.is_abnormal),
      testDate: new Date(row.test_date as string),
      notes: row.notes as string | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
