import { Router } from 'express';
import authRoutes from './authRoutes';
import patientRoutes from './patientRoutes';
import visitRoutes from './visitRoutes';
import patientRecordRoutes from './patientRecordRoutes';
import previousInvestigationRoutes from './previousInvestigationRoutes';
import assistantRoutes from './assistantRoutes';
import expenseRoutes from './expenseRoutes';
import currentPatientRoutes from './currentPatientRoutes';
import labResultRoutes from './labResultRoutes';
import notificationRoutes from './notificationRoutes';
import settingsRoutes from './settingsRoutes';
import analyticsRoutes from './analyticsRoutes';
import queueRoutes from './queueRoutes';
import scannerRoutes from './scannerRoutes';
import updateRoutes from './updateRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/patient-records', patientRecordRoutes);
router.use('/previous-investigations', previousInvestigationRoutes);
router.use('/assistants', assistantRoutes);
router.use('/expenses', expenseRoutes);
router.use('/current-patient', currentPatientRoutes);
router.use('/lab-results', labResultRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/queue', queueRoutes);
router.use('/scanner', scannerRoutes);
router.use('/updates', updateRoutes);

export default router;
