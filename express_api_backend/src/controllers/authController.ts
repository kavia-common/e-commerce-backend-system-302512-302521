import type { Request, Response, NextFunction } from 'express';
import { authService, loginInputSchema, registerInputSchema } from '../services/authService';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerInputSchema.parse(req.body);
      const result = await authService.register(input);
      return res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
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
