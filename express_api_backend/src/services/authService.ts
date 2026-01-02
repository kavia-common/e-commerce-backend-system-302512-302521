import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler';
import { userRepository } from '../repositories/userRepository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAuthToken } from '../utils/jwt';

/**
 * NOTE: Validation schemas are part of the public contract via route middleware.
 * Do not change them.
 */
export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'customer']).optional()
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

type RegisterInput = z.infer<typeof registerInputSchema>;
type LoginInput = z.infer<typeof loginInputSchema>;

/**
 * Defensive normalization on top of existing validation.
 * This does not change the Zod contract; it helps prevent subtle issues like
 * leading/trailing whitespace in emails.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePassword(password: string): string {
  // Keep password semantics unchanged; only remove accidental surrounding whitespace.
  // (We do NOT alter internal whitespace.)
  return password.trim();
}

export class AuthService {
  // PUBLIC_INTERFACE
  async register(input: RegisterInput) {
    /** Registers a new user and returns { user, token } (JWT). */
    const email = normalizeEmail(input.email);
    const password = normalizePassword(input.password);
    const role = input.role ?? 'customer';

    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ApiError(409, 'Email already registered');

    const passwordHash = await hashPassword(password);
    const user = await userRepository.createUser(email, passwordHash, role);

    // Token payload/claims must remain identical: {id,email,role}
    const token = signAuthToken({ id: user.id, email: user.email, role: user.role });

    return { user: { id: user.id, email: user.email, role: user.role }, token };
  }

  // PUBLIC_INTERFACE
  async login(input: LoginInput) {
    /** Authenticates a user and returns { user, token } (JWT). */
    const email = normalizeEmail(input.email);
    const password = normalizePassword(input.password);

    const user = await userRepository.findByEmail(email);
    // Preserve existing outward behavior: 401 on invalid credentials.
    if (!user) throw new ApiError(401, 'Invalid email or password');

    let ok = false;
    try {
      ok = await verifyPassword(password, user.password_hash);
    } catch {
      // Avoid leaking internal failures; keep same outward contract as invalid credentials.
      ok = false;
    }

    if (!ok) throw new ApiError(401, 'Invalid email or password');

    const token = signAuthToken({ id: user.id, email: user.email, role: user.role });
    return { user: { id: user.id, email: user.email, role: user.role }, token };
  }
}

export const authService = new AuthService();
