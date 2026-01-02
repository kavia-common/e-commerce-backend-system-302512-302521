import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler';
import { productRepository } from '../repositories/productRepository';

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative()
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional()
});

export class ProductService {
  async list() {
    return productRepository.list();
  }

  async get(id: string) {
    const p = await productRepository.getById(id);
    if (!p) throw new ApiError(404, 'Product not found');
    return p;
  }

  async create(input: z.infer<typeof createProductSchema>) {
    return productRepository.create({
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      stock: input.stock
    });
  }

  async update(id: string, input: z.infer<typeof updateProductSchema>) {
    const updated = await productRepository.update(id, input);
    if (!updated) throw new ApiError(404, 'Product not found');
    return updated;
  }

  async remove(id: string) {
    const ok = await productRepository.remove(id);
    if (!ok) throw new ApiError(404, 'Product not found');
    return { deleted: true };
  }
}

export const productService = new ProductService();
