import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { UploadPatientRecord } from '../../application/use-cases/patient-record/UploadPatientRecord';
import { GetPatientRecords } from '../../application/use-cases/patient-record/GetPatientRecords';
import { DeletePatientRecord } from '../../application/use-cases/patient-record/DeletePatientRecord';
import { PatientRecordRepository } from '../../infrastructure/repositories/PatientRecordRepository';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';

const patientRecordRepository = new PatientRecordRepository();
const patientRepository = new PatientRepository();

export class PatientRecordController {
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const uploadPatientRecord = new UploadPatientRecord(patientRecordRepository, patientRepository);
      const record = await uploadPatientRecord.execute(req.body, req.doctorId!);

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }

  async getByPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const getPatientRecords = new GetPatientRecords(patientRecordRepository, patientRepository);
      const records = await getPatientRecords.execute(req.params.patientId, req.doctorId!);

      res.json(records);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deletePatientRecord = new DeletePatientRecord(patientRecordRepository, patientRepository);
      await deletePatientRecord.execute(req.params.id, req.doctorId!);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
