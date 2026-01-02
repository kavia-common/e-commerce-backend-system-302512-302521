import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Required per task instructions
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(20, 'JWT_SECRET must be at least 20 characters'),
  PORT: z.coerce.number().int().positive().default(3001),

  // Optional
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.string().default('development')
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

// PUBLIC_INTERFACE
export function getEnv(): Env {
  /** Returns validated environment variables for the service. Throws on invalid env. */
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${msg}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}
