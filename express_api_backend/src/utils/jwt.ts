import jwt, { type SignOptions } from 'jsonwebtoken';
import { getRequiredEnv } from '../config/env';
import { ApiError } from '../middleware/errorHandler';
import type { AuthUser } from '../middleware/auth';

/**
 * Centralized JWT helpers.
 *
 * IMPORTANT (compatibility constraints):
 * - Do NOT change token payload/claims: current clients rely on {id,email,role}.
 * - Do NOT change env var usage semantics: still uses JWT_SECRET via getRequiredEnv().
 * - Do NOT change auth/rbac middleware decision behavior (401/403/503).
 */

/** Keep existing behavior: HS256 default and 7d expiry. */
const JWT_ALGORITHM: jwt.Algorithm = 'HS256';
const JWT_EXPIRES_IN: NonNullable<SignOptions['expiresIn']> = '7d';

function getJwtSecretOrThrow(): string {
  try {
    return getRequiredEnv().JWT_SECRET;
  } catch (e) {
    // Maintain existing semantics used elsewhere: treat missing secret as 503.
    throw new ApiError(503, 'Auth service not configured', e instanceof Error ? e.message : e);
  }
}

// PUBLIC_INTERFACE
export function signAuthToken(user: AuthUser): string {
  /** Signs a JWT for the given user, preserving the existing payload and expiry. */
  const secret = getJwtSecretOrThrow();
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM
  });
}

// PUBLIC_INTERFACE
export function verifyAuthToken(token: string): AuthUser {
  /** Verifies a JWT and returns the decoded AuthUser payload. Throws jsonwebtoken errors on invalid tokens. */
  const secret = getJwtSecretOrThrow();

  // We intentionally return whatever the token contains (cast) to preserve existing behavior.
  // The requireAuth middleware handles invalid/expired tokens and responds with 401.
  return jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] }) as AuthUser;
}
