import { Router } from 'express';
import authRoutes from './authRoutes';
import patientRoutes from './patientRoutes';
import visitRoutes from './visitRoutes';
import patientRecordRoutes from './patientRecordRoutes';
import assistantRoutes from './assistantRoutes';
import expenseRoutes from './expenseRoutes';
import currentPatientRoutes from './currentPatientRoutes';
import labResultRoutes from './labResultRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/patient-records', patientRecordRoutes);
router.use('/assistants', assistantRoutes);
router.use('/expenses', expenseRoutes);
router.use('/current-patient', currentPatientRoutes);
router.use('/lab-results', labResultRoutes);

export default router;
