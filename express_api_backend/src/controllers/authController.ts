import type { Request, Response, NextFunction } from 'express';
import { authService, loginInputSchema, registerInputSchema } from '../services/authService';

export class AuthController {
  // PUBLIC_INTERFACE
  async register(req: Request, res: Response, next: NextFunction) {
    /** Express handler: registers a new user and returns JWT + user payload. */
    try {
      const input = registerInputSchema.parse(req.body);
      const result = await authService.register(input);
      return res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }

  // PUBLIC_INTERFACE
  async login(req: Request, res: Response, next: NextFunction) {
    /** Express handler: authenticates user credentials and returns JWT + user payload. */
    try {
      const input = loginInputSchema.parse(req.body);
      const result = await authService.login(input);
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }
}

export const authController = new AuthController();
