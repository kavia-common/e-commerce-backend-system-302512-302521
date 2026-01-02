import type { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// PUBLIC_INTERFACE
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  /** Centralized error handler converting thrown errors into consistent JSON responses. */
  // eslint-disable-next-line no-console
  console.error(err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
}
