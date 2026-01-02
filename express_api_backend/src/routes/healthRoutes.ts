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
healthRoutes.get('/', (req, res, next) => healthController.check(req, res, next));

/**
 * Alias route for environments that expect a conventional /health endpoint.
 * (Internally, we keep "/" as the canonical health check to match the generated OpenAPI.)
 */
healthRoutes.get('/health', (req, res, next) => healthController.check(req, res, next));

/**
 * Additional alias for platforms that probe /healthz (Kubernetes-style).
 */
healthRoutes.get('/healthz', (req, res, next) => healthController.check(req, res, next));
