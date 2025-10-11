# Redis Setup Guide for White Glove

This guide explains how Redis is integrated into the White Glove platform for rate limiting and caching.

## Why Redis?

Redis provides:
- **Rate Limiting**: Prevent abuse of authentication endpoints
- **Session Management**: Fast session lookups (future enhancement)
- **Caching**: Cache frequently accessed data (future enhancement)
- **Serverless Compatibility**: Using Upstash Redis for edge deployment

## Setup Options

### Option 1: Upstash Redis (Recommended for Production)

Upstash is a serverless Redis provider that works perfectly with Vercel and Next.js.

#### Steps:

1. **Create Free Upstash Account**
   - Go to https://console.upstash.com/
   - Sign up for a free account

2. **Create a Redis Database**
   - Click "Create Database"
   - Choose a region close to your users
   - Select "Global" for worldwide deployment
   - Free tier includes: 10,000 commands/day

3. **Get Credentials**
   - Click on your database
   - Copy the REST API credentials:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

4. **Add to Environment Variables**
   ```bash
   # .env.local
   UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```

5. **Verify Setup**
   ```bash
   npm run dev
   # Make a request to any auth endpoint
   # Check for X-RateLimit headers in the response
   ```

### Option 2: Local Redis (Development Only)

For local development, you can run Redis locally.

#### Steps:

1. **Install Redis**
   ```bash
   # macOS
   brew install redis

   # Ubuntu/Debian
   sudo apt-get install redis-server

   # Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Start Redis**
   ```bash
   redis-server
   ```

3. **Convert to REST API**

   Since our code uses the REST API, you'd need to use Upstash emulator or modify the code to use `ioredis` instead. **We recommend using Upstash even for development** for consistency.

### Option 3: No Redis (Graceful Degradation)

The application works without Redis! Rate limiting will be **disabled** but all other features function normally.

- Rate limit checks will log warnings but allow requests
- Perfect for initial development and testing
- Not recommended for production

## Rate Limiting Configuration

Rate limits are configured in [lib/redis/rate-limit.ts](../lib/redis/rate-limit.ts):

```typescript
// Authentication attempts: 5 per 15 minutes
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: '@ratelimit:auth',
});

// Magic link requests: 10 per hour
export const magicLinkRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: '@ratelimit:magic-link',
});

// Password reset: 3 per hour
export const passwordResetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: '@ratelimit:password-reset',
});

// Signup: 3 per day per IP
export const signupRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '24 h'),
  prefix: '@ratelimit:signup',
});
```

### Customizing Rate Limits

To adjust rate limits, modify the values in `lib/redis/rate-limit.ts`:

```typescript
// Example: Increase auth attempts to 10 per 15 minutes
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'), // Changed from 5 to 10
  prefix: '@ratelimit:auth',
});
```

## Rate Limit Response Headers

All rate-limited endpoints return these headers:

```
X-RateLimit-Limit: 10          # Maximum requests allowed
X-RateLimit-Remaining: 7       # Requests remaining
X-RateLimit-Reset: 1678901234  # Unix timestamp when limit resets
```

### Example Response

**Success (within limit):**
```bash
HTTP/1.1 200 OK
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1678901234
Content-Type: application/json

{"success": true, "message": "Magic link sent"}
```

**Rate Limit Exceeded:**
```bash
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1678901234
Content-Type: application/json

{"error": "Too many requests. Please try again later."}
```

## Testing Rate Limits

### Manual Testing

```bash
# Send multiple requests to test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/auth/magic-link \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","userType":"client"}'
  echo ""
done
```

### Automated Testing

Run the test script:

```bash
chmod +x scripts/test-auth-flows.sh
./scripts/test-auth-flows.sh
```

### Verify Rate Limit Data in Redis

If you're using Upstash:

1. Go to Upstash Console
2. Select your database
3. Click "Data Browser"
4. Search for keys with prefix `@ratelimit:`
5. You'll see keys like `@ratelimit:auth:1.2.3.4`

## Monitoring

### View Rate Limit Analytics

Upstash provides built-in analytics:

1. Go to Upstash Console
2. Select your database
3. Click "Metrics"
4. View:
   - Total requests
   - Rate limit hits
   - Peak usage times

### Custom Monitoring

Add custom logging to track rate limit hits:

```typescript
// In lib/redis/rate-limit.ts
export async function applyRateLimit(
  ratelimit: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  // ... existing code ...

  const result = await ratelimit.limit(identifier);

  // Log rate limit hits
  if (!result.success) {
    console.log(`[RATE_LIMIT] Blocked request from ${identifier}`);
    // Send to monitoring service (e.g., Sentry, DataDog)
  }

  return result;
}
```

## Production Considerations

### 1. Scaling

Upstash Redis scales automatically. No configuration needed.

### 2. Cost

Upstash pricing (as of 2024):
- **Free Tier**: 10,000 commands/day
- **Pay as you go**: $0.20 per 100K commands
- **Pro Plan**: Starting at $10/month

### 3. Data Persistence

Rate limit data is ephemeral (expires automatically). No backups needed.

### 4. Regional Deployment

For global apps:
- Use Upstash "Global" database
- Automatically replicates to multiple regions
- Low latency worldwide

### 5. Security

Rate limits are applied per IP address:
- Uses `x-forwarded-for` header
- Supports Cloudflare's `cf-connecting-ip`
- Falls back to connection IP

## Troubleshooting

### Issue: Rate limits not working

**Check:**
1. Environment variables set correctly
2. Redis credentials valid
3. No firewall blocking Upstash

**Debug:**
```typescript
import { isRedisConfigured } from '@/lib/redis/client';
console.log('Redis configured:', isRedisConfigured());
```

### Issue: Rate limits too strict

**Solution:**
Adjust limits in `lib/redis/rate-limit.ts`

### Issue: Rate limits not resetting

**Check:**
1. Upstash database not paused
2. System clock correct
3. Redis keys expiring properly

### Issue: Different rate limits per user

**Solution:**
Currently limits are IP-based. For user-based limits:

```typescript
// Instead of IP, use user ID
const identifier = session.user.id;
const result = await applyRateLimit(authRateLimit, identifier);
```

## Future Enhancements

Planned Redis features:

1. **Session Storage**
   - Store sessions in Redis for faster lookups
   - Enable cross-device session management

2. **Caching**
   - Cache frequently accessed events
   - Cache venue/vendor lists
   - Cache user preferences

3. **Real-time Features**
   - Redis Pub/Sub for real-time updates
   - Live notifications
   - Chat message queueing

4. **Analytics**
   - Track popular events
   - Monitor user activity patterns
   - Generate usage reports

## References

- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Upstash Rate Limiting](https://github.com/upstash/ratelimit)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Next.js Rate Limiting Guide](https://nextjs.org/docs/app/building-your-application/routing/middleware#rate-limiting)
