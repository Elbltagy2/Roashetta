import { db } from '../database/config';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient, CreatePatientInput, UpdatePatientInput } from '../../domain/entities/Patient';
import { v4 as uuidv4 } from 'uuid';

export class PatientRepository implements IPatientRepository {
  findById(id: string): Promise<Patient | null> {
    const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByDoctorId(doctorId: string): Promise<Patient[]> {
    const rows = db.prepare('SELECT * FROM patients WHERE doctor_id = ? ORDER BY created_at DESC').all(doctorId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  findByNationalId(nationalId: string): Promise<Patient | null> {
    const row = db.prepare('SELECT * FROM patients WHERE national_id = ?').get(nationalId) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  create(data: CreatePatientInput): Promise<Patient> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const allergiesJson = data.allergies ? JSON.stringify(data.allergies) : null;

    db.prepare(
      `INSERT INTO patients (id, doctor_id, name, phone, age, gender, national_id, medical_history, allergies, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.doctorId, data.name, data.phone, data.age, data.gender, data.nationalId, data.medicalHistory, allergiesJson, now, now);

    return this.findById(id) as Promise<Patient>;
  }

  update(id: string, data: UpdatePatientInput): Promise<Patient> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.age !== undefined) {
      fields.push('age = ?');
      values.push(data.age);
    }
    if (data.gender !== undefined) {
      fields.push('gender = ?');
      values.push(data.gender);
    }
    if (data.nationalId !== undefined) {
      fields.push('national_id = ?');
      values.push(data.nationalId);
    }
    if (data.medicalHistory !== undefined) {
      fields.push('medical_history = ?');
      values.push(data.medicalHistory);
    }
    if (data.allergies !== undefined) {
      fields.push('allergies = ?');
      values.push(JSON.stringify(data.allergies));
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id) as Promise<Patient>;
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM patients WHERE id = ?').run(id);
    return Promise.resolve();
  }

  search(doctorId: string, query: string): Promise<Patient[]> {
    const searchPattern = `%${query}%`;
    const rows = db.prepare(
      `SELECT * FROM patients
       WHERE doctor_id = ? AND (name LIKE ? OR phone LIKE ? OR national_id LIKE ?)
       ORDER BY name`
    ).all(doctorId, searchPattern, searchPattern, searchPattern) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  private mapToEntity(row: Record<string, unknown>): Patient {
    let allergies: string[] = [];
    if (row.allergies) {
      try {
        allergies = JSON.parse(row.allergies as string);
      } catch {
        allergies = [];
      }
    }

    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      name: row.name as string,
      phone: row.phone as string,
      age: row.age as number,
      gender: row.gender as 'male' | 'female',
      nationalId: row.national_id as string,
      medicalHistory: row.medical_history as string,
      allergies,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
