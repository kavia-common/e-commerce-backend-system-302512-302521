import { Pool } from 'pg';
import { getEnv } from '../config/env';

const { DATABASE_URL } = getEnv();

/**
 * Single shared PG pool.
 * DATABASE_URL is expected to be a full postgres connection string.
 */
export const pool = new Pool({
  connectionString: DATABASE_URL
});
