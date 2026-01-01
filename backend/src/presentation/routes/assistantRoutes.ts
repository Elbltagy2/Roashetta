import { Router } from 'express';
import { AssistantController } from '../controllers/AssistantController';
import { authMiddleware, doctorOnly } from '../middleware/authMiddleware';

const router = Router();
const assistantController = new AssistantController();

// All routes require authentication and doctor role
router.use(authMiddleware);
router.use(doctorOnly);

router.post('/', assistantController.create.bind(assistantController));
router.get('/', assistantController.getAll.bind(assistantController));
router.put('/:id', assistantController.update.bind(assistantController));
router.delete('/:id', assistantController.delete.bind(assistantController));

export default router;
