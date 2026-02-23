import { db } from '../database/config';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { QueueEntry, CreateQueueEntryInput, UpdateQueueEntryInput } from '../../domain/entities/QueueEntry';
import { v4 as uuidv4 } from 'uuid';

export class QueueRepository implements IQueueRepository {
  findById(id: string): Promise<QueueEntry | null> {
    const row = db.prepare('SELECT * FROM queue WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByDate(doctorId: string, date: string): Promise<QueueEntry[]> {
    const rows = db.prepare(
      'SELECT * FROM queue WHERE doctor_id = ? AND queue_date = ? ORDER BY position ASC'
    ).all(doctorId, date) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  findByPatientAndDate(doctorId: string, patientId: string, date: string): Promise<QueueEntry | null> {
    const row = db.prepare(
      'SELECT * FROM queue WHERE doctor_id = ? AND patient_id = ? AND queue_date = ?'
    ).get(doctorId, patientId, date) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  async create(data: CreateQueueEntryInput): Promise<QueueEntry> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    const position = await this.getNextPosition(data.doctorId, today);

    db.prepare(
      `INSERT INTO queue (id, doctor_id, patient_id, patient_name, patient_phone, position, status, added_at, added_by, queue_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.doctorId, data.patientId, data.patientName, data.patientPhone, position, 'waiting', now, data.addedBy, today);

    return this.findById(id) as Promise<QueueEntry>;
  }

  update(id: string, data: UpdateQueueEntryInput): Promise<QueueEntry> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.position !== undefined) {
      fields.push('position = ?');
      values.push(data.position);
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE queue SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.findById(id) as Promise<QueueEntry>;
  }

  reorder(entries: { id: string; position: number }[]): Promise<void> {
    for (const entry of entries) {
      db.prepare('UPDATE queue SET position = ? WHERE id = ?').run(entry.position, entry.id);
    }
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM queue WHERE id = ?').run(id);
    return Promise.resolve();
  }

  async getNextPosition(doctorId: string, date: string): Promise<number> {
    const row = db.prepare(
      'SELECT MAX(position) as max_pos FROM queue WHERE doctor_id = ? AND queue_date = ?'
    ).get(doctorId, date) as Record<string, unknown> | undefined;
    const maxPos = row?.max_pos as number | null;
    return Promise.resolve((maxPos ?? 0) + 1);
  }

  private mapToEntity(row: Record<string, unknown>): QueueEntry {
    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      patientId: row.patient_id as string,
      patientName: row.patient_name as string,
      patientPhone: row.patient_phone as string,
      position: row.position as number,
      status: row.status as QueueEntry['status'],
      addedAt: new Date(row.added_at as string),
      addedBy: row.added_by as string,
      queueDate: row.queue_date as string,
    };
  }
}
