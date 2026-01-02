import crypto from 'crypto';

const KEYLEN = 64;

// PUBLIC_INTERFACE
export async function hashPassword(password: string): Promise<string> {
  /** Hash a password using scrypt with random salt. Returns `salt:hash` */
  const salt = crypto.randomBytes(16).toString('hex');

  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, (err, key) => {
      if (err) reject(err);
      else resolve(key as Buffer);
    });
  });

  return `${salt}:${derived.toString('hex')}`;
}

// PUBLIC_INTERFACE
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  /** Verify a password against a stored `salt:hash` string. */
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;

  // Basic sanity check: if hex string is malformed, treat as mismatch.
  if (hashHex.length % 2 !== 0) return false;

  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, (err, key) => {
      if (err) reject(err);
      else resolve(key as Buffer);
    });
  });

  const storedBuf = Buffer.from(hashHex, 'hex');

  // timingSafeEqual throws if buffer lengths differ; treat as mismatch.
  if (storedBuf.length !== derived.length) return false;

  return crypto.timingSafeEqual(derived, storedBuf);
}
