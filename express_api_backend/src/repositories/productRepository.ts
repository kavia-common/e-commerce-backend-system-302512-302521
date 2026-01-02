import { pool } from '../db/pool';

export type DbProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at?: string;
  updated_at?: string;
};

export class ProductRepository {
  async list(): Promise<DbProduct[]> {
    const r = await pool.query(
      'SELECT id, name, description, price, stock, created_at, updated_at FROM products ORDER BY created_at DESC'
    );
    return r.rows;
  }

  async getById(id: string): Promise<DbProduct | null> {
    const r = await pool.query(
      'SELECT id, name, description, price, stock, created_at, updated_at FROM products WHERE id = $1',
      [id]
    );
    return r.rows[0] ?? null;
  }

  async create(input: Omit<DbProduct, 'id' | 'created_at' | 'updated_at'>): Promise<DbProduct> {
    const r = await pool.query(
      'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING id, name, description, price, stock, created_at, updated_at',
      [input.name, input.description, input.price, input.stock]
    );
    return r.rows[0];
  }

  async update(
    id: string,
    input: Partial<Omit<DbProduct, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<DbProduct | null> {
    const r = await pool.query(
      `
      UPDATE products
      SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        stock = COALESCE($5, stock),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, description, price, stock, created_at, updated_at
      `,
      [id, input.name ?? null, input.description ?? null, input.price ?? null, input.stock ?? null]
    );
    return r.rows[0] ?? null;
  }

  async remove(id: string): Promise<boolean> {
    const r = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return r.rowCount === 1;
  }
}

export const productRepository = new ProductRepository();
