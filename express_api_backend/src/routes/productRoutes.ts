import { Router } from 'express';
import { z } from 'zod';
import { productController } from '../controllers/productController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../services/productService';

export const productRoutes = Router();

const idParamsSchema = z.object({ id: z.string().min(1) });

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Product list
 */
productRoutes.get('/', (req, res, next) => productController.list(req, res, next));

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product
 *       404:
 *         description: Not found
 */
productRoutes.get('/:id', validate({ params: idParamsSchema }), (req, res, next) => productController.get(req, res, next));

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create product (admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stock]
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *               price: { type: number }
 *               stock: { type: integer }
 *     responses:
 *       201: { description: Created }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
productRoutes.post(
  '/',
  requireAuth,
  requireRole(['admin']),
  validate({ body: createProductSchema }),
  (req, res, next) => productController.create(req, res, next)
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product (admin)
 *     tags: [Products]
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
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *               price: { type: number }
 *               stock: { type: integer }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 */
productRoutes.put(
  '/:id',
  requireAuth,
  requireRole(['admin']),
  validate({ params: idParamsSchema, body: updateProductSchema }),
  (req, res, next) => productController.update(req, res, next)
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product (admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */
productRoutes.delete(
  '/:id',
  requireAuth,
  requireRole(['admin']),
  validate({ params: idParamsSchema }),
  (req, res, next) => productController.remove(req, res, next)
);
