import { Router } from 'express';
import {
  getAllProducts,
  getPublicMenu,
  getProductById,
  createProduct,
  updateProduct,
  deleteOrDeactivateProduct
} from '../controllers/productsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public endpoint for customer ordering
router.get('/menu', getPublicMenu);

// Authenticated/Admin endpoints
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteOrDeactivateProduct);

export default router;
