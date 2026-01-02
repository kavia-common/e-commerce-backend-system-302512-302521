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
  async createOrder(userId: string, input: z.infer<typeof createOrderSchema>) {
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

  async listForUser(userId: string) {
    return orderRepository.listOrdersForUser(userId);
  }

  async listAll() {
    return orderRepository.listAllOrders();
  }

  async get(orderId: string, requester: { userId: string; role: 'admin' | 'customer' }) {
    const data = await orderRepository.getOrderWithItems(orderId);
    if (!data) throw new ApiError(404, 'Order not found');

    if (requester.role !== 'admin' && data.order.user_id !== requester.userId) {
      throw new ApiError(403, 'Forbidden');
    }
    return data;
  }

  async updateStatus(orderId: string, status: z.infer<typeof updateOrderStatusSchema>['status']) {
    const updated = await orderRepository.updateStatus(orderId, status);
    if (!updated) throw new ApiError(404, 'Order not found');
    return updated;
  }
}

export const orderService = new OrderService();
