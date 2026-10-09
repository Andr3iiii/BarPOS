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

// Public: Customer creates order without login & looks up confirmation by reference
router.post('/', createOrder);
router.get('/ref/:reference', getOrderByReference);

// Cashier & Admin
router.get('/', authenticateToken, requireCashierOrAdmin, getAllOrders);
router.get('/:id', authenticateToken, requireCashierOrAdmin, getOrderById);
router.post('/:id/cancel', authenticateToken, requireCashierOrAdmin, cancelOrder);

export default router;
