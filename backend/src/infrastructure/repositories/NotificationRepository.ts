import { db } from '../database/config';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification, CreateNotificationInput } from '../../domain/entities/Notification';
import { v4 as uuidv4 } from 'uuid';

export class NotificationRepository implements INotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification> {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO notifications (
        id, doctor_id, type, title, message, data,
        created_by_id, created_by_name, created_by_role, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.doctorId,
      input.type,
      input.title,
      input.message,
      JSON.stringify(input.data),
      input.createdById,
      input.createdByName,
      input.createdByRole,
      now
    );

    return this.findById(id) as Promise<Notification>;
  }

  findById(id: string): Promise<Notification | null> {
    const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByDoctorId(doctorId: string, limit: number = 50): Promise<Notification[]> {
    const rows = db.prepare(
      `SELECT * FROM notifications
       WHERE doctor_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    ).all(doctorId, limit) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  findUnreadCount(doctorId: string): Promise<number> {
    const row = db.prepare(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE doctor_id = ? AND is_read = 0`
    ).get(doctorId) as { count: number };
    return Promise.resolve(row.count);
  }

  markAsRead(id: string): Promise<void> {
    db.prepare(
      `UPDATE notifications
       SET is_read = 1, read_at = datetime('now')
       WHERE id = ?`
    ).run(id);
    return Promise.resolve();
  }

  markAllAsRead(doctorId: string): Promise<void> {
    db.prepare(
      `UPDATE notifications
       SET is_read = 1, read_at = datetime('now')
       WHERE doctor_id = ? AND is_read = 0`
    ).run(doctorId);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    return Promise.resolve();
  }

  deleteAll(doctorId: string): Promise<void> {
    db.prepare('DELETE FROM notifications WHERE doctor_id = ?').run(doctorId);
    return Promise.resolve();
  }

  private mapToEntity(row: Record<string, unknown>): Notification {
    return {
      id: row.id as string,
      doctorId: row.doctor_id as string,
      type: row.type as Notification['type'],
      title: row.title as string,
      message: row.message as string,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : (row.data as Record<string, unknown>),
      isRead: Boolean(row.is_read),
      createdById: row.created_by_id as string,
      createdByName: row.created_by_name as string,
      createdByRole: row.created_by_role as 'doctor' | 'assistant',
      createdAt: new Date(row.created_at as string),
      readAt: row.read_at ? new Date(row.read_at as string) : null,
    };
  }
}
