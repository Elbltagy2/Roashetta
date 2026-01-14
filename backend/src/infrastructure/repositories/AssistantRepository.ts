import { db } from '../database/config';
import { IAssistantRepository } from '../../domain/repositories/IAssistantRepository';
import { Assistant, CreateAssistantInput, UpdateAssistantInput, DEFAULT_ASSISTANT_PERMISSIONS } from '../../domain/entities/Assistant';
import { v4 as uuidv4 } from 'uuid';

export class AssistantRepository implements IAssistantRepository {
  findById(id: string): Promise<Assistant | null> {
    const row = db.prepare('SELECT * FROM assistants WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByEmail(email: string): Promise<Assistant | null> {
    const row = db.prepare('SELECT * FROM assistants WHERE email = ?').get(email) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByDoctorId(doctorId: string): Promise<Assistant[]> {
    const rows = db.prepare('SELECT * FROM assistants WHERE doctor_id = ? ORDER BY created_at DESC').all(doctorId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  create(data: CreateAssistantInput): Promise<Assistant> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const permissions = { ...DEFAULT_ASSISTANT_PERMISSIONS, ...data.permissions };

    db.prepare(
      `INSERT INTO assistants (
        id, doctor_id, email, password_hash, name, phone,
        can_create_patients, can_edit_patients, can_delete_patients,
        can_create_visits, can_edit_visits, can_delete_visits,
        can_view_prescriptions, can_create_prescriptions, can_manage_records,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.doctorId,
      data.email,
      data.passwordHash,
      data.name,
      data.phone || '',
      permissions.canCreatePatients ? 1 : 0,
      permissions.canEditPatients ? 1 : 0,
      permissions.canDeletePatients ? 1 : 0,
      permissions.canCreateVisits ? 1 : 0,
      permissions.canEditVisits ? 1 : 0,
      permissions.canDeleteVisits ? 1 : 0,
      permissions.canViewPrescriptions ? 1 : 0,
      permissions.canCreatePrescriptions ? 1 : 0,
      permissions.canManageRecords ? 1 : 0,
      now,
      now
    );

    return this.findById(id) as Promise<Assistant>;
  }

  update(id: string, data: UpdateAssistantInput): Promise<Assistant> {
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
    if (data.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }
    if (data.permissions) {
      if (data.permissions.canCreatePatients !== undefined) {
        fields.push('can_create_patients = ?');
        values.push(data.permissions.canCreatePatients ? 1 : 0);
      }
      if (data.permissions.canEditPatients !== undefined) {
        fields.push('can_edit_patients = ?');
        values.push(data.permissions.canEditPatients ? 1 : 0);
      }
      if (data.permissions.canDeletePatients !== undefined) {
        fields.push('can_delete_patients = ?');
        values.push(data.permissions.canDeletePatients ? 1 : 0);
      }
      if (data.permissions.canCreateVisits !== undefined) {
        fields.push('can_create_visits = ?');
        values.push(data.permissions.canCreateVisits ? 1 : 0);
      }
      if (data.permissions.canEditVisits !== undefined) {
        fields.push('can_edit_visits = ?');
        values.push(data.permissions.canEditVisits ? 1 : 0);
      }
      if (data.permissions.canDeleteVisits !== undefined) {
        fields.push('can_delete_visits = ?');
        values.push(data.permissions.canDeleteVisits ? 1 : 0);
      }
      if (data.permissions.canViewPrescriptions !== undefined) {
        fields.push('can_view_prescriptions = ?');
        values.push(data.permissions.canViewPrescriptions ? 1 : 0);
      }
      if (data.permissions.canCreatePrescriptions !== undefined) {
        fields.push('can_create_prescriptions = ?');
        values.push(data.permissions.canCreatePrescriptions ? 1 : 0);
      }
      if (data.permissions.canManageRecords !== undefined) {
        fields.push('can_manage_records = ?');
        values.push(data.permissions.canManageRecords ? 1 : 0);
      }
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE assistants SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id) as Promise<Assistant>;
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM assistants WHERE id = ?').run(id);
    return Promise.resolve();
  }

  private mapToEntity(row: Record<string, unknown>): Assistant {
    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      name: row.name as string,
      phone: row.phone as string,
      isActive: Boolean(row.is_active),
      permissions: {
        canCreatePatients: Boolean(row.can_create_patients),
        canEditPatients: Boolean(row.can_edit_patients),
        canDeletePatients: Boolean(row.can_delete_patients),
        canCreateVisits: Boolean(row.can_create_visits),
        canEditVisits: Boolean(row.can_edit_visits),
        canDeleteVisits: Boolean(row.can_delete_visits),
        canViewPrescriptions: Boolean(row.can_view_prescriptions),
        canCreatePrescriptions: Boolean(row.can_create_prescriptions),
        canManageRecords: Boolean(row.can_manage_records),
      },
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
