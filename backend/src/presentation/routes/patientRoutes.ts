import { Router } from 'express';
import { PatientController } from '../controllers/PatientController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();
const patientController = new PatientController();

// All routes require authentication
router.use(authMiddleware);

// View patients - all authenticated users can view
router.get('/', patientController.getAll.bind(patientController));
router.get('/search', patientController.search.bind(patientController));
router.get('/:id', patientController.getById.bind(patientController));

// Create patient - requires permission
router.post('/', requirePermission('canCreatePatients'), patientController.create.bind(patientController));

// Update patient - requires permission
router.put('/:id', requirePermission('canEditPatients'), patientController.update.bind(patientController));

// Delete patient - requires permission
router.delete('/:id', requirePermission('canDeletePatients'), patientController.delete.bind(patientController));

export default router;
