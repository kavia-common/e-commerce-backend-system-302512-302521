import type { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';

export class ProductController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      return res.json(await productService.list());
    } catch (e) {
      next(e);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      return res.json(await productService.get(req.params.id));
    } catch (e) {
      next(e);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(201).json(await productService.create(req.body));
    } catch (e) {
      next(e);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      return res.json(await productService.update(req.params.id, req.body));
    } catch (e) {
      next(e);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      return res.json(await productService.remove(req.params.id));
    } catch (e) {
      next(e);
    }
  }
}

export const productController = new ProductController();
