import { pool } from '../db/pool';

export type DbProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number; // dollars in API/service layer
  stock: number;
  created_at?: string;
  updated_at?: string;
};

function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function dollarsToCents(dollars: number): number {
  // Avoid floating point surprises; round to nearest cent
  return Math.round(Number(dollars) * 100);
}

export class ProductRepository {
  async list(): Promise<DbProduct[]> {
    const r = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        price_cents,
        stock_quantity,
        created_at,
        updated_at
      FROM products
      ORDER BY created_at DESC
      `
    );

    return r.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: centsToDollars(Number(row.price_cents)),
      stock: Number(row.stock_quantity),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  async getById(id: string): Promise<DbProduct | null> {
    const r = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        price_cents,
        stock_quantity,
        created_at,
        updated_at
      FROM products
      WHERE id = $1
      `,
      [id]
    );

    const row = r.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: centsToDollars(Number(row.price_cents)),
      stock: Number(row.stock_quantity),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Decrement stock only if enough inventory is available.
   * This avoids negative inventory and provides atomicity at the DB statement level.
   */
  async decrementStockIfAvailable(productId: string, quantity: number): Promise<boolean> {
    const r = await pool.query(
      `
      UPDATE products
      SET stock_quantity = stock_quantity - $2, updated_at = NOW()
      WHERE id = $1 AND stock_quantity >= $2
      `,
      [productId, quantity]
    );
    return r.rowCount === 1;
  }

  async create(input: Omit<DbProduct, 'id' | 'created_at' | 'updated_at'>): Promise<DbProduct> {
    const r = await pool.query(
      `
      INSERT INTO products (name, description, price_cents, currency, active, stock_quantity)
      VALUES ($1, $2, $3, 'USD', true, $4)
      RETURNING id, name, description, price_cents, stock_quantity, created_at, updated_at
      `,
      [input.name, input.description, dollarsToCents(input.price), input.stock]
    );

    const row = r.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: centsToDollars(Number(row.price_cents)),
      stock: Number(row.stock_quantity),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async update(
    id: string,
    input: Partial<Omit<DbProduct, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<DbProduct | null> {
    const priceCents = input.price === undefined ? null : dollarsToCents(input.price);

    const r = await pool.query(
      `
      UPDATE products
      SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price_cents = COALESCE($4, price_cents),
        stock_quantity = COALESCE($5, stock_quantity),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, description, price_cents, stock_quantity, created_at, updated_at
      `,
      [id, input.name ?? null, input.description ?? null, priceCents, input.stock ?? null]
    );

    const row = r.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: centsToDollars(Number(row.price_cents)),
      stock: Number(row.stock_quantity),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async remove(id: string): Promise<boolean> {
    const r = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return r.rowCount === 1;
  }
}

export const productRepository = new ProductRepository();
