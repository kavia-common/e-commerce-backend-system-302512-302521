import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getRequiredEnv } from '../config/env';
import { ApiError } from '../middleware/errorHandler';
import { userRepository } from '../repositories/userRepository';
import { hashPassword, verifyPassword } from '../utils/password';

export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'customer']).optional()
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export class AuthService {
  async register(input: z.infer<typeof registerInputSchema>) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ApiError(409, 'Email already registered');

    const passwordHash = await hashPassword(input.password);
    const role = input.role ?? 'customer';
    const user = await userRepository.createUser(input.email, passwordHash, role);

    let secret: string;
    try {
      secret = getRequiredEnv().JWT_SECRET;
    } catch (e) {
      throw new ApiError(503, 'Auth service not configured', e instanceof Error ? e.message : e);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });
    return { user: { id: user.id, email: user.email, role: user.role }, token };
  }

  async login(input: z.infer<typeof loginInputSchema>) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new ApiError(401, 'Invalid email or password');

    const ok = await verifyPassword(input.password, user.password_hash);
    if (!ok) throw new ApiError(401, 'Invalid email or password');

    let secret: string;
    try {
      secret = getRequiredEnv().JWT_SECRET;
    } catch (e) {
      throw new ApiError(503, 'Auth service not configured', e instanceof Error ? e.message : e);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });
    return { user: { id: user.id, email: user.email, role: user.role }, token };
  }
}

export const authService = new AuthService();
