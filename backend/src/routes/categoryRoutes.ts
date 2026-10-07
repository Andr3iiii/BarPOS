import { Router } from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deactivateCategory
} from '../controllers/categoriesController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getAllCategories);
router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deactivateCategory);

export default router;
