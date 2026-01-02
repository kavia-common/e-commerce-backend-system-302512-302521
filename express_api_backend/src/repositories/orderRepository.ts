import { pool } from '../db/pool';

export type DbOrder = {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  total_amount: number;
  created_at?: string;
};

export type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

export class OrderRepository {
  async createOrder(params: {
    userId: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    totalAmount: number;
  }): Promise<DbOrder> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderRes = await client.query(
        'INSERT INTO orders (user_id, status, total_amount) VALUES ($1, $2, $3) RETURNING id, user_id, status, total_amount, created_at',
        [params.userId, 'pending', params.totalAmount]
      );
      const order = orderRes.rows[0] as DbOrder;

      for (const item of params.items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [order.id, item.productId, item.quantity, item.unitPrice]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async listOrdersForUser(userId: string): Promise<DbOrder[]> {
    const r = await pool.query(
      'SELECT id, user_id, status, total_amount, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return r.rows;
  }

  async listAllOrders(): Promise<DbOrder[]> {
    const r = await pool.query('SELECT id, user_id, status, total_amount, created_at FROM orders ORDER BY created_at DESC');
    return r.rows;
  }

  async getOrderWithItems(orderId: string): Promise<{ order: DbOrder; items: DbOrderItem[] } | null> {
    const orderRes = await pool.query(
      'SELECT id, user_id, status, total_amount, created_at FROM orders WHERE id = $1',
      [orderId]
    );
    const order = orderRes.rows[0] as DbOrder | undefined;
    if (!order) return null;

    const itemsRes = await pool.query(
      'SELECT id, order_id, product_id, quantity, unit_price FROM order_items WHERE order_id = $1',
      [orderId]
    );
    return { order, items: itemsRes.rows as DbOrderItem[] };
  }

  async updateStatus(orderId: string, status: DbOrder['status']): Promise<DbOrder | null> {
    const r = await pool.query(
      'UPDATE orders SET status = $2 WHERE id = $1 RETURNING id, user_id, status, total_amount, created_at',
      [orderId, status]
    );
    return r.rows[0] ?? null;
  }
}

export const orderRepository = new OrderRepository();
