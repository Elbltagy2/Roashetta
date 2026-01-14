import { db } from '../database/config';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { Visit, CreateVisitInput, UpdateVisitInput } from '../../domain/entities/Visit';
import { v4 as uuidv4 } from 'uuid';

export class VisitRepository implements IVisitRepository {
  findById(id: string): Promise<Visit | null> {
    const row = db.prepare('SELECT * FROM visits WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByPatientId(patientId: string): Promise<Visit[]> {
    const rows = db.prepare('SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC').all(patientId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  findByDoctorId(doctorId: string): Promise<Visit[]> {
    const rows = db.prepare('SELECT * FROM visits WHERE doctor_id = ? ORDER BY visit_date DESC').all(doctorId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  create(data: CreateVisitInput): Promise<Visit> {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO visits (
        id, patient_id, doctor_id, chief_complaint, chief_complaint_drawing,
        diagnosis, diagnosis_drawing, notes, notes_drawing,
        blood_pressure, temperature, weight, visit_date, created_at, updated_at
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
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
      now,
      now,
      now
    );

    return this.findById(id) as Promise<Visit>;
  }

  update(id: string, data: UpdateVisitInput): Promise<Visit> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.chiefComplaint !== undefined) {
      fields.push('chief_complaint = ?');
      values.push(data.chiefComplaint);
    }
    if (data.chiefComplaintDrawing !== undefined) {
      fields.push('chief_complaint_drawing = ?');
      values.push(data.chiefComplaintDrawing);
    }
    if (data.diagnosis !== undefined) {
      fields.push('diagnosis = ?');
      values.push(data.diagnosis);
    }
    if (data.diagnosisDrawing !== undefined) {
      fields.push('diagnosis_drawing = ?');
      values.push(data.diagnosisDrawing);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }
    if (data.notesDrawing !== undefined) {
      fields.push('notes_drawing = ?');
      values.push(data.notesDrawing);
    }
    if (data.vitals?.bloodPressure !== undefined) {
      fields.push('blood_pressure = ?');
      values.push(data.vitals.bloodPressure);
    }
    if (data.vitals?.temperature !== undefined) {
      fields.push('temperature = ?');
      values.push(data.vitals.temperature);
    }
    if (data.vitals?.weight !== undefined) {
      fields.push('weight = ?');
      values.push(data.vitals.weight);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE visits SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id) as Promise<Visit>;
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM visits WHERE id = ?').run(id);
    return Promise.resolve();
  }

  findByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Visit[]> {
    const rows = db.prepare(
      `SELECT * FROM visits
       WHERE doctor_id = ? AND visit_date >= ? AND visit_date <= ?
       ORDER BY visit_date DESC`
    ).all(doctorId, startDate.toISOString(), endDate.toISOString()) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
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
