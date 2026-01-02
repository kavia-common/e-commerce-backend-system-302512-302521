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
      `
      SELECT
        u.id,
        u.email,
        u.password_hash,
        COALESCE(r.name, 'customer') AS role,
        u.created_at
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.email = $1
      LIMIT 1
      `,
      [email]
    );

    const row = r.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role,
      created_at: row.created_at
    };
  }

  async createUser(email: string, passwordHash: string, role: DbUser['role']): Promise<DbUser> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        `
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id, email, password_hash, created_at
        `,
        [email, passwordHash]
      );
      const userRow = userRes.rows[0];

      // Map role name -> roles.id and insert link row
      const roleRes = await client.query('SELECT id, name FROM roles WHERE name = $1 LIMIT 1', [role]);
      const roleRow = roleRes.rows[0];
      if (!roleRow) {
        throw new Error(`Role not found in DB: ${role}`);
      }

      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userRow.id, roleRow.id]);

      await client.query('COMMIT');

      return {
        id: userRow.id,
        email: userRow.email,
        password_hash: userRow.password_hash,
        role,
        created_at: userRow.created_at
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<DbUser | null> {
    const r = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.password_hash,
        COALESCE(r.name, 'customer') AS role,
        u.created_at
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1
      LIMIT 1
      `,
      [id]
    );

    const row = r.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role,
      created_at: row.created_at
    };
  }
}

export const userRepository = new UserRepository();
