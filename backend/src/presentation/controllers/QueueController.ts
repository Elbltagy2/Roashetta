import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { QUEUE_VISIT_TYPES } from '../../domain/entities/QueueEntry';
import { QueueRepository } from '../../infrastructure/repositories/QueueRepository';
import { db } from '../../infrastructure/database/config';

export class QueueController {
  async getQueue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queueRepository = new QueueRepository();
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const entries = await queueRepository.findByDate(req.doctorId!, date);

      res.json(entries.map(e => ({
        id: e.id,
        patientId: e.patientId,
        patientName: e.patientName,
        patientPhone: e.patientPhone,
        position: e.position,
        status: e.status,
        visitType: e.visitType,
        addedAt: e.addedAt.toISOString(),
        addedBy: e.addedBy,
        queueDate: e.queueDate,
      })));
    } catch (error) {
      next(error);
    }
  }

  async addToQueue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queueRepository = new QueueRepository();
      const { patientId, visitType } = req.body;

      if (visitType && !QUEUE_VISIT_TYPES.includes(visitType)) {
        return res.status(400).json({ error: `visitType must be one of: ${QUEUE_VISIT_TYPES.join(', ')}` });
      }

      if (!patientId) {
        return res.status(400).json({ error: 'patientId is required' });
      }

      const patient = db.prepare('SELECT * FROM patients WHERE id = ? AND doctor_id = ?')
        .get(patientId, req.doctorId!) as Record<string, unknown> | undefined;

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const today = new Date().toISOString().split('T')[0];
      const existing = await queueRepository.findByPatientAndDate(req.doctorId!, patientId, today);
      if (existing) {
        return res.status(409).json({ error: 'Patient already in queue' });
      }

      const entry = await queueRepository.create({
        doctorId: req.doctorId!,
        patientId,
        patientName: patient.name as string,
        patientPhone: (patient.phone as string) || '',
        addedBy: req.user!.id,
        visitType: visitType || 'examination',
      });

      res.status(201).json({
        id: entry.id,
        patientId: entry.patientId,
        patientName: entry.patientName,
        patientPhone: entry.patientPhone,
        position: entry.position,
        status: entry.status,
        visitType: entry.visitType,
        addedAt: entry.addedAt.toISOString(),
        addedBy: entry.addedBy,
        queueDate: entry.queueDate,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queueRepository = new QueueRepository();
      const { id } = req.params;
      const { status, position, visitType } = req.body;

      if (visitType && !QUEUE_VISIT_TYPES.includes(visitType)) {
        return res.status(400).json({ error: `visitType must be one of: ${QUEUE_VISIT_TYPES.join(', ')}` });
      }

      const entry = await queueRepository.update(id, { status, position, visitType });

      res.json({
        id: entry.id,
        patientId: entry.patientId,
        patientName: entry.patientName,
        patientPhone: entry.patientPhone,
        position: entry.position,
        status: entry.status,
        visitType: entry.visitType,
        addedAt: entry.addedAt.toISOString(),
        addedBy: entry.addedBy,
        queueDate: entry.queueDate,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFromQueue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queueRepository = new QueueRepository();
      await queueRepository.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async reorderQueue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queueRepository = new QueueRepository();
      const { entries } = req.body;

      if (!Array.isArray(entries)) {
        return res.status(400).json({ error: 'entries array is required' });
      }

      await queueRepository.reorder(entries);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
