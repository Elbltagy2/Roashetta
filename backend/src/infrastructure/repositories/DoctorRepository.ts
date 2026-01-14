import { db } from '../database/config';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { Doctor, CreateDoctorInput, UpdateDoctorInput } from '../../domain/entities/Doctor';
import { v4 as uuidv4 } from 'uuid';

export class DoctorRepository implements IDoctorRepository {
  findById(id: string): Promise<Doctor | null> {
    const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByEmail(email: string): Promise<Doctor | null> {
    const row = db.prepare('SELECT * FROM doctors WHERE email = ?').get(email) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  create(data: CreateDoctorInput): Promise<Doctor> {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO doctors (id, email, password_hash, name, specialization, phone, clinic_name, clinic_address, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.email, data.passwordHash, data.name, data.specialization, data.phone, data.clinicName, data.clinicAddress, now, now);

    return this.findById(id) as Promise<Doctor>;
  }

  update(id: string, data: UpdateDoctorInput): Promise<Doctor> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.specialization !== undefined) {
      fields.push('specialization = ?');
      values.push(data.specialization);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.clinicName !== undefined) {
      fields.push('clinic_name = ?');
      values.push(data.clinicName);
    }
    if (data.clinicAddress !== undefined) {
      fields.push('clinic_address = ?');
      values.push(data.clinicAddress);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id) as Promise<Doctor>;
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM doctors WHERE id = ?').run(id);
    return Promise.resolve();
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
