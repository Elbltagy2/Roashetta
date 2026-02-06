import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { UploadPreviousInvestigation } from '../../application/use-cases/previous-investigation/UploadPreviousInvestigation';
import { GetPreviousInvestigations } from '../../application/use-cases/previous-investigation/GetPreviousInvestigations';
import { DeletePreviousInvestigation } from '../../application/use-cases/previous-investigation/DeletePreviousInvestigation';
import { PreviousInvestigationRepository } from '../../infrastructure/repositories/PreviousInvestigationRepository';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';

const previousInvestigationRepository = new PreviousInvestigationRepository();
const patientRepository = new PatientRepository();

export class PreviousInvestigationController {
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const uploadPreviousInvestigation = new UploadPreviousInvestigation(previousInvestigationRepository, patientRepository);
      const investigation = await uploadPreviousInvestigation.execute(req.body, req.doctorId!);

      res.status(201).json(investigation);
    } catch (error) {
      next(error);
    }
  }

  async getByPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const getPreviousInvestigations = new GetPreviousInvestigations(previousInvestigationRepository, patientRepository);
      const investigations = await getPreviousInvestigations.execute(req.params.patientId, req.doctorId!);

      res.json(investigations);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deletePreviousInvestigation = new DeletePreviousInvestigation(previousInvestigationRepository, patientRepository);
      await deletePreviousInvestigation.execute(req.params.id, req.doctorId!);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
