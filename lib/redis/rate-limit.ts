// Rate limiting utilities using Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { redis, isRedisConfigured } from './client';

/**
 * Rate limiting configuration for different endpoints
 */

// Strict rate limit for authentication attempts (5 per 15 minutes)
export const authRateLimit = isRedisConfigured()
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@ratelimit:auth',
    })
  : null;

// Moderate rate limit for password reset (3 per hour)
export const passwordResetRateLimit = isRedisConfigured()
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: '@ratelimit:password-reset',
    })
  : null;

// Moderate rate limit for magic link requests (10 per hour)
export const magicLinkRateLimit = isRedisConfigured()
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: '@ratelimit:magic-link',
    })
  : null;

// Standard rate limit for API requests (100 per minute)
export const apiRateLimit = isRedisConfigured()
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: '@ratelimit:api',
    })
  : null;

// Strict rate limit for signup (3 per day per IP)
export const signupRateLimit = isRedisConfigured()
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '24 h'),
      analytics: true,
      prefix: '@ratelimit:signup',
    })
  : null;

/**
 * Rate limit result type
 */
export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending?: Promise<unknown>;
};

/**
 * Apply rate limit with fallback for when Redis is not configured
 */
export async function applyRateLimit(
  ratelimit: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  // If Redis is not configured, allow all requests but log a warning
  if (!ratelimit || !isRedisConfigured()) {
    console.warn(`Rate limiting disabled - Redis not configured (identifier: ${identifier})`);
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  try {
    const result = await ratelimit.limit(identifier);
    return result;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log the error
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
}

/**
 * Get client identifier for rate limiting
 * Uses IP address or a fallback identifier
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip =
    cfConnectingIp ||
    realIp ||
    (forwarded ? forwarded.split(',')[0].trim() : null) ||
    'unknown';

  return ip;
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

/**
 * Check if rate limit is exceeded and return appropriate error
 */
export function isRateLimited(result: RateLimitResult): boolean {
  return !result.success;
}
