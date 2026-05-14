import { Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AuthRequest } from '../middleware/authMiddleware';
import { CreateVisit } from '../../application/use-cases/visit/CreateVisit';
import { GetVisitsByPatient } from '../../application/use-cases/visit/GetVisitsByPatient';
import { GetVisitById } from '../../application/use-cases/visit/GetVisitById';
import { VisitRepository } from '../../infrastructure/repositories/VisitRepository';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';
import { NotificationService } from '../../application/services/NotificationService';

const visitRepository = new VisitRepository();
const patientRepository = new PatientRepository();
const notificationRepository = new NotificationRepository();

export class VisitController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Get Socket.io instance from app
      const io = req.app.get('io') as SocketIOServer;
      const notificationService = new NotificationService(notificationRepository, io);

      const createVisit = new CreateVisit(visitRepository, patientRepository, notificationService);

      const visit = await createVisit.execute(
        {
          ...req.body,
          doctorId: req.doctorId!,
        },
        {
          id: req.user!.id,
          name: req.user!.name || req.user!.email,
          role: req.user!.role,
        }
      );

      res.status(201).json(visit);
    } catch (error) {
      next(error);
    }
  }

  async getByPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const getVisitsByPatient = new GetVisitsByPatient(visitRepository, patientRepository);
      const visits = await getVisitsByPatient.execute(req.params.patientId, req.doctorId!);

      res.json(visits);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const getVisitById = new GetVisitById(visitRepository);
      const visit = await getVisitById.execute(req.params.id, req.doctorId!);

      res.json(visit);
    } catch (error) {
      next(error);
    }
  }

  async updatePrice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { price } = req.body;

      if (price === undefined || typeof price !== 'number') {
        res.status(400).json({ error: 'Price is required and must be a number' });
        return;
      }

      // Verify the visit belongs to this doctor
      const existingVisit = await visitRepository.findById(id);
      if (!existingVisit) {
        res.status(404).json({ error: 'Visit not found' });
        return;
      }

      if (existingVisit.doctorId !== req.doctorId) {
        res.status(403).json({ error: 'Not authorized to update this visit' });
        return;
      }

      const updatedVisit = await visitRepository.update(id, { price });
      res.json(updatedVisit);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Verify the visit belongs to this doctor
      const existingVisit = await visitRepository.findById(id);
      if (!existingVisit) {
        res.status(404).json({ error: 'Visit not found' });
        return;
      }

      if (existingVisit.doctorId !== req.doctorId) {
        res.status(403).json({ error: 'Not authorized to update this visit' });
        return;
      }

      // Extract updateable fields from request body
      const updateData = {
        visitType: req.body.visitType,
        price: req.body.price,
        chiefComplaint: req.body.chiefComplaint,
        chiefComplaintDrawing: req.body.chiefComplaintDrawing,
        diagnosis: req.body.diagnosis,
        diagnosisDrawing: req.body.diagnosisDrawing,
        notes: req.body.notes,
        notesDrawing: req.body.notesDrawing,
        notesDrawing2: req.body.notesDrawing2,
        notesDrawing3: req.body.notesDrawing3,
        pastMedicalHistoryDrawing: req.body.pastMedicalHistoryDrawing,
        hpiDrawing: req.body.hpiDrawing,
        drugHistoryDrawing: req.body.drugHistoryDrawing,
        familyHistoryDrawing: req.body.familyHistoryDrawing,
        currentMedicationDrawing: req.body.currentMedicationDrawing,
        radiologyDrawing: req.body.radiologyDrawing,
        radiologyDrawing2: req.body.radiologyDrawing2,
        radiologyDrawing3: req.body.radiologyDrawing3,
        labTestRequest: req.body.labTestRequest,
        radiologyRequest: req.body.radiologyRequest,
        medicalChecklists: req.body.medicalChecklists,
        vitals: req.body.vitals,
      };

      const updatedVisit = await visitRepository.update(id, updateData);
      res.json(updatedVisit);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existingVisit = await visitRepository.findById(id);
      if (!existingVisit) {
        res.status(404).json({ error: 'Visit not found' });
        return;
      }

      if (existingVisit.doctorId !== req.doctorId) {
        res.status(403).json({ error: 'Not authorized to delete this visit' });
        return;
      }

      await visitRepository.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
