import { pool } from '../database/config';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification, CreateNotificationInput } from '../../domain/entities/Notification';

export class NotificationRepository implements INotificationRepository {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const result = await pool.query(
      `INSERT INTO notifications (
        doctor_id, type, title, message, data,
        created_by_id, created_by_name, created_by_role
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        input.doctorId,
        input.type,
        input.title,
        input.message,
        JSON.stringify(input.data),
        input.createdById,
        input.createdByName,
        input.createdByRole,
      ]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async findByDoctorId(doctorId: string, limit: number = 50): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE doctor_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [doctorId, limit]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findUnreadCount(doctorId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE doctor_id = $1 AND is_read = false`,
      [doctorId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async markAsRead(id: string): Promise<void> {
    await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
  }

  async markAllAsRead(doctorId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE doctor_id = $1 AND is_read = false`,
      [doctorId]
    );
  }

  async delete(id: string): Promise<void> {
    await pool.query(
      `DELETE FROM notifications WHERE id = $1`,
      [id]
    );
  }

  async deleteAll(doctorId: string): Promise<void> {
    await pool.query(
      `DELETE FROM notifications WHERE doctor_id = $1`,
      [doctorId]
    );
  }

  private mapToEntity(row: Record<string, unknown>): Notification {
    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      type: row.type as Notification['type'],
      title: row.title as string,
      message: row.message as string,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : (row.data as Record<string, any>),
      isRead: row.is_read as boolean,
      createdById: row.created_by_id as string,
      createdByName: row.created_by_name as string,
      createdByRole: row.created_by_role as 'doctor' | 'assistant',
      createdAt: new Date(row.created_at as string),
      readAt: row.read_at ? new Date(row.read_at as string) : null,
    };
  }
}
