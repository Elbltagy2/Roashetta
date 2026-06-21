import { Router } from 'express';
import { DrugController } from '../controllers/DrugController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const drugController = new DrugController();

// All drug routes require authentication
router.use(authMiddleware);

router.get('/', drugController.search.bind(drugController));

export default router;
