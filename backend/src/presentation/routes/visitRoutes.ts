import { Router } from 'express';
import { VisitController } from '../controllers/VisitController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();
const visitController = new VisitController();

// All routes require authentication
router.use(authMiddleware);

// View visits - all authenticated users can view
router.get('/patient/:patientId', visitController.getByPatient.bind(visitController));
router.get('/:id', visitController.getById.bind(visitController));

// Create visit - requires permission
router.post('/', requirePermission('canCreateVisits'), visitController.create.bind(visitController));

export default router;
