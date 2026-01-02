import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { orderService } from '../services/orderService';

export class OrderController {
  // PUBLIC_INTERFACE
  async create(req: Request, res: Response, next: NextFunction) {
    /** Express handler: creates a new order for the authenticated user. */
    try {
      if (!req.user) throw new ApiError(401, 'Not authenticated');

      const idempotencyKey =
        (req.header('Idempotency-Key') ?? req.header('X-Request-Id') ?? req.header('Request-Id') ?? undefined) ||
        undefined;

      const order = await orderService.createOrder(req.user.id, req.body, { idempotencyKey });
      return res.status(201).json(order);
    } catch (e) {
      next(e);
    }
  }

  // PUBLIC_INTERFACE
  async listMine(req: Request, res: Response, next: NextFunction) {
    /** Express handler: lists orders for the authenticated user. */
    try {
      if (!req.user) throw new ApiError(401, 'Not authenticated');
      return res.json(await orderService.listForUser(req.user.id));
    } catch (e) {
      next(e);
    }
  }

  // PUBLIC_INTERFACE
  async listAll(_req: Request, res: Response, next: NextFunction) {
    /** Express handler: lists all orders (intended for admin; enforced at route/middleware). */
    try {
      return res.json(await orderService.listAll());
    } catch (e) {
      next(e);
    }
  }

  // PUBLIC_INTERFACE
  async get(req: Request, res: Response, next: NextFunction) {
    /** Express handler: gets an order by id (owner-or-admin authorization enforced in service). */
    try {
      if (!req.user) throw new ApiError(401, 'Not authenticated');
      const data = await orderService.get(req.params.id, { userId: req.user.id, role: req.user.role });
      return res.json(data);
    } catch (e) {
      next(e);
    }
  }

  // PUBLIC_INTERFACE
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    /** Express handler: updates order status (admin-only; enforced at route/middleware). */
    try {
      // Even though the route is admin-protected, keep controller-level defense-in-depth.
      if (!req.user) throw new ApiError(401, 'Not authenticated');
      const updated = await orderService.updateStatus(req.params.id, req.body.status);
      return res.json(updated);
    } catch (e) {
      next(e);
    }
  }
}

export const orderController = new OrderController();
