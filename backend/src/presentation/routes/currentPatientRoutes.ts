import { Router } from 'express';
import { CurrentPatientController } from '../controllers/CurrentPatientController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const currentPatientController = new CurrentPatientController();

// All routes require authentication
router.use(authMiddleware);

// GET /api/current-patient - Get the current patient
router.get('/', currentPatientController.getCurrentPatient.bind(currentPatientController));

// POST /api/current-patient/:patientId - Set a patient as current
router.post('/:patientId', currentPatientController.setCurrentPatient.bind(currentPatientController));

// DELETE /api/current-patient - Clear the current patient (finish)
router.delete('/', currentPatientController.clearCurrentPatient.bind(currentPatientController));

export default router;
