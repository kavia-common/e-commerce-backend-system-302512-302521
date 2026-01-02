import { Router } from 'express';
import { healthController } from '../controllers/healthController';

export const healthRoutes = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health check passed
 */
healthRoutes.get('/', (req, res) => healthController.check(req, res));
