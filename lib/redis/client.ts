// Redis client configuration using Upstash
import { Redis } from '@upstash/redis';

// Upstash Redis client (serverless-friendly)
// Get your credentials from: https://console.upstash.com/
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Helper to check if Redis is configured
export function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// Helper to safely get a value from Redis
export async function safeGet<T>(key: string): Promise<T | null> {
  if (!isRedisConfigured()) {
    console.warn('Redis not configured - skipping cache get');
    return null;
  }

  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

// Helper to safely set a value in Redis
export async function safeSet(
  key: string,
  value: any,
  expirationSeconds?: number
): Promise<boolean> {
  if (!isRedisConfigured()) {
    console.warn('Redis not configured - skipping cache set');
    return false;
  }

  try {
    if (expirationSeconds) {
      await redis.set(key, value, { ex: expirationSeconds });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

// Helper to safely delete a key from Redis
export async function safeDel(key: string): Promise<boolean> {
  if (!isRedisConfigured()) {
    console.warn('Redis not configured - skipping cache delete');
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}
