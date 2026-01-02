import type { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/healthService';

export class HealthController {
  async check(_req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await healthService.getStatus());
    } catch (e) {
      next(e);
    }
  }
}

export const healthController = new HealthController();
