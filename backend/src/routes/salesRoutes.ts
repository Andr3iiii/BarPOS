import { Router } from 'express';
import { getDashboardMetrics, getSalesReports } from '../controllers/salesController';
import { authenticateToken, requireCashierOrAdmin } from '../middleware/auth';

const router = Router();

router.get('/metrics', authenticateToken, requireCashierOrAdmin, getDashboardMetrics);
router.get('/', authenticateToken, requireCashierOrAdmin, getSalesReports);

export default router;
