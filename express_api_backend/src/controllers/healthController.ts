import type { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/healthService';

export class HealthController {
  // PUBLIC_INTERFACE
  async check(_req: Request, res: Response, next: NextFunction) {
    /** Express handler: returns service health and dependency status (including DB connectivity). */
    try {
      return res.status(200).json(await healthService.getStatus());
    } catch (e) {
      next(e);
    }
  }
}

export const healthController = new HealthController();
