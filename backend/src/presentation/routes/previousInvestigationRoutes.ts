import { Router } from 'express';
import { PreviousInvestigationController } from '../controllers/PreviousInvestigationController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();
const previousInvestigationController = new PreviousInvestigationController();

// All routes require authentication
router.use(authMiddleware);

// View investigations - all authenticated users can view
router.get('/patient/:patientId', previousInvestigationController.getByPatient.bind(previousInvestigationController));

// Manage investigations - requires permission
router.post('/', requirePermission('canManageRecords'), previousInvestigationController.upload.bind(previousInvestigationController));
router.delete('/:id', requirePermission('canManageRecords'), previousInvestigationController.delete.bind(previousInvestigationController));

export default router;
