import { pool } from '../db/pool';

export type DbOrder = {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  total_amount: number; // dollars
  created_at?: string;
};

export type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number; // dollars
  line_total: number; // dollars
};

function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function dollarsToCents(dollars: number): number {
  return Math.round(Number(dollars) * 100);
}

export class OrderRepository {
  async createOrder(params: {
    userId: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    totalAmount: number; // dollars
  }): Promise<DbOrder> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const totalCents = dollarsToCents(params.totalAmount);

      // For now we store everything in total_cents and subtotal_cents, leaving tax/shipping as 0.
      const orderRes = await client.query(
        `
        INSERT INTO orders (user_id, status, subtotal_cents, tax_cents, shipping_cents, total_cents, currency)
        VALUES ($1, $2, $3, 0, 0, $3, 'USD')
        RETURNING id, user_id, status, total_cents, created_at
        `,
        [params.userId, 'pending', totalCents]
      );
      const orderRow = orderRes.rows[0];

      for (const item of params.items) {
        const unitPriceCents = dollarsToCents(item.unitPrice);
        const lineTotalCents = unitPriceCents * item.quantity;

        await client.query(
          `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, line_total_cents)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [orderRow.id, item.productId, item.quantity, unitPriceCents, lineTotalCents]
        );
      }

      await client.query('COMMIT');

      return {
        id: orderRow.id,
        user_id: orderRow.user_id,
        status: orderRow.status,
        total_amount: centsToDollars(Number(orderRow.total_cents)),
        created_at: orderRow.created_at
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async listOrdersForUser(userId: string): Promise<DbOrder[]> {
    const r = await pool.query(
      `
      SELECT id, user_id, status, total_cents, created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return r.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      total_amount: centsToDollars(Number(row.total_cents)),
      created_at: row.created_at
    }));
  }

  async listAllOrders(): Promise<DbOrder[]> {
    const r = await pool.query(
      `
      SELECT id, user_id, status, total_cents, created_at
      FROM orders
      ORDER BY created_at DESC
      `
    );

    return r.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      total_amount: centsToDollars(Number(row.total_cents)),
      created_at: row.created_at
    }));
  }

  async getOrderWithItems(orderId: string): Promise<{ order: DbOrder; items: DbOrderItem[] } | null> {
    const orderRes = await pool.query(
      `
      SELECT id, user_id, status, total_cents, created_at
      FROM orders
      WHERE id = $1
      `,
      [orderId]
    );
    const orderRow = orderRes.rows[0];
    if (!orderRow) return null;

    const itemsRes = await pool.query(
      `
      SELECT id, order_id, product_id, quantity, unit_price_cents, line_total_cents
      FROM order_items
      WHERE order_id = $1
      `,
      [orderId]
    );

    return {
      order: {
        id: orderRow.id,
        user_id: orderRow.user_id,
        status: orderRow.status,
        total_amount: centsToDollars(Number(orderRow.total_cents)),
        created_at: orderRow.created_at
      },
      items: itemsRes.rows.map((row) => ({
        id: row.id,
        order_id: row.order_id,
        product_id: row.product_id,
        quantity: Number(row.quantity),
        unit_price: centsToDollars(Number(row.unit_price_cents)),
        line_total: centsToDollars(Number(row.line_total_cents))
      }))
    };
  }

  async updateStatus(orderId: string, status: DbOrder['status']): Promise<DbOrder | null> {
    const r = await pool.query(
      `
      UPDATE orders
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, user_id, status, total_cents, created_at
      `,
      [orderId, status]
    );

    const row = r.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      total_amount: centsToDollars(Number(row.total_cents)),
      created_at: row.created_at
    };
  }
}

export const orderRepository = new OrderRepository();
