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
import { cache, cacheKeys, invalidatePatientCaches } from '../../infrastructure/cache/MemoryCache';

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

      invalidatePatientCaches(req.doctorId!);

      res.status(201).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const { page, limit, search, gender } = req.query;
      const isPaginated = page !== undefined || limit !== undefined;

      if (!isPaginated) {
        const cacheKey = cacheKeys.patientsAll(doctorId);
        const cached = cache.get<unknown[]>(cacheKey);
        if (cached) {
          return res.json(cached);
        }

        const getPatients = new GetPatients(patientRepository);
        const patients = await getPatients.execute(doctorId);

        cache.set(cacheKey, patients);
        return res.json(patients);
      }

      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
      const searchStr = typeof search === 'string' ? search.trim() : '';
      const genderStr =
        gender === 'male' || gender === 'female' ? gender : undefined;

      const cacheKey = cacheKeys.patientsPaginated(
        doctorId,
        pageNum,
        limitNum,
        searchStr,
        genderStr ?? ''
      );
      const cached = cache.get<unknown>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const result = await patientRepository.findPaginated(doctorId, {
        page: pageNum,
        limit: limitNum,
        search: searchStr,
        gender: genderStr,
      });

      const totalPages = Math.max(1, Math.ceil(result.total / limitNum));
      const payload = {
        data: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      };

      cache.set(cacheKey, payload);
      res.json(payload);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const id = req.params.id;
      const cacheKey = cacheKeys.patient(doctorId, id);
      const cached = cache.get<unknown>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const getPatientById = new GetPatientById(patientRepository);
      const patient = await getPatientById.execute(id, doctorId);

      cache.set(cacheKey, patient);
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
          name: (req.user as any).name ?? req.user!.email ?? 'Unknown user',
          role: req.user!.role,
        }
      );

      invalidatePatientCaches(req.doctorId!, req.params.id);

      res.json(patient);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deletePatient = new DeletePatient(patientRepository);
      await deletePatient.execute(req.params.id, req.doctorId!);

      invalidatePatientCaches(req.doctorId!, req.params.id);

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
