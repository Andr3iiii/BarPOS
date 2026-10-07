import { Router } from 'express';
import {
  getAllTables,
  getTableByNumber,
  createTable,
  updateTable
} from '../controllers/tablesController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public: allows customer to verify table identifier exists
router.get('/', getAllTables);
router.get('/number/:tableNumber', getTableByNumber);

// Admin
router.post('/', authenticateToken, requireAdmin, createTable);
router.put('/:id', authenticateToken, requireAdmin, updateTable);

export default router;
