import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const settingsController = new SettingsController();

// All settings routes require authentication
router.use(authMiddleware);

router.get('/', settingsController.get.bind(settingsController));
router.put('/', settingsController.update.bind(settingsController));

export default router;
