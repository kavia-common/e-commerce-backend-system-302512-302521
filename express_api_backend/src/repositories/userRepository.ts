import { pool } from '../db/pool';

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'customer';
  created_at?: string;
};

export class UserRepository {
  async findByEmail(email: string): Promise<DbUser | null> {
    const r = await pool.query(
      'SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return r.rows[0] ?? null;
  }

  async createUser(email: string, passwordHash: string, role: DbUser['role']): Promise<DbUser> {
    const r = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, password_hash, role, created_at',
      [email, passwordHash, role]
    );
    return r.rows[0];
  }

  async findById(id: string): Promise<DbUser | null> {
    const r = await pool.query('SELECT id, email, password_hash, role, created_at FROM users WHERE id = $1', [id]);
    return r.rows[0] ?? null;
  }
}

export const userRepository = new UserRepository();
