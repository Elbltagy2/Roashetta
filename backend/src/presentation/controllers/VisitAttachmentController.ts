import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { VisitAttachmentRepository } from '../../infrastructure/repositories/VisitAttachmentRepository';
import { VisitRepository } from '../../infrastructure/repositories/VisitRepository';

const attachmentRepository = new VisitAttachmentRepository();
const visitRepository = new VisitRepository();

export class VisitAttachmentController {
  async getByVisitId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { visitId } = req.params;

      // Verify the visit belongs to the doctor
      const visit = await visitRepository.findById(visitId);
      if (!visit || visit.doctorId !== req.doctorId) {
        return res.status(404).json({ error: 'Visit not found' });
      }

      const attachments = await attachmentRepository.findByVisitId(visitId);
      res.json(attachments);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { visitId } = req.params;
      const { name, type, dataUrl } = req.body;

      // Verify the visit belongs to the doctor
      const visit = await visitRepository.findById(visitId);
      if (!visit || visit.doctorId !== req.doctorId) {
        return res.status(404).json({ error: 'Visit not found' });
      }

      const attachment = await attachmentRepository.create({
        visitId,
        name,
        type,
        dataUrl,
        uploadedBy: req.user!.id,
        uploaderType: req.user!.role as 'doctor' | 'assistant',
      });

      res.status(201).json(attachment);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Find the attachment
      const attachment = await attachmentRepository.findById(id);
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Verify the visit belongs to the doctor
      const visit = await visitRepository.findById(attachment.visitId);
      if (!visit || visit.doctorId !== req.doctorId) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      await attachmentRepository.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
