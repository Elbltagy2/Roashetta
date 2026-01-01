import { Router } from 'express';
import { PatientRecordController } from '../controllers/PatientRecordController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();
const patientRecordController = new PatientRecordController();

// All routes require authentication
router.use(authMiddleware);

// View records - all authenticated users can view
router.get('/patient/:patientId', patientRecordController.getByPatient.bind(patientRecordController));

// Manage records - requires permission
router.post('/', requirePermission('canManageRecords'), patientRecordController.upload.bind(patientRecordController));
router.delete('/:id', requirePermission('canManageRecords'), patientRecordController.delete.bind(patientRecordController));

export default router;
