import { Router } from 'express';
import { VisitController } from '../controllers/VisitController';
import { VisitAttachmentController } from '../controllers/VisitAttachmentController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();
const visitController = new VisitController();
const attachmentController = new VisitAttachmentController();

// All routes require authentication
router.use(authMiddleware);

// View visits - all authenticated users can view
router.get('/patient/:patientId', visitController.getByPatient.bind(visitController));
router.get('/:id', visitController.getById.bind(visitController));

// Create visit - requires permission
router.post('/', requirePermission('canCreateVisits'), visitController.create.bind(visitController));

// Update visit price - requires canEditVisits permission
router.put('/:id/price', requirePermission('canEditVisits'), visitController.updatePrice.bind(visitController));

// Update full visit - requires canEditVisits permission
router.put('/:id', requirePermission('canEditVisits'), visitController.update.bind(visitController));

// Delete visit - requires canDeleteVisits permission
router.delete('/:id', requirePermission('canDeleteVisits'), visitController.delete.bind(visitController));

// Visit Attachments - all authenticated users can view and upload
router.get('/:visitId/attachments', attachmentController.getByVisitId.bind(attachmentController));
router.post('/:visitId/attachments', attachmentController.create.bind(attachmentController));
router.delete('/attachments/:id', attachmentController.delete.bind(attachmentController));

export default router;
