import { Pool, type PoolClient } from 'pg';
import { getDbRequiredEnv, getEnv } from '../config/env';

/**
 * We create the pool lazily so missing DATABASE_URL does not crash process startup.
 * DB-dependent code will fail at query-time with a clear error instead.
 */
let cachedPool: Pool | null = null;

function getPool(): Pool {
  if (cachedPool) return cachedPool;

  // DB pool should not require JWT_SECRET; only DATABASE_URL.
  const { DATABASE_URL } = getDbRequiredEnv();
  cachedPool = new Pool({ connectionString: DATABASE_URL });
  return cachedPool;
}

/**
 * Proxy to mimic `pg.Pool` surface area that our repositories already use.
 *
 * IMPORTANT:
 * `pg.Pool#query` has multiple overloads. Attempting to re-type it via rest params
 * tends to collapse overloads and causes TypeScript compile errors throughout the repo.
 *
 * We solve this by returning the underlying pool's bound methods, preserving overloads.
 */
export const pool: Pick<Pool, 'connect' | 'query' | 'end'> = {
  // Connect is used for transactions.
  connect: () => getPool().connect(),

  // Query is used for regular queries.
  // Bind is important so `this` inside pg's implementation stays correct.
  query: ((...args: Parameters<Pool['query']>) =>
    getPool().query(...(args as unknown as Parameters<Pool['query']>))) as Pool['query'],

  // Graceful shutdown support if needed.
  end: async (): Promise<void> => {
    if (!cachedPool) return;
    const p = cachedPool;
    cachedPool = null;
    await p.end();
  }
};

/**
 * Lightweight DB connectivity check used by health endpoints.
 * Never throws; returns structured status.
 */
// PUBLIC_INTERFACE
export async function dbHealthcheck(): Promise<{ ok: boolean; error?: string }> {
  /** Checks DB connectivity with a quick `SELECT 1`. Returns ok=false on any failure. */
  try {
    // If DATABASE_URL isn't configured, report as unhealthy but don't crash.
    const { DATABASE_URL } = getEnv();
    if (!DATABASE_URL) return { ok: false, error: 'DATABASE_URL not configured' };

    const client: PoolClient = await pool.connect();
    try {
      await client.query('SELECT 1');
      return { ok: true };
    } finally {
      client.release();
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown DB error' };
  }
}
