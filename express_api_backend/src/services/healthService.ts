import { dbHealthcheck } from '../db/pool';

export class HealthService {
  async getStatus() {
    const db = await dbHealthcheck();

    return {
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        database: db
      }
    };
  }
}

export const healthService = new HealthService();
