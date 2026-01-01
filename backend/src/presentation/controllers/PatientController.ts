import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { CreatePatient } from '../../application/use-cases/patient/CreatePatient';
import { GetPatients } from '../../application/use-cases/patient/GetPatients';
import { GetPatientById } from '../../application/use-cases/patient/GetPatientById';
import { UpdatePatient } from '../../application/use-cases/patient/UpdatePatient';
import { DeletePatient } from '../../application/use-cases/patient/DeletePatient';
import { SearchPatients } from '../../application/use-cases/patient/SearchPatients';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';

const patientRepository = new PatientRepository();

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
    try {
      const updatePatient = new UpdatePatient(patientRepository);
      const patient = await updatePatient.execute(req.params.id, req.doctorId!, req.body);

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
