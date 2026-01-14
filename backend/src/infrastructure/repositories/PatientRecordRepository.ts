import { db } from '../database/config';
import { IPatientRecordRepository } from '../../domain/repositories/IPatientRecordRepository';
import { PatientRecord, CreatePatientRecordInput } from '../../domain/entities/PatientRecord';
import { v4 as uuidv4 } from 'uuid';

export class PatientRecordRepository implements IPatientRecordRepository {
  findById(id: string): Promise<PatientRecord | null> {
    const row = db.prepare('SELECT * FROM patient_records WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByPatientId(patientId: string): Promise<PatientRecord[]> {
    const rows = db.prepare('SELECT * FROM patient_records WHERE patient_id = ? ORDER BY uploaded_at DESC').all(patientId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  create(data: CreatePatientRecordInput): Promise<PatientRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO patient_records (id, patient_id, name, file_type, file_url, file_size, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.patientId, data.name, data.fileType, data.fileUrl, data.fileSize, now);

    return this.findById(id) as Promise<PatientRecord>;
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM patient_records WHERE id = ?').run(id);
    return Promise.resolve();
  }

  private mapToEntity(row: Record<string, unknown>): PatientRecord {
    return {
      id: row.id as string,
      patientId: row.patient_id as string,
      name: row.name as string,
      fileType: row.file_type as string,
      fileUrl: row.file_url as string,
      fileSize: row.file_size as number,
      uploadedAt: new Date(row.uploaded_at as string),
    };
  }
}
