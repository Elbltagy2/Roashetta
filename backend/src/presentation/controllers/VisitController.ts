import { Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AuthRequest } from '../middleware/authMiddleware';
import { CreateVisit } from '../../application/use-cases/visit/CreateVisit';
import { GetVisitById } from '../../application/use-cases/visit/GetVisitById';
import { VisitRepository } from '../../infrastructure/repositories/VisitRepository';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';
import { NotificationService } from '../../application/services/NotificationService';
import { cache, cacheKeys } from '../../infrastructure/cache/MemoryCache';

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

      // Invalidate this patient's visit list cache + the per-visit cache.
      cache.delete(cacheKeys.visitsMetaByPatient(visit.patientId));
      cache.delete(cacheKeys.visitFull(visit.id));

      res.status(201).json(visit);
    } catch (error) {
      next(error);
    }
  }

  async getByPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;
      const doctorId = req.doctorId!;

      // Cache: drawings-free visit list keyed per patient
      const cacheKey = cacheKeys.visitsMetaByPatient(patientId);
      const cached = cache.get<unknown[]>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Auth: confirm the patient belongs to this doctor
      const patient = await patientRepository.findById(patientId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      if (patient.doctorId !== doctorId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Meta-only — no drawings or large JSON blobs.
      const visits = await visitRepository.findMetaByPatientId(patientId);
      cache.set(cacheKey, visits);
      res.json(visits);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doctorId = req.doctorId!;

      const cacheKey = cacheKeys.visitFull(id);
      const cached = cache.get<unknown>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const getVisitById = new GetVisitById(visitRepository);
      const visit = await getVisitById.execute(id, doctorId);

      cache.set(cacheKey, visit);
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

      cache.delete(cacheKeys.visitsMetaByPatient(updatedVisit.patientId));
      cache.delete(cacheKeys.visitFull(updatedVisit.id));

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
        prescriptionMedicines: req.body.prescriptionMedicines,
        vitals: req.body.vitals,
      };

      const updatedVisit = await visitRepository.update(id, updateData);

      cache.delete(cacheKeys.visitsMetaByPatient(updatedVisit.patientId));
      cache.delete(cacheKeys.visitFull(updatedVisit.id));

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

      cache.delete(cacheKeys.visitsMetaByPatient(existingVisit.patientId));
      cache.delete(cacheKeys.visitFull(id));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
