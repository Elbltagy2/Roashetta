import { db } from '../database/config';
import { Settings, CreateSettingsInput, UpdateSettingsInput } from '../../domain/entities/Settings';
import { v4 as uuidv4 } from 'uuid';

export class SettingsRepository {
  findByDoctorId(doctorId: string): Promise<Settings | null> {
    const row = db.prepare('SELECT * FROM settings WHERE doctor_id = ?').get(doctorId) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  create(data: CreateSettingsInput): Promise<Settings> {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO settings (id, doctor_id, new_visit_price, followup_visit_price, consultation_price, backup_path, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.doctorId,
      data.newVisitPrice,
      data.followupVisitPrice,
      data.consultationPrice ?? 0,
      data.backupPath ?? '',
      now,
      now,
    );

    return this.findByDoctorId(data.doctorId) as Promise<Settings>;
  }

  update(doctorId: string, data: UpdateSettingsInput): Promise<Settings> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.newVisitPrice !== undefined) {
      fields.push('new_visit_price = ?');
      values.push(data.newVisitPrice);
    }
    if (data.followupVisitPrice !== undefined) {
      fields.push('followup_visit_price = ?');
      values.push(data.followupVisitPrice);
    }
    if (data.consultationPrice !== undefined) {
      fields.push('consultation_price = ?');
      values.push(data.consultationPrice);
    }
    if (data.backupPath !== undefined) {
      fields.push('backup_path = ?');
      values.push(data.backupPath);
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(doctorId);

      db.prepare(`UPDATE settings SET ${fields.join(', ')} WHERE doctor_id = ?`).run(...values);
    }

    return this.findByDoctorId(doctorId) as Promise<Settings>;
  }

  async upsert(data: CreateSettingsInput): Promise<Settings> {
    const existing = await this.findByDoctorId(data.doctorId);
    if (existing) {
      return this.update(data.doctorId, {
        newVisitPrice: data.newVisitPrice,
        followupVisitPrice: data.followupVisitPrice,
        consultationPrice: data.consultationPrice,
        backupPath: data.backupPath,
      });
    }
    return this.create(data);
  }

  private mapToEntity(row: Record<string, unknown>): Settings {
    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      newVisitPrice: typeof row.new_visit_price === 'string' ? parseFloat(row.new_visit_price) : (row.new_visit_price as number) || 0,
      followupVisitPrice: typeof row.followup_visit_price === 'string' ? parseFloat(row.followup_visit_price) : (row.followup_visit_price as number) || 0,
      consultationPrice: typeof row.consultation_price === 'string' ? parseFloat(row.consultation_price) : (row.consultation_price as number) || 0,
      backupPath: (row.backup_path as string) || '',
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
