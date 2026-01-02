import { Pool, type PoolClient } from 'pg';
import { getEnv, getRequiredEnv } from '../config/env';

/**
 * We create the pool lazily so missing DATABASE_URL does not crash process startup.
 * DB-dependent code will fail at query-time with a clear error instead.
 */
let cachedPool: Pool | null = null;

function getPool(): Pool {
  if (cachedPool) return cachedPool;
  const { DATABASE_URL } = getRequiredEnv();
  cachedPool = new Pool({ connectionString: DATABASE_URL });
  return cachedPool;
}

/**
 * Proxy to mimic `pg.Pool` surface area that our repositories already use.
 * This keeps call sites unchanged while avoiding eager env validation at import time.
 */
export const pool = {
  // Connect is used for transactions.
  connect: async (): Promise<PoolClient> => getPool().connect(),
  // Query is used for regular queries.
  query: (...args: Parameters<Pool['query']>): ReturnType<Pool['query']> => getPool().query(...(args as [any])),
  // Graceful shutdown support if needed.
  end: async (): Promise<void> => {
    if (!cachedPool) return;
    const p = cachedPool;
    cachedPool = null;
    await p.end();
  }
} satisfies Pick<Pool, 'connect' | 'query' | 'end'>;

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

    const client = await pool.connect();
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
