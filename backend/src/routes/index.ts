import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import tableRoutes from './tableRoutes';
import orderRoutes from './orderRoutes';
import paymentRoutes from './paymentRoutes';
import salesRoutes from './salesRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/sales', salesRoutes);
router.use('/users', userRoutes);

export default router;
