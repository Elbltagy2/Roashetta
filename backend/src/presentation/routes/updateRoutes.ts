import { Router } from 'express';
import { UpdateController } from '../controllers/UpdateController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const controller = new UpdateController();

router.use(authMiddleware);

router.get('/', controller.getInfo.bind(controller));
router.post('/check', controller.check.bind(controller));
router.post('/install', controller.install.bind(controller));
router.post('/restart', controller.restart.bind(controller));

export default router;
