import { createHash } from 'crypto';

export function getClientIP(request: Request): string {
  // Try various headers (Vercel, Cloudflare, etc.)
  const headers = request.headers;
  
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback
  return '127.0.0.1';
}

export function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}
