import { pool } from '../database/config';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { Doctor, CreateDoctorInput, UpdateDoctorInput } from '../../domain/entities/Doctor';

export class DoctorRepository implements IDoctorRepository {
  async findById(id: string): Promise<Doctor | null> {
    const result = await pool.query(
      'SELECT * FROM doctors WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    const result = await pool.query(
      'SELECT * FROM doctors WHERE email = $1',
      [email]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async create(data: CreateDoctorInput): Promise<Doctor> {
    const result = await pool.query(
      `INSERT INTO doctors (email, password_hash, name, specialization, phone, clinic_name, clinic_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.email, data.passwordHash, data.name, data.specialization, data.phone, data.clinicName, data.clinicAddress]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async update(id: string, data: UpdateDoctorInput): Promise<Doctor> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.specialization !== undefined) {
      fields.push(`specialization = $${paramIndex++}`);
      values.push(data.specialization);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.clinicName !== undefined) {
      fields.push(`clinic_name = $${paramIndex++}`);
      values.push(data.clinicName);
    }
    if (data.clinicAddress !== undefined) {
      fields.push(`clinic_address = $${paramIndex++}`);
      values.push(data.clinicAddress);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE doctors SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM doctors WHERE id = $1', [id]);
  }

  private mapToEntity(row: Record<string, unknown>): Doctor {
    return {
      id: row.id as string,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      name: row.name as string,
      specialization: row.specialization as string,
      phone: row.phone as string,
      clinicName: row.clinic_name as string,
      clinicAddress: row.clinic_address as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
