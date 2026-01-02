import { Router } from 'express';
import { z } from 'zod';
import { orderController } from '../controllers/orderController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../services/orderService';

export const orderRoutes = Router();

const idParamsSchema = z.object({ id: z.string().min(1) });

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create an order (customer)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: integer, minimum: 1 }
 *     responses:
 *       201: { description: Created }
 */
orderRoutes.post(
  '/',
  requireAuth,
  requireRole(['customer', 'admin']),
  validate({ body: createOrderSchema }),
  (req, res, next) => orderController.create(req, res, next)
);

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: List my orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List }
 */
orderRoutes.get('/my', requireAuth, requireRole(['customer', 'admin']), (req, res, next) =>
  orderController.listMine(req, res, next)
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List all orders (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List }
 */
orderRoutes.get('/', requireAuth, requireRole(['admin']), (req, res, next) => orderController.listAll(req, res, next));

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order with items (owner or admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
orderRoutes.get('/:id', requireAuth, validate({ params: idParamsSchema }), (req, res, next) =>
  orderController.get(req, res, next)
);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, shipped, cancelled]
 *     responses:
 *       200: { description: Updated }
 */
orderRoutes.patch(
  '/:id/status',
  requireAuth,
  requireRole(['admin']),
  validate({ params: idParamsSchema, body: updateOrderStatusSchema }),
  (req, res, next) => orderController.updateStatus(req, res, next)
);
