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
          name: req.user!.name,
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
}
