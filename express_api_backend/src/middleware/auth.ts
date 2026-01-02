import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getRequiredEnv } from '../config/env';
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

// PUBLIC_INTERFACE
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  /** Ensures a valid JWT is present in Authorization header (Bearer). Populates req.user. */
  const header = req.header('Authorization');
  if (!header) return next(new ApiError(401, 'Missing Authorization header'));

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new ApiError(401, 'Invalid Authorization header format'));

  let secret: string;
  try {
    secret = getRequiredEnv().JWT_SECRET;
  } catch (e) {
    // Misconfigured server: treat as 503 so clients know it's a temporary/unavailable dependency.
    return next(new ApiError(503, 'Auth service not configured', e instanceof Error ? e.message : e));
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    req.user = decoded;
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

/**
 * NOTE:
 * This codebase uses two roles: `admin` and `customer`.
 * - Missing/invalid JWT => 401
 * - Authenticated but insufficient role => 403
 */

// PUBLIC_INTERFACE
export function requireRole(roles: AuthUser['role'][]) {
  /** Ensures authenticated user has one of the allowed roles. */
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Forbidden'));
    return next();
  };
}

// PUBLIC_INTERFACE
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  /** Ensures the authenticated user is an admin (401 if unauthenticated, 403 if non-admin). */
  return requireRole(['admin'])(req, _res, next);
}
