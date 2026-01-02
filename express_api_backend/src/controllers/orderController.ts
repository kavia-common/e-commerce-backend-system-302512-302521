import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { orderService } from '../services/orderService';

export class OrderController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'Not authenticated');
      const order = await orderService.createOrder(req.user.id, req.body);
      return res.status(201).json(order);
    } catch (e) {
      next(e);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'Not authenticated');
      return res.json(await orderService.listForUser(req.user.id));
    } catch (e) {
      next(e);
    }
  }

  async listAll(_req: Request, res: Response, next: NextFunction) {
    try {
      return res.json(await orderService.listAll());
    } catch (e) {
      next(e);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'Not authenticated');
      const data = await orderService.get(req.params.id, { userId: req.user.id, role: req.user.role });
      return res.json(data);
    } catch (e) {
      next(e);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await orderService.updateStatus(req.params.id, req.body.status);
      return res.json(updated);
    } catch (e) {
      next(e);
    }
  }
}

export const orderController = new OrderController();
