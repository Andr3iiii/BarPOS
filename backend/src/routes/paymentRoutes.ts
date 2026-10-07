import { Router } from 'express';
import { processPayment, getReceipt } from '../controllers/paymentsController';
import { authenticateToken, requireCashierOrAdmin } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, requireCashierOrAdmin, processPayment);
router.get('/receipt/:orderId', authenticateToken, requireCashierOrAdmin, getReceipt);

export default router;
