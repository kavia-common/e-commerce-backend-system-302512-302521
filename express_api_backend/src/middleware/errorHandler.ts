import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Normalizes "unknown" thrown values into a predictable JSON error shape.
 * We keep the existing outward JSON contract:
 *   { status: 'error', message: string, details?: unknown }
 */
function normalizeUnknownErrorDetails(err: unknown): unknown {
  if (err instanceof Error) {
    // Avoid sending full stack traces to clients; message is sufficient here.
    return { name: err.name, message: err.message };
  }
  return err;
}

// PUBLIC_INTERFACE
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  /** Centralized error handler converting thrown errors into consistent JSON responses. */
  // eslint-disable-next-line no-console
  console.error(err);

  // Zod schema validation can still throw if someone uses `.parse()` directly.
  // Ensure it becomes a proper 400 with consistent JSON shape.
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      details: err.flatten()
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    details: normalizeUnknownErrorDetails(err)
  });
}
