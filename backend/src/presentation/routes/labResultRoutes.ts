import { Router } from 'express';
import { LabResultController } from '../controllers/LabResultController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const labResultController = new LabResultController();

// All lab result routes require authentication
router.use(authMiddleware);

router.get('/patient/:patientId', labResultController.getLabResults.bind(labResultController));
router.post('/', labResultController.createLabResult.bind(labResultController));
router.put('/:id', labResultController.updateLabResult.bind(labResultController));
router.delete('/:id', labResultController.deleteLabResult.bind(labResultController));

export default router;
