import { Router } from 'express';
import { QueueController } from '../controllers/QueueController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const queueController = new QueueController();

// All queue routes require authentication
router.use(authMiddleware);

router.get('/', queueController.getQueue.bind(queueController));
router.post('/', queueController.addToQueue.bind(queueController));
router.put('/reorder', queueController.reorderQueue.bind(queueController));
router.put('/:id', queueController.updateEntry.bind(queueController));
router.delete('/:id', queueController.removeFromQueue.bind(queueController));

export default router;
