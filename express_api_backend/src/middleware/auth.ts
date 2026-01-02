import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { ApiError } from './errorHandler';

export type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'customer';
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const { JWT_SECRET } = getEnv();

// PUBLIC_INTERFACE
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  /** Ensures a valid JWT is present in Authorization header (Bearer). Populates req.user. */
  const header = req.header('Authorization');
  if (!header) return next(new ApiError(401, 'Missing Authorization header'));

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new ApiError(401, 'Invalid Authorization header format'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

// PUBLIC_INTERFACE
export function requireRole(roles: AuthUser['role'][]) {
  /** Ensures authenticated user has one of the allowed roles. */
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Forbidden'));
    return next();
  };
}
