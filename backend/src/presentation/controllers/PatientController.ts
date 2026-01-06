import { Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AuthRequest } from '../middleware/authMiddleware';
import { CreatePatient } from '../../application/use-cases/patient/CreatePatient';
import { GetPatients } from '../../application/use-cases/patient/GetPatients';
import { GetPatientById } from '../../application/use-cases/patient/GetPatientById';
import { UpdatePatient } from '../../application/use-cases/patient/UpdatePatient';
import { DeletePatient } from '../../application/use-cases/patient/DeletePatient';
import { SearchPatients } from '../../application/use-cases/patient/SearchPatients';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';
import { NotificationService } from '../../application/services/NotificationService';

const patientRepository = new PatientRepository();
const notificationRepository = new NotificationRepository();

export class PatientController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const createPatient = new CreatePatient(patientRepository);
      const patient = await createPatient.execute({
        ...req.body,
        doctorId: req.doctorId!,
      });

      res.status(201).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const getPatients = new GetPatients(patientRepository);
      const patients = await getPatients.execute(req.doctorId!);

      res.json(patients);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const getPatientById = new GetPatientById(patientRepository);
      const patient = await getPatientById.execute(req.params.id, req.doctorId!);

      res.json(patient);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    console.log('[PatientController] Update called for patient:', req.params.id);
    try {
      // Get Socket.io instance from app
      const io = req.app.get('io') as SocketIOServer;
      const notificationService = new NotificationService(notificationRepository, io);

      const updatePatient = new UpdatePatient(patientRepository, notificationService);
      const patient = await updatePatient.execute(
        req.params.id,
        req.doctorId!,
        req.body,
        {
          id: req.user!.id,
          name: req.user!.email.split('@')[0],
          role: req.user!.role,
        }
      );

      res.json(patient);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deletePatient = new DeletePatient(patientRepository);
      await deletePatient.execute(req.params.id, req.doctorId!);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const searchPatients = new SearchPatients(patientRepository);
      const patients = await searchPatients.execute(req.doctorId!, req.query.q as string || '');

      res.json(patients);
    } catch (error) {
      next(error);
    }
  }
}
