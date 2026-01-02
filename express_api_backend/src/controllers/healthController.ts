import type { Request, Response } from 'express';
import { healthService } from '../services/healthService';

export class HealthController {
  check(_req: Request, res: Response) {
    return res.status(200).json(healthService.getStatus());
  }
}

export const healthController = new HealthController();
