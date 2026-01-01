import { pool } from '../database/config';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient, CreatePatientInput, UpdatePatientInput } from '../../domain/entities/Patient';

export class PatientRepository implements IPatientRepository {
  async findById(id: string): Promise<Patient | null> {
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByDoctorId(doctorId: string): Promise<Patient[]> {
    const result = await pool.query(
      'SELECT * FROM patients WHERE doctor_id = $1 ORDER BY created_at DESC',
      [doctorId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByNationalId(nationalId: string): Promise<Patient | null> {
    const result = await pool.query(
      'SELECT * FROM patients WHERE national_id = $1',
      [nationalId]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async create(data: CreatePatientInput): Promise<Patient> {
    const result = await pool.query(
      `INSERT INTO patients (doctor_id, name, phone, age, gender, national_id, medical_history, allergies)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.doctorId, data.name, data.phone, data.age, data.gender, data.nationalId, data.medicalHistory, data.allergies]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async update(id: string, data: UpdatePatientInput): Promise<Patient> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.age !== undefined) {
      fields.push(`age = $${paramIndex++}`);
      values.push(data.age);
    }
    if (data.gender !== undefined) {
      fields.push(`gender = $${paramIndex++}`);
      values.push(data.gender);
    }
    if (data.nationalId !== undefined) {
      fields.push(`national_id = $${paramIndex++}`);
      values.push(data.nationalId);
    }
    if (data.medicalHistory !== undefined) {
      fields.push(`medical_history = $${paramIndex++}`);
      values.push(data.medicalHistory);
    }
    if (data.allergies !== undefined) {
      fields.push(`allergies = $${paramIndex++}`);
      values.push(data.allergies);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE patients SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM patients WHERE id = $1', [id]);
  }

  async search(doctorId: string, query: string): Promise<Patient[]> {
    const result = await pool.query(
      `SELECT * FROM patients
       WHERE doctor_id = $1 AND (name ILIKE $2 OR phone ILIKE $2 OR national_id ILIKE $2)
       ORDER BY name`,
      [doctorId, `%${query}%`]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  private mapToEntity(row: Record<string, unknown>): Patient {
    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      name: row.name as string,
      phone: row.phone as string,
      age: row.age as number,
      gender: row.gender as 'male' | 'female',
      nationalId: row.national_id as string,
      medicalHistory: row.medical_history as string,
      allergies: row.allergies as string[],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
