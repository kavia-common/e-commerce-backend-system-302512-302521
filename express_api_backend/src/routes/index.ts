import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { healthRoutes } from './healthRoutes';
import { orderRoutes } from './orderRoutes';
import { productRoutes } from './productRoutes';

export const routes = Router();

routes.use('/', healthRoutes);
routes.use('/auth', authRoutes);
routes.use('/products', productRoutes);
routes.use('/orders', orderRoutes);
