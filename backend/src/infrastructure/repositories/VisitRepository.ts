import { pool } from '../database/config';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { Visit, CreateVisitInput, UpdateVisitInput } from '../../domain/entities/Visit';

export class VisitRepository implements IVisitRepository {
  async findById(id: string): Promise<Visit | null> {
    const result = await pool.query('SELECT * FROM visits WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByPatientId(patientId: string): Promise<Visit[]> {
    const result = await pool.query(
      'SELECT * FROM visits WHERE patient_id = $1 ORDER BY visit_date DESC',
      [patientId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByDoctorId(doctorId: string): Promise<Visit[]> {
    const result = await pool.query(
      'SELECT * FROM visits WHERE doctor_id = $1 ORDER BY visit_date DESC',
      [doctorId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data: CreateVisitInput): Promise<Visit> {
    const result = await pool.query(
      `INSERT INTO visits (
        patient_id, doctor_id, chief_complaint, chief_complaint_drawing,
        diagnosis, diagnosis_drawing, notes, notes_drawing,
        blood_pressure, temperature, weight
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.patientId,
        data.doctorId,
        data.chiefComplaint,
        data.chiefComplaintDrawing,
        data.diagnosis,
        data.diagnosisDrawing,
        data.notes,
        data.notesDrawing,
        data.vitals?.bloodPressure,
        data.vitals?.temperature,
        data.vitals?.weight,
      ]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async update(id: string, data: UpdateVisitInput): Promise<Visit> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.chiefComplaint !== undefined) {
      fields.push(`chief_complaint = $${paramIndex++}`);
      values.push(data.chiefComplaint);
    }
    if (data.chiefComplaintDrawing !== undefined) {
      fields.push(`chief_complaint_drawing = $${paramIndex++}`);
      values.push(data.chiefComplaintDrawing);
    }
    if (data.diagnosis !== undefined) {
      fields.push(`diagnosis = $${paramIndex++}`);
      values.push(data.diagnosis);
    }
    if (data.diagnosisDrawing !== undefined) {
      fields.push(`diagnosis_drawing = $${paramIndex++}`);
      values.push(data.diagnosisDrawing);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }
    if (data.notesDrawing !== undefined) {
      fields.push(`notes_drawing = $${paramIndex++}`);
      values.push(data.notesDrawing);
    }
    if (data.vitals?.bloodPressure !== undefined) {
      fields.push(`blood_pressure = $${paramIndex++}`);
      values.push(data.vitals.bloodPressure);
    }
    if (data.vitals?.temperature !== undefined) {
      fields.push(`temperature = $${paramIndex++}`);
      values.push(data.vitals.temperature);
    }
    if (data.vitals?.weight !== undefined) {
      fields.push(`weight = $${paramIndex++}`);
      values.push(data.vitals.weight);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE visits SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM visits WHERE id = $1', [id]);
  }

  async findByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Visit[]> {
    const result = await pool.query(
      `SELECT * FROM visits
       WHERE doctor_id = $1 AND visit_date >= $2 AND visit_date <= $3
       ORDER BY visit_date DESC`,
      [doctorId, startDate, endDate]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  private mapToEntity(row: Record<string, unknown>): Visit {
    return {
      id: row.id as string,
      patientId: row.patient_id as string,
      doctorId: row.doctor_id as string,
      visitDate: new Date(row.visit_date as string),
      chiefComplaint: row.chief_complaint as string,
      chiefComplaintDrawing: row.chief_complaint_drawing as string | null,
      diagnosis: row.diagnosis as string,
      diagnosisDrawing: row.diagnosis_drawing as string | null,
      notes: row.notes as string,
      notesDrawing: row.notes_drawing as string | null,
      vitals: {
        bloodPressure: row.blood_pressure as string,
        temperature: row.temperature as number,
        weight: row.weight as number,
      },
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
