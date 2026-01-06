import { createHash, randomBytes } from 'crypto';

export function generateDeleteToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashDeleteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function verifyDeleteToken(token: string, hash: string): boolean {
  return hashDeleteToken(token) === hash;
}
