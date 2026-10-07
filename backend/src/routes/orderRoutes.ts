import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByReference,
  cancelOrder
} from '../controllers/ordersController';
import { authenticateToken, requireCashierOrAdmin } from '../middleware/auth';

const router = Router();

// Public: Customer creates order without login (Section 25)
router.post('/', createOrder);

// Cashier & Admin
router.get('/', authenticateToken, requireCashierOrAdmin, getAllOrders);
router.get('/ref/:reference', authenticateToken, requireCashierOrAdmin, getOrderByReference);
router.get('/:id', authenticateToken, requireCashierOrAdmin, getOrderById);
router.post('/:id/cancel', authenticateToken, requireCashierOrAdmin, cancelOrder);

export default router;
