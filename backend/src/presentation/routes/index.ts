import { Router } from 'express';
import authRoutes from './authRoutes';
import patientRoutes from './patientRoutes';
import visitRoutes from './visitRoutes';
import patientRecordRoutes from './patientRecordRoutes';
import assistantRoutes from './assistantRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/patient-records', patientRecordRoutes);
router.use('/assistants', assistantRoutes);

export default router;
