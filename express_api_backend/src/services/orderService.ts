import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler';
import { orderRepository } from '../repositories/orderRepository';
import { productRepository } from '../repositories/productRepository';

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive()
    })
  ).min(1)
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled'])
});

export class OrderService {
  // PUBLIC_INTERFACE
  async createOrder(userId: string, input: z.infer<typeof createOrderSchema>) {
    /** Creates an order for the given user and decrements stock for ordered items. */
    // Load all products and compute totals + validate stock
    const enriched: { productId: string; quantity: number; unitPrice: number }[] = [];
    let total = 0;

    for (const item of input.items) {
      const p = await productRepository.getById(item.productId);
      if (!p) throw new ApiError(404, `Product not found: ${item.productId}`);
      if (p.stock < item.quantity) throw new ApiError(400, `Insufficient stock for product: ${p.name}`);
      enriched.push({ productId: p.id, quantity: item.quantity, unitPrice: Number(p.price) });
      total += Number(p.price) * item.quantity;
    }

    // Decrement stock (simple approach; if needed, move to transaction with FOR UPDATE)
    for (const item of input.items) {
      const p = await productRepository.getById(item.productId);
      if (!p) continue;
      await productRepository.update(p.id, { stock: p.stock - item.quantity });
    }

    return orderRepository.createOrder({
      userId,
      items: enriched,
      totalAmount: total
    });
  }

  // PUBLIC_INTERFACE
  async listForUser(userId: string) {
    /** Lists orders belonging to a specific user. */
    return orderRepository.listOrdersForUser(userId);
  }

  // PUBLIC_INTERFACE
  async listAll() {
    /** Lists all orders (intended for admin use). */
    return orderRepository.listAllOrders();
  }

  // PUBLIC_INTERFACE
  async get(orderId: string, requester: { userId: string; role: 'admin' | 'customer' }) {
    /** Gets an order (with items) and enforces owner-or-admin authorization. */
    const data = await orderRepository.getOrderWithItems(orderId);
    if (!data) throw new ApiError(404, 'Order not found');

    if (requester.role !== 'admin' && data.order.user_id !== requester.userId) {
      throw new ApiError(403, 'Forbidden');
    }
    return data;
  }

  // PUBLIC_INTERFACE
  async updateStatus(orderId: string, status: z.infer<typeof updateOrderStatusSchema>['status']) {
    /** Updates order status (intended for admin use). */
    const updated = await orderRepository.updateStatus(orderId, status);
    if (!updated) throw new ApiError(404, 'Order not found');
    return updated;
  }
}

export const orderService = new OrderService();
