import { pool } from '../database/config';
import { IPatientRecordRepository } from '../../domain/repositories/IPatientRecordRepository';
import { PatientRecord, CreatePatientRecordInput } from '../../domain/entities/PatientRecord';

export class PatientRecordRepository implements IPatientRecordRepository {
  async findById(id: string): Promise<PatientRecord | null> {
    const result = await pool.query('SELECT * FROM patient_records WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByPatientId(patientId: string): Promise<PatientRecord[]> {
    const result = await pool.query(
      'SELECT * FROM patient_records WHERE patient_id = $1 ORDER BY uploaded_at DESC',
      [patientId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data: CreatePatientRecordInput): Promise<PatientRecord> {
    const result = await pool.query(
      `INSERT INTO patient_records (patient_id, name, file_type, file_url, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.patientId, data.name, data.fileType, data.fileUrl, data.fileSize]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM patient_records WHERE id = $1', [id]);
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
