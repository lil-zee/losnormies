import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a safe redis client or a dummy one
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimitInstance: any;

if (url && token && !url.includes('placeholder')) {
  try {
    const redis = new Redis({
      url,
      token,
    });

    ratelimitInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
        `${parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10)} s`
      ),
      analytics: true,
      prefix: 'canvas-board',
    });
  } catch (error) {
    console.warn('Failed to initialize Upstash Redis, rate limiting disabled:', error);
  }
}

// Fallback dummy limiter if Upstash is not configured
if (!ratelimitInstance) {
  ratelimitInstance = {
    limit: async () => ({ success: true, remaining: 10 }),
  };
}

export const ratelimit = ratelimitInstance;
