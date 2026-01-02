import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './errorHandler';
import { verifyAuthToken } from '../utils/jwt';

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

/**
 * NOTE:
 * This codebase uses two roles: `admin` and `customer`.
 * - Missing/invalid JWT => 401
 * - Authenticated but insufficient role => 403
 */

// PUBLIC_INTERFACE
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  /** Ensures a valid JWT is present in Authorization header (Bearer). Populates req.user. */
  const header = req.header('Authorization');
  if (!header) return next(new ApiError(401, 'Missing Authorization header'));

  // Preserve existing behavior: expect "Bearer <token>" with simple split.
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new ApiError(401, 'Invalid Authorization header format'));

  try {
    const decoded = verifyAuthToken(token);
    req.user = decoded;
    return next();
  } catch (e) {
    // verifyAuthToken throws ApiError(503, ...) if JWT_SECRET missing.
    if (e instanceof ApiError) return next(e);

    // Preserve existing outward behavior: invalid/expired token => 401
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

// PUBLIC_INTERFACE
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  /** Ensures the authenticated user is an admin (401 if unauthenticated, 403 if non-admin). */
  return requireRole(['admin'])(req, _res, next);
}
