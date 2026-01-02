import type { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';

export class ProductController {
  // PUBLIC_INTERFACE
  async list(_req: Request, res: Response, next: NextFunction) {
    /** Express handler: lists all products. */
    try {
      return res.json(await productService.list());
    } catch (e) {
      next(e);
    }
  }

  // PUBLIC_INTERFACE
  async get(req: Request, res: Response, next: NextFunction) {
    /** Express handler: gets a single product by id. */
    try {
      return res.json(await productService.get(req.params.id));
    } catch (e) {
      next(e);
    }
  }

  // PUBLIC_INTERFACE
  async create(req: Request, res: Response, next: NextFunction) {
    /** Express handler: creates a new product (RBAC is enforced at the route layer). */
    try {
      return res.status(201).json(await productService.create(req.body));
    } catch (e) {
      next(e);
    }
  }

  // PUBLIC_INTERFACE
  async update(req: Request, res: Response, next: NextFunction) {
    /** Express handler: updates a product by id (RBAC is enforced at the route layer). */
    try {
      return res.json(await productService.update(req.params.id, req.body));
    } catch (e) {
      next(e);
    }
  }

  // PUBLIC_INTERFACE
  async remove(req: Request, res: Response, next: NextFunction) {
    /** Express handler: deletes a product by id (RBAC is enforced at the route layer). */
    try {
      return res.json(await productService.remove(req.params.id));
    } catch (e) {
      next(e);
    }
  }
}

export const productController = new ProductController();
