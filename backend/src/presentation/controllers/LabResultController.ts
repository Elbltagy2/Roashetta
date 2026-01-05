import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { LabResultRepository } from '../../infrastructure/repositories/LabResultRepository';
import { CreateLabResult } from '../../application/use-cases/lab-result/CreateLabResult';
import { GetLabResults } from '../../application/use-cases/lab-result/GetLabResults';
import { UpdateLabResult } from '../../application/use-cases/lab-result/UpdateLabResult';
import { DeleteLabResult } from '../../application/use-cases/lab-result/DeleteLabResult';

export class LabResultController {
  async getLabResults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const labResultRepository = new LabResultRepository();
      const getLabResults = new GetLabResults(labResultRepository);

      const { patientId } = req.params;
      const { startDate, endDate } = req.query;
      let results;

      if (startDate && endDate) {
        results = await getLabResults.executeByDateRange(
          patientId,
          req.doctorId!,
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        results = await getLabResults.execute(patientId, req.doctorId!);
      }

      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  async createLabResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const labResultRepository = new LabResultRepository();
      const createLabResult = new CreateLabResult(labResultRepository);

      const result = await createLabResult.execute({
        patientId: req.body.patientId,
        doctorId: req.doctorId!,
        category: req.body.category,
        testName: req.body.testName,
        resultValue: req.body.resultValue,
        unit: req.body.unit,
        referenceRange: req.body.referenceRange,
        isAbnormal: req.body.isAbnormal,
        testDate: new Date(req.body.testDate),
        notes: req.body.notes,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateLabResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const labResultRepository = new LabResultRepository();
      const updateLabResult = new UpdateLabResult(labResultRepository);

      const result = await updateLabResult.execute(
        req.params.id,
        req.doctorId!,
        {
          category: req.body.category,
          testName: req.body.testName,
          resultValue: req.body.resultValue,
          unit: req.body.unit,
          referenceRange: req.body.referenceRange,
          isAbnormal: req.body.isAbnormal,
          testDate: req.body.testDate ? new Date(req.body.testDate) : undefined,
          notes: req.body.notes,
        }
      );

      if (!result) {
        return res.status(404).json({ error: 'Lab result not found' });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteLabResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const labResultRepository = new LabResultRepository();
      const deleteLabResult = new DeleteLabResult(labResultRepository);

      const deleted = await deleteLabResult.execute(req.params.id, req.doctorId!);

      if (!deleted) {
        return res.status(404).json({ error: 'Lab result not found' });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
