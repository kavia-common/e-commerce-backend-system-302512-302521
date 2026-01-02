import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * NOTE:
 * We intentionally allow the service to boot even if DB/JWT env vars are missing.
 * This prevents the container from failing to start and allows /health, /docs,
 * and /openapi.json to function even when the database is temporarily unavailable
 * or secrets are not yet injected.
 *
 * Code paths that require DB/JWT must call `getRequiredEnv()` at usage time.
 */
const envSchema = z.object({
  // Optional at boot; required for DB/JWT-dependent routes.
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').optional(),
  JWT_SECRET: z.string().min(20, 'JWT_SECRET must be at least 20 characters').optional(),

  // Server runtime
  PORT: z.coerce.number().int().positive().default(3001),

  // Optional
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.string().default('development')
});

type Env = z.infer<typeof envSchema>;
type RequiredEnv = Env & { DATABASE_URL: string; JWT_SECRET: string };

let cachedEnv: Env | null = null;

// PUBLIC_INTERFACE
export function getEnv(): Env {
  /** Returns validated environment variables for the service (lenient: DB/JWT may be missing). */
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${msg}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

// PUBLIC_INTERFACE
export function getRequiredEnv(): RequiredEnv {
  /** Returns environment variables required for DB/JWT features. Throws if missing/invalid. */
  const env = getEnv();

  const missing: string[] = [];
  if (!env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!env.JWT_SECRET) missing.push('JWT_SECRET');

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        `The service can run without them for /health and /docs, but DB/JWT routes require them.`
    );
  }

  return env as RequiredEnv;
}
