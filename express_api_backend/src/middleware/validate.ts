import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from './errorHandler';

type RequestSchemas = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
};

// PUBLIC_INTERFACE
export function validate(schemas: RequestSchemas) {
  /** Express middleware factory to validate body/params/query using Zod schemas. */
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        const r = schemas.body.safeParse(req.body);
        if (!r.success) throw new ApiError(400, 'Invalid request body', r.error.flatten());
        req.body = r.data;
      }
      if (schemas.params) {
        const r = schemas.params.safeParse(req.params);
        if (!r.success) throw new ApiError(400, 'Invalid request params', r.error.flatten());
        req.params = r.data as any;
      }
      if (schemas.query) {
        const r = schemas.query.safeParse(req.query);
        if (!r.success) throw new ApiError(400, 'Invalid request query', r.error.flatten());
        req.query = r.data as any;
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}
