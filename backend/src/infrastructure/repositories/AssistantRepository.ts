import { pool } from '../database/config';
import { IAssistantRepository } from '../../domain/repositories/IAssistantRepository';
import { Assistant, CreateAssistantInput, UpdateAssistantInput, DEFAULT_ASSISTANT_PERMISSIONS } from '../../domain/entities/Assistant';

export class AssistantRepository implements IAssistantRepository {
  async findById(id: string): Promise<Assistant | null> {
    const result = await pool.query('SELECT * FROM assistants WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<Assistant | null> {
    const result = await pool.query('SELECT * FROM assistants WHERE email = $1', [email]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByDoctorId(doctorId: string): Promise<Assistant[]> {
    const result = await pool.query(
      'SELECT * FROM assistants WHERE doctor_id = $1 ORDER BY created_at DESC',
      [doctorId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(data: CreateAssistantInput): Promise<Assistant> {
    const permissions = { ...DEFAULT_ASSISTANT_PERMISSIONS, ...data.permissions };

    const result = await pool.query(
      `INSERT INTO assistants (
        doctor_id, email, password_hash, name, phone,
        can_create_patients, can_edit_patients, can_delete_patients,
        can_create_visits, can_edit_visits, can_delete_visits,
        can_view_prescriptions, can_create_prescriptions, can_manage_records
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        data.doctorId,
        data.email,
        data.passwordHash,
        data.name,
        data.phone || '',
        permissions.canCreatePatients,
        permissions.canEditPatients,
        permissions.canDeletePatients,
        permissions.canCreateVisits,
        permissions.canEditVisits,
        permissions.canDeleteVisits,
        permissions.canViewPrescriptions,
        permissions.canCreatePrescriptions,
        permissions.canManageRecords,
      ]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async update(id: string, data: UpdateAssistantInput): Promise<Assistant> {
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
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }
    if (data.permissions) {
      if (data.permissions.canCreatePatients !== undefined) {
        fields.push(`can_create_patients = $${paramIndex++}`);
        values.push(data.permissions.canCreatePatients);
      }
      if (data.permissions.canEditPatients !== undefined) {
        fields.push(`can_edit_patients = $${paramIndex++}`);
        values.push(data.permissions.canEditPatients);
      }
      if (data.permissions.canDeletePatients !== undefined) {
        fields.push(`can_delete_patients = $${paramIndex++}`);
        values.push(data.permissions.canDeletePatients);
      }
      if (data.permissions.canCreateVisits !== undefined) {
        fields.push(`can_create_visits = $${paramIndex++}`);
        values.push(data.permissions.canCreateVisits);
      }
      if (data.permissions.canEditVisits !== undefined) {
        fields.push(`can_edit_visits = $${paramIndex++}`);
        values.push(data.permissions.canEditVisits);
      }
      if (data.permissions.canDeleteVisits !== undefined) {
        fields.push(`can_delete_visits = $${paramIndex++}`);
        values.push(data.permissions.canDeleteVisits);
      }
      if (data.permissions.canViewPrescriptions !== undefined) {
        fields.push(`can_view_prescriptions = $${paramIndex++}`);
        values.push(data.permissions.canViewPrescriptions);
      }
      if (data.permissions.canCreatePrescriptions !== undefined) {
        fields.push(`can_create_prescriptions = $${paramIndex++}`);
        values.push(data.permissions.canCreatePrescriptions);
      }
      if (data.permissions.canManageRecords !== undefined) {
        fields.push(`can_manage_records = $${paramIndex++}`);
        values.push(data.permissions.canManageRecords);
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE assistants SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM assistants WHERE id = $1', [id]);
  }

  private mapToEntity(row: Record<string, unknown>): Assistant {
    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      name: row.name as string,
      phone: row.phone as string,
      isActive: row.is_active as boolean,
      permissions: {
        canCreatePatients: row.can_create_patients as boolean,
        canEditPatients: row.can_edit_patients as boolean,
        canDeletePatients: row.can_delete_patients as boolean,
        canCreateVisits: row.can_create_visits as boolean,
        canEditVisits: row.can_edit_visits as boolean,
        canDeleteVisits: row.can_delete_visits as boolean,
        canViewPrescriptions: row.can_view_prescriptions as boolean,
        canCreatePrescriptions: row.can_create_prescriptions as boolean,
        canManageRecords: row.can_manage_records as boolean,
      },
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
