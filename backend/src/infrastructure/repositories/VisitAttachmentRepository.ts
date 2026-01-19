import { db } from '../database/config';
import { VisitAttachment, CreateVisitAttachmentInput } from '../../domain/entities/VisitAttachment';
import { v4 as uuidv4 } from 'uuid';

export class VisitAttachmentRepository {
  findById(id: string): Promise<VisitAttachment | null> {
    const row = db.prepare('SELECT * FROM visit_attachments WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByVisitId(visitId: string): Promise<VisitAttachment[]> {
    const rows = db.prepare('SELECT * FROM visit_attachments WHERE visit_id = ? ORDER BY created_at DESC').all(visitId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  create(data: CreateVisitAttachmentInput): Promise<VisitAttachment> {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO visit_attachments (id, visit_id, name, type, data_url, uploaded_by, uploader_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.visitId,
      data.name,
      data.type,
      data.dataUrl,
      data.uploadedBy,
      data.uploaderType,
      now
    );

    return this.findById(id) as Promise<VisitAttachment>;
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM visit_attachments WHERE id = ?').run(id);
    return Promise.resolve();
  }

  private mapToEntity(row: Record<string, unknown>): VisitAttachment {
    return {
      id: row.id as string,
      visitId: row.visit_id as string,
      name: row.name as string,
      type: row.type as string,
      dataUrl: row.data_url as string,
      uploadedBy: row.uploaded_by as string,
      uploaderType: row.uploader_type as 'doctor' | 'assistant',
      createdAt: new Date(row.created_at as string),
    };
  }
}
