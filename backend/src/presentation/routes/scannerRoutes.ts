import { Router } from 'express';
import { ScannerController } from '../controllers/ScannerController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const scannerController = new ScannerController();

router.use(authMiddleware);

router.get('/discover', scannerController.discover.bind(scannerController));
router.post('/default', scannerController.setDefault.bind(scannerController));
router.post('/quick-scan/:visitId', scannerController.quickScan.bind(scannerController));

export default router;
