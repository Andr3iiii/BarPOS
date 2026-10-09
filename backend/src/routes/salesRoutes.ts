import { Router } from 'express';
import { getDashboardMetrics, getSalesReports } from '../controllers/salesController';
import { authenticateToken, requireAdmin, requireCashierOrAdmin } from '../middleware/auth';

const router = Router();

router.get('/metrics', authenticateToken, requireCashierOrAdmin, getDashboardMetrics);
router.get('/', authenticateToken, requireAdmin, getSalesReports);

export default router;
